import { Inject, Injectable } from '@core/decorators/injectable';
import { Invoice } from '@public/shared/bank';
import { Err, Ok, Result } from '@public/shared/result';

import { PrismaService } from '../database/prisma.service';
import { ClientEvent } from '@public/shared/event';
import { PlayerService } from '@public/server/player/player.service';
import { PlayerData } from '@public/shared/player';
import { formatISO } from 'date-fns';

@Injectable()
export class BankService {
    @Inject(PrismaService)
    private prismaService: PrismaService;

    @Inject(PlayerService)
    private playerService: PlayerService;

    public transferBankMoney(
        source: string,
        target: string,
        amount: number,
        allowOverflow = false,
    ): Promise<Result<boolean, string>> {
        return new Promise((resolve) => {
            exports['soz-bank'].TransferMoney(
                source,
                target,
                amount,
                (success, reason) => {
                    if (success) {
                        resolve(Ok(true));
                    } else {
                        resolve(Err(reason));
                    }
                },
                allowOverflow,
            );
        });
    }

    public transferCashMoney(source: string, target: number, amount: number): Promise<Result<boolean, string>> {
        return new Promise((resolve) => {
            exports['soz-bank'].TransferCashMoney(source, target, amount, (success, reason) => {
                if (success) {
                    resolve(Ok(true));
                } else {
                    resolve(Err(reason));
                }
            });
        });
    }

    public addAccountMoney(
        account: any,
        amount: number,
        type: 'money' | 'marked_money' = 'money',
        allowOverflow = false,
    ): boolean {
        return exports['soz-bank'].AddAccountMoney(account, amount, type, allowOverflow);
    }

    public getAllInvoicesForPlayer(source: number): Record<string, Invoice> {
        return exports['soz-bank'].GetAllInvoicesForPlayer(source);
    }

    public payInvoice(source: number, invoiceId: number, marked: boolean) {
        return exports['soz-bank'].PayInvoice(source, invoiceId, marked);
    }

    public async getAccountid(citizenId) {
        const bankAccount = await this.prismaService.bank_accounts.findFirst({
            where: {
                citizenid: citizenId,
            },
        });
        return bankAccount.accountid;
    }

    public addMoney(
        targetAccount: string,
        amount: number,
        type: 'money' | 'marked_money' = 'money',
        allowOverflow = false,
    ) {
        exports['soz-bank'].AddMoney(targetAccount, amount, type, allowOverflow);
    }

    public clearAccount(targetAccount: string) {
        exports['soz-bank'].ClearAccount(targetAccount);
    }

    public getAccountMoney(accountName: string, type: 'money' | 'marked_money' = 'money'): number {
        return exports['soz-bank'].GetAccountMoney(accountName, type);
    }

    async addBankTransaction(emitterAccount: string, targetAccount: string, amount: number) {
        const target = this.playerService.getPlayerByBankAccount(targetAccount);
        const emitter = this.playerService.getPlayerByBankAccount(emitterAccount);
        const targetNames: { [key: string]: string } = {
            player: "Retrait d'argent",
            gouv: 'Radar',
        };

        const targetName = targetNames[targetAccount] || target.charinfo.firstname + ' ' + target.charinfo.lastname;

        const emitterName =
            emitterAccount == 'player'
                ? "Dépôt d'argent"
                : emitter.charinfo.firstname + ' ' + emitter.charinfo.lastname;
        const transaction = await this.prismaService.bank_transactions.create({
            data: {
                amount,
                emitterAccount,
                emitterName,
                targetAccount,
                targetName,
            },
        });
        this.sendTransactionToPhone(transaction, emitter);
        this.sendTransactionToPhone(transaction, target);
    }

    private sendTransactionToPhone(transaction: any, player: PlayerData | null) {
        if (player) {
            TriggerClientEvent(ClientEvent.PHONE_APP_BANK_TRANSACTION_CREATED, player.source, {
                emitterAccount: transaction.emitterAccount,
                emitterName: transaction.emitterName,
                targetAccount: transaction.targetAccount,
                targetName: transaction.targetName,
                amount: Number(transaction.amount),
                date: transaction.date.getTime(),
            });
        }
    }
}
