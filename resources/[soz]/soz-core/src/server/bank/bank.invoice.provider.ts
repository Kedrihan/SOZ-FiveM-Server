import { JobPermissionService } from '@public/client/job/job.permission.service';
import { JobService } from '@public/client/job/job.service';
import { Once, OnceStep, OnEvent } from '@public/core/decorators/event';
import { Rpc } from '@public/core/decorators/rpc';
import { Invoice } from '@public/shared/bank';
import { ClientEvent, ServerEvent } from '@public/shared/event';
import { JobPermission } from '@public/shared/job';
import { Monitor } from '@public/shared/monitor';
import { PlayerData } from '@public/shared/player';
import { getDistance, Vector4 } from '@public/shared/polyzone/vector';
import { RpcServerEvent } from '@public/shared/rpc';

import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { PrismaService } from '../database/prisma.service';
import { InventoryManager } from '../inventory/inventory.manager';
import { Notifier } from '../notifier';
import { PlayerMoneyService } from '../player/player.money.service';
import { PlayerService } from '../player/player.service';
import { BankAccountRepository } from '../repository/bank.account.repository';
import { Exportable } from '@public/core/decorators/exports';
import { isOk } from '@public/shared/result';

@Provider()
export class BankInvoiceProvider {
    private Invoices: Record<string, Record<number, Invoice>> = {};

    @Inject(BankAccountRepository)
    private bankAccountRepository: BankAccountRepository;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(PrismaService)
    private prismaService: PrismaService;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(JobPermissionService)
    private jobPermissionService: JobPermissionService;

    @Inject(Monitor)
    private monitor: Monitor;

    @Inject(InventoryManager)
    private inventoryManager: InventoryManager;

    @Inject(PlayerMoneyService)
    private playerMoneyService: PlayerMoneyService;

    @Inject(JobService)
    private jobService: JobService;

    @Once(OnceStep.DatabaseConnected)
    public async onOnce(): Promise<void> {
        const invoices = await this.prismaService.invoices.findMany({
            where: {
                payed: false,
                refused: false,
            },
        });

        for (const invoice of invoices) {
            if (invoice.targetAccount === null) {
                continue;
            }

            this.Invoices[invoice.targetAccount] = this.Invoices[invoice.targetAccount] || {};
            this.Invoices[invoice.targetAccount][invoice.id] = {
                id: invoice.id,
                label: invoice.label,
                amount: invoice.amount,
                createdAt: invoice.created_at.getTime(),
                payed: invoice.payed,
                refused: invoice.refused,
                citizenid: invoice.citizenid,
                targetAccount: invoice.targetAccount,
                emitter: invoice.emitter,
                emitterName: invoice.emitterName,
                emitterSafe: invoice.emitterSafe,
            };
        }
    }

    @OnEvent(ServerEvent.BANK_SEND_INVOICE)
    public async onSendInvoice(
        source: number,
        targetSource: number,
        label: string,
        amount: number,
        kind: string,
    ): Promise<void> {
        const player = this.playerService.getPlayer(source);
        const target = this.playerService.getPlayer(targetSource);

        if (amount === null || amount <= 0 || player === null || target === null || player === target) {
            return;
        }

        if (this.inventoryManager.removeItemFromInventory(source, 'paper', 1)) {
            if (await this.createInvoice(player, target, target.charinfo.account, label, amount, kind)) {
                this.notifier.notify(source, 'Votre facture a bien été émise', 'success');
            }
        } else {
            this.notifier.notify(source, "Vous n'avez pas de papier", 'error');
        }
    }

