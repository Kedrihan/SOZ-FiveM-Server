import { Once, OnceStep, OnEvent } from '@public/core/decorators/event';
import { Invoice } from '@public/shared/bank';
import { ServerEvent } from '@public/shared/event';
import { Monitor } from '@public/shared/monitor';

import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { PrismaService } from '../database/prisma.service';
import { Notifier } from '../notifier';
import { PlayerService } from '../player/player.service';
import { BankAccountService } from './bank.account.service';
import { PlayerData } from '@public/shared/player';

@Provider()
export class BankInvoiceProvider {
    private Invoices: Record<string, Record<number, Invoice>> = {};

    @Inject(BankAccountService)
    private bankAccountService: BankAccountService;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(PrismaService)
    private prismaService: PrismaService;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(Monitor)
    private monitor: Monitor;

    @Once(OnceStep.DatabaseConnected)
    public async onOnce() {
        const invoices = await this.prismaService.invoice.findMany({
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
            this.Invoices[invoice.targetAccount][invoice.id] = invoice;
        }
    }

    @OnEvent(ServerEvent.BANK_REFUSE_INVOICE)
    public async onRefuseInvoice(source: number, invoiceId: number) {
        const player = this.playerService.getPlayer(source);
        if (player === null) {
            return;
        }
        for (const [account, invoices] of Object.entries(this.Invoices)) {
            for (const [id, _] of Object.entries(invoices)) {
                if (id === invoiceId) {
                    this.rejectInvoice(player, account, invoiceId);
                    return;
                }
            }
        }
        this.notifier.notify(source, "Vous n'avez pas de facture à payer", 'info');
    }
    private rejectInvoice(player: PlayerData, account: string, id: number): boolean {
        if (!this.playerHaveAccessToInvoices(player, account)) {
            return false;
        }
        if (!this.Invoices[account]) {
            return false;
        }
        if (!this.Invoices[account][id]) {
            return false;
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
                }
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
                }
            );
        }
        this.prismaService.invoice.update({
            where: {
                id: invoice.id,
            },
            data: {
                refused: true,
            },
        });
        delete this.Invoices[account][id];
        TriggerClientEvent("banking:client:invoiceRejected", source, id)
    }
    /*
    
    local function RejectInvoice(PlayerData, account, id)

    MySQL.update.await("UPDATE invoices SET refused = true WHERE id = ? AND payed = false AND refused = false", {
        invoice.id,
    })
    Invoices[account][id] = nil
    TriggerClientEvent("banking:client:invoiceRejected", Player.PlayerData.source, id)

    return true
end
        */
}
