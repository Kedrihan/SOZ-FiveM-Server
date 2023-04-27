import { JobPermissionService } from '@public/client/job/job.permission.service';
import { HouseSafeTiers } from '@public/config/bank';
import { OnEvent } from '@public/core/decorators/event';
import { Rpc } from '@public/core/decorators/rpc';
import { BankingInformation } from '@public/shared/bank';
import { ServerEvent } from '@public/shared/event';
import { JobPermission } from '@public/shared/job';
import { RpcServerEvent } from '@public/shared/rpc';
import { groupDigits } from '@public/shared/utils/number';

import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { Notifier } from '../notifier';
import { PlayerMoneyService } from '../player/player.money.service';
import { PlayerService } from '../player/player.service';
import { BankAccountService } from './bank.account.service';
import { Exportable } from '@public/core/decorators/exports';
import { Err, Ok, Result } from '@public/shared/result';

@Provider()
export class BankProvider {
    @Inject(BankAccountService)
    private bankAccountService: BankAccountService;

    @Inject(PlayerMoneyService)
    private playerMoneyService: PlayerMoneyService;

    @Inject(JobPermissionService)
    private jobPermissionService: JobPermissionService;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Rpc(RpcServerEvent.BANK_GET_BANKING_INFORMATIONS)
    public async getBankingInformations(source: number, accountParam: string): Promise<BankingInformation> {
        const player = this.playerService.getPlayer(source);
        let account: any = accountParam;
        if (!player) return null;

        if (!account) {
            account = this.bankAccountService.getAccount(player.charinfo.account);
        } else {
            const isMatch = account.search(/\d\d\d\w\d\d\d\d\w\d\d\d/) !== -1;
            if (isMatch) {
                account = this.bankAccountService.getAccount(account);
            } else if (this.jobPermissionService.hasPermission(player.job.id, JobPermission.SocietyBankAccount)) {
                account = this.bankAccountService.getAccount(account);
            } else {
                return null;
            }
        }
        const bankingInformations: BankingInformation = {
            name: player.name,
            accountinfo: account.id,
            bankbalance: groupDigits(account.money) + '$',
            money: groupDigits(player.money.money) + '$',
            offshore: null,
        };
        const offshoreAccount = this.bankAccountService.getAccount('offshore_' + account.id);
        if (offshoreAccount) {
            bankingInformations.offshore = groupDigits(offshoreAccount.marked_money) + '$';
        }
        return bankingInformations;
    }

    @Rpc(RpcServerEvent.BANK_CREATE_OFFSHORE_ACCOUNT)
    public async createOffshoreAccount(source: number, account: string): Promise<Result<boolean, string>> {
        const player = this.playerService.getPlayer(source);
        const offshore = this.bankAccountService.getAccount('offshore_' + account);
        if (this.jobPermissionService.hasPermission(player.job.id, JobPermission.SocietyBankAccount)) {
            if (offshore) {
                return Err('already_exist')
            }
            this.bankAccountService.createAccount(
                'offshore_' + account,
                'Compte offshore ' + account,
                'offshore',
                'offshore_' + account,
            );
            return Ok(true);
        } else {
            return Err('action_forbidden');
        }
    }

    @Rpc(RpcServerEvent.BANK_TRANSFER_OFFSHORE_MONEY)
    public async transferOffshoreMoney(
        source: number,
        accountTarget: string,
        amount: number,
    ): Promise<Result<boolean, string>> {
        const player = this.playerService.getPlayer(source);
        const currentMoney = player.money.marked_money;
        if (this.jobPermissionService.hasPermission(player.job.id, JobPermission.SocietyBankAccount)) {
            if (amount <= currentMoney) {
                if (this.playerMoneyService.remove(player.source, amount, 'marked_money')) {
                    this.bankAccountService.addMoney('offshore_' + accountTarget, amount, 'marked_money');
                    return Ok(true);
                } else {
                    return Err('offshore_full');
                }
            }
        } else {
            return Err('action_forbidden');
        }
        return Err('unknown');
    }

    @Rpc(RpcServerEvent.BANK_TRANSFER_MONEY)
    public async transferMoney(
        source: number,
        accountSource: string,
        accountTarget: string,
        amount: number,
    ): Promise<Result<boolean, string>> {
        const player = this.playerService.getPlayer(source);
        const currentMoney = player.money.money;

        if (accountSource === 'player') {
            if (amount <= currentMoney) {
                if (this.playerMoneyService.remove(player.source, amount, 'money')) {
                    this.bankAccountService.addMoney(accountTarget, amount);
                    return Ok(true);
                }
            }
        } else if (accountTarget === 'player') {
            const accountMoney = this.bankAccountService.getAccount(accountSource).money;
            if (amount <= accountMoney) {
                if (this.playerMoneyService.add(player.source, amount, 'money')) {
                    this.bankAccountService.removeMoney(accountSource, amount);
                    return Ok(true);
                }
            }
        } else {
            return this.bankAccountService.transferMoney(accountSource, accountTarget, amount);
        }
        return Err('unknown');
    }