    @OnEvent(ServerEvent.BANK_SEND_SOCIETY_INVOICE)
    public async onSendSocietyInvoice(
        source: number,
        targetSource: number,
        label: string,
        amount: number,
        kind: string,
    ): Promise<void> {
        const player = this.playerService.getPlayer(source);
        const target = this.playerService.getPlayer(targetSource);

        if (amount === null || amount <= 0 || player === null || target === null || player === target) {
            return;
        }
        if (this.inventoryManager.removeItemFromInventory(source, 'paper', 1)) {
            if (await this.createInvoice(player, target, target.job.id, label, amount, kind)) {
                this.notifier.notify(source, 'Votre facture a bien été émise', 'success');
            }
        } else {
            this.notifier.notify(source, "Vous n'avez pas de papier", 'error');
        }
    }

    @OnEvent(ServerEvent.BANK_ACCEPT_INVOICE)
    public async onAcceptInvoice(source: number, invoiceId: number, marked: number): Promise<void> {
        const player = this.playerService.getPlayer(source);
        if (player === null) {
            return;
        }
        for (const [account, invoices] of Object.entries(this.Invoices)) {
            for (const [id, _] of Object.entries(invoices)) {
                if (Number(id) === invoiceId) {
                    await this.payInvoice(player, account, invoiceId, marked);
                    return;
                }
            }
        }
        this.notifier.notify(source, "Vous n'avez pas de facture à payer", 'info');
    }
    @OnEvent(ServerEvent.BANK_REFUSE_INVOICE)
    public async onRefuseInvoice(source: number, invoiceId: number): Promise<void> {
        const player = this.playerService.getPlayer(source);
        if (player === null) {
            return;
        }
        for (const [account, invoices] of Object.entries(this.Invoices)) {
            for (const [id, _] of Object.entries(invoices)) {
                if (Number(id) === invoiceId) {
                    this.rejectInvoice(player, account, invoiceId);
                    return;
                }
            }
        }
        this.notifier.notify(source, "Vous n'avez pas de facture à payer", 'info');
    }

    @Exportable('GetAllPlayerInvoices')
    public async onGetAllPlayerInvoices(source: number): Promise<Record<number, Invoice>> {
        const player = this.playerService.getPlayer(source);
        if (player === null) {
            return null;
        }
        for (const [account, invoices] of Object.entries(this.Invoices)) {
            if (this.playerHaveAccessToInvoices(player, account)) {
                return invoices;
            }
        }
        return null;
    }

    private async payInvoice(player: PlayerData, account: string, id: number, marked: number): Promise<void> {
        if (
            !this.playerHaveAccessToInvoices(player, account) ||
            !this.Invoices[account] ||
            !this.Invoices[account][id]
        ) {
            return;
        }

        const invoice = this.Invoices[account][id];
        const emitter = this.playerService.getPlayerByCitizenId(invoice.emitter);
        if (player.charinfo.account === account) {
            if (marked !== null) {
                const moneyAmount = player.money.money;
                const moneyMarkedAmount = player.money.marked_money;
                if (moneyAmount + moneyMarkedAmount >= invoice.amount) {
                    let moneyTake = 0;
                    let markedMoneyTake = 0;
                    if (moneyMarkedAmount >= invoice.amount) {
                        markedMoneyTake = invoice.amount;
                    } else {
                        markedMoneyTake = moneyMarkedAmount;
                        moneyTake = invoice.amount - moneyMarkedAmount;
                    }
                    this.playerMoneyService.remove(player.source, moneyTake, 'money');
                    this.playerMoneyService.remove(player.source, markedMoneyTake, 'marked_money');
                    let success = this.bankAccountRepository.addMoney(invoice.emitterSafe, moneyTake, 'money');
                    if (!success) {
                        this.notifier.notify(
                            player.source,
                            "Le coffre de destination n'a pas de place pour cette somme",
                            'error',
                        );
                        this.playerMoneyService.add(player.source, moneyTake, 'money');
                        this.playerMoneyService.add(player.source, markedMoneyTake, 'marked_money');
                        return;
                    }

                    success = this.bankAccountRepository.addMoney(invoice.emitterSafe, markedMoneyTake, 'marked_money');
                    if (!success) {
                        this.notifier.notify(
                            player.source,
                            "Le coffre de destination n'a pas de place pour cette somme",
                            'error',
                        );
                        this.playerMoneyService.add(player.source, moneyTake, 'money');
                        this.playerMoneyService.add(player.source, markedMoneyTake, 'marked_money');
                        this.bankAccountRepository.removeMoney(invoice.emitterSafe, moneyTake, 'money');
                        return;
                    }
                } else {
                    this.notifier.notify(player.source, "Vous n'avez pas assez d'argent", 'error');
                    return;
                }
            } else if (this.playerMoneyService.remove(player.source, invoice.amount, 'money')) {
                const success = this.bankAccountRepository.addMoney(invoice.emitterSafe, invoice.amount, 'money');
                if (!success) {
                    this.notifier.notify(
                        player.source,
                        "Le coffre de destination n'a pas de place pour cette somme",
                        'error',
                    );
                    this.playerMoneyService.add(player.source, invoice.amount, 'money');
                    return;
                }
            } else {
                this.notifier.notify(player.source, "Vous n'avez pas assez d'argent", 'error');
                return;
            }
            await this.prismaService.invoices.update({
                where: {
                    id: invoice.id,
                },
                data: {
                    payed: true,
                },
            });
            this.notifier.notify(player.source, 'Vous avez ~g~payé~s~ votre facture', 'success', 10000);
            if (emitter) {
                this.notifier.notify(emitter.source, `Votre facture ~b~${invoice.label}~s~ a été ~g~payée`, 'success');
            }
            this.monitor.publish(
                'invoice_pay',
                {
                    player_source: player.source,
                    invoice_kind: 'invoice',
                    invoice_job: '',
                },
                {
                    target_source: (emitter && emitter.source) || null,
                    id: id,
                    amount: invoice.amount,
                    target_account: invoice.emitterSafe,
                    source_account: invoice.targetAccount,
                },
            );
            delete this.Invoices[account][id];
            TriggerClientEvent(ClientEvent.BANK_INVOICE_PAID, player.source, id);
        } else {
            const result = await this.bankAccountRepository.transferMoney(
                invoice.targetAccount,
                invoice.emitterSafe,
                invoice.amount,
            );
            if (isOk(result)) {
                this.prismaService.invoices.update({
                    where: {
                        id: invoice.id,
                    },
                    data: {
                        payed: true,
                    },
                });
                this.notifier.notify(player.source, 'Vous avez ~g~payé~s~ la facture de la société', 'success', 10000);
                if (emitter) {
                    this.notifier.notify(
                        emitter.source,
                        `Votre facture ~b~${invoice.label}~s~ a été ~g~payée`,
                        'success',
                    );
                }
                this.monitor.publish(
                    'invoice_pay',
                    {
                        player_source: player.source,
                        invoice_kind: 'invoice',
                        invoice_job: player.job.id,
                    },
                    {
                        target_source: (emitter && emitter.source) || null,
                        id: id,
                        amount: invoice.amount,
                        target_account: invoice.emitterSafe,
                        source_account: invoice.targetAccount,
                    },
                );
                delete this.Invoices[account][id];
                TriggerClientEvent(ClientEvent.BANK_INVOICE_PAID, player.source, id);
            } else {
                this.notifier.notify(player.source, '~r~Echec~s~ du paiement la facture de la société', 'error', 10000);
            }
        }
    }
    private rejectInvoice(player: PlayerData, account: string, id: number): void {
        if (
            !this.playerHaveAccessToInvoices(player, account) ||
            !this.Invoices[account] ||
            !this.Invoices[account][id]
        ) {
            return;
        }

        const invoice = this.Invoices[account][id];
        const target = this.playerService.getPlayerByCitizenId(invoice.citizenid);
        const emitter = this.playerService.getPlayerByCitizenId(invoice.emitter);
        if (player.charinfo.account === account) {
            this.notifier.notify(target.source, 'Vous avez refusé votre facture', 'info');
            if (emitter) {
                this.notifier.notify(emitter.source, `Votre facture ${invoice.label} a été refusée`, 'info');
            }
            this.monitor.publish(
                'invoice_refuse',
                {
                    player_source: target.source,
                    invoice_kind: 'invoice',
                    invoice_job: '',
                },
                {
                    target_source: emitter ? emitter.source : null,
                    id: id,
                    amount: invoice.amount,
                    target_account: invoice.emitterSafe,
                    source_account: invoice.targetAccount,
                    title: invoice.label,
                },
            );
        } else {
            this.notifier.notify(target.source, 'Vous avez refusé la facture de la société', 'error');
            if (emitter) {
                this.notifier.notify(emitter.source, `Votre facture ${invoice.label} a été refusée`, 'info');
            }
            this.monitor.publish(
                'invoice_refuse',
                {
                    player_source: target.source,
                    invoice_kind: 'invoice',
                    invoice_job: '',
                },
                {
                    target_source: emitter ? emitter.source : null,
                    id: id,
                    amount: invoice.amount,
                    target_account: invoice.emitterSafe,
                    source_account: invoice.targetAccount,
                    title: invoice.label,
                },
            );
        }
        this.prismaService.invoices.update({
            where: {
                id: invoice.id,
            },
            data: {
                refused: true,
            },
        });
        delete this.Invoices[account][id];
        TriggerClientEvent(ClientEvent.BANK_INVOICE_REJECTED, source, id);
    }
    private playerHaveAccessToInvoices(player: PlayerData, account: string): boolean {
        if (player.charinfo.account === account) {
            return true;
        }
        return this.jobPermissionService.hasPermission(player.job.id, JobPermission.SocietyBankInvoices);
    }
    private async createInvoice(
        emitter: PlayerData,
        target: PlayerData,
        targetAccount: string,
        label: string,
        amount: number,
        kind: string,
    ): Promise<boolean> {
        const dist = getDistance(
            GetEntityCoords(GetPlayerPed(emitter.source)) as Vector4,
            GetEntityCoords(GetPlayerPed(target.source)) as Vector4,
        );
        if (dist > 5) {
            this.notifier.notify(emitter.source, "Personne n'est à portée de vous", 'error');
            return false;
        }
        const allJobs = this.jobService.getJobs();
        const id = (
            await this.prismaService.invoices.create({
                data: {
                    citizenid: target.citizenid,
                    emitter: emitter.citizenid,
                    emitterName: allJobs[emitter.job.id].label,
                    emitterSafe: `safe_${emitter.job.id}`,
                    targetAccount: targetAccount,
                    label: label,
                    amount: amount,
                    kind: kind || 'invoice',
                },
            })
        ).id;
        if (id) {
            if (!this.Invoices[targetAccount]) {
                this.Invoices[targetAccount] = {};
            }
            this.Invoices[targetAccount][id] = {
                id: id,
                citizenid: target.citizenid,
                emitter: emitter.citizenid,
                emitterName: allJobs[emitter.job.id].label,
                emitterSafe: `safe_${emitter.job.id}`,
                targetAccount: targetAccount,
                label: label,
                amount: amount,
                createdAt: new Date().getTime(),
                payed: false,
                refused: false,
            };
            TriggerClientEvent(
                ClientEvent.BANK_INVOICE_RECEIVED,
                target.source,
                id,
                label,
                amount,
                allJobs[emitter.job.id].label,
            );
            let invoiceJob = '';
            if (targetAccount !== target.charinfo.account) {
                invoiceJob = target.job.id;
            }
            this.monitor.publish(
                'invoice_emit',
                {
                    player_source: emitter.source,
                    invoice_kind: kind || 'invoice',
                    invoice_job: invoiceJob,
                },
                {
                    target_source: target.source,
                    position: GetEntityCoords(GetPlayerPed(emitter.source)),
                    title: label,
                    id: id,
                    amount: amount,
                    target_account: targetAccount,
                },
            );
            return true;
        }
        return false;
    }
}