    @Rpc(RpcServerEvent.BANK_TRANSFER_CASH_MONEY)
    public async transferCashMoney(source: number, target: number, amount: number): Promise<Result<boolean, string>> {
        const targetPlayer = this.playerService.getPlayer(target);

        const currentMoney = this.bankAccountService.getAccount(source).money;
        if (amount <= currentMoney) {
            if (this.playerMoneyService.remove(targetPlayer.source, amount, 'money')) {
                this.bankAccountService.removeMoney(source, amount);
                return Ok(true);
            } else {
                return Err('could_not_add_money')
            }
        } else {
            this.notifier.notify(source, "Vous n'avez pas assez d'argent", 'error');
            return Err('insufficient_funds')
        }
    }

    @Rpc(RpcServerEvent.BANK_OPEN_SAFE_STORAGE)
    public async openSafeStorage(source: number, safeStorage: any): Promise<[boolean, number, number]> {
        const account = this.bankAccountService.getAccount(safeStorage);
        if (account && this.bankAccountService.accessGranted(account, source)) {
            return [true, account.money, account.marked_money];
        }
        return [false, 0, 0];
    }

    @Rpc(RpcServerEvent.BANK_OPEN_HOUSE_SAFE_STORAGE)
    public async openHouseSafeStorage(source: number, safeStorage: any): Promise<[boolean, number, number, number]> {
        const player = this.playerService.getPlayer(source);
        if (!player) {
            return [false, 0, 0, 0];
        }
        const inside = player.metadata.inside;
        const apartmentTier = exports['soz-housing'].GetApartmentTier(inside.property, inside.apartment);
        let account = this.bankAccountService.getAccount(safeStorage);

        if (!account) {
            account = this.bankAccountService.createAccount(safeStorage, safeStorage, 'house_safe', safeStorage);
        }

        if (this.bankAccountService.accessGranted(account, source)) {
            account.max = HouseSafeTiers[apartmentTier];
            return [true, account.money, account.marked_money, account.max];
        } else {
            return [false, 0, 0, 0];
        }
    }

    @Exportable('GetPlayerAccount')
    public async getPlayerAccount(source: number): Promise<any> {
        const player = this.playerService.getPlayer(source);
        const account = this.bankAccountService.getAccount(player.charinfo.account);
        return { name: player.name, account: account.id, balance: account.money };
    }

    @OnEvent(ServerEvent.BANK_SAFE_DEPOSIT)
    public async onSafeDeposit(
        source: number,
        money_type: 'money' | 'marked_money',
        safeStorage: any,
        amount: number,
    ): Promise<void> {
        const player = this.playerService.getPlayer(source);
        const currentMoney = player.money[money_type];
        if (amount > currentMoney) {
            this.notifier.notify(source, "Vous n'avez pas assez d'argent", 'error');
            return;
        }

        if (this.playerMoneyService.remove(player.source, amount, money_type)) {
            const added = this.bankAccountService.addMoney(safeStorage, amount, money_type);
            if (added) {
                this.notifier.notify(source, `Vous avez déposé ~g~$${amount}`);
            } else {
                this.playerMoneyService.add(player.source, amount, money_type);
                this.notifier.notify(source, "Le coffre n'a plus de place", 'error');
            }
        }
    }

    @OnEvent(ServerEvent.BANK_SAFE_WITHDRAW)
    public async onSafeWithdraw(
        source: number,
        money_type: 'money' | 'marked_money',
        safeStorage: any,
        amount: number,
    ): Promise<void> {
        const player = this.playerService.getPlayer(source);
        const currentMoney = this.bankAccountService.getMoney(safeStorage, money_type);
        if (amount > currentMoney) {
            this.notifier.notify(source, "Vous n'avez pas assez d'argent", 'error');
            return;
        }
        if (this.playerMoneyService.add(player.source, amount, money_type)) {
            this.bankAccountService.removeMoney(safeStorage, amount, money_type);
            this.notifier.notify(source, `Vous avez retiré ~g~$${amount}`);
        }
    }

    @OnEvent(ServerEvent.BANK_TRANSFER_MONEY)
    public async onTransferMoney(accountSource: string, accountTarget: string, amount: number): Promise<void> {
        this.bankAccountService.transferMoney(accountSource, accountTarget, amount);
    }
}
