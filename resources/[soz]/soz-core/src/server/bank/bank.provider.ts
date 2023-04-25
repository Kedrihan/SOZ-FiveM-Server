
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { JobService } from '../job.service';
import { Tick, TickInterval } from '@public/core/decorators/tick';
import { QBCore } from '../qbcore';
import { Notifier } from '../notifier';
import { BankAccountService } from './bank.account.service';
import { Monitor } from '@public/shared/monitor';
import { OnEvent } from '@public/core/decorators/event';
import { ServerEvent } from '@public/shared/event';
import { Rpc } from '@public/core/decorators/rpc';
import { RpcServerEvent } from '@public/shared/rpc';
import { BankingInformation } from '@public/shared/bank';
import { PlayerService } from '../player/player.service';
import { JobPermissionService } from '@public/client/job/job.permission.service';
import { JobPermission } from '@public/shared/job';
import { groupDigits } from '@public/shared/utils/number';

@Provider()
export class BankProvider {

    @Inject(BankAccountService)
    private bankAccountService: BankAccountService;

    @Inject(JobPermissionService)
    private jobPermissionService: JobPermissionService;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(QBCore)
    private qbCore: QBCore;

    @Inject(Monitor)
    private monitor: Monitor;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Rpc(RpcServerEvent.BANK_GET_BANKING_INFORMATIONS)
    public async getBankingInformations(source: number, accountParam: string): Promise<BankingInformation> {
        const player = this.playerService.getPlayer(source);
        let account: any = accountParam;
        if (!player) return null;

        if (!account) {
            account = this.bankAccountService.getAccount(player.charinfo.account)
        }
        else {
            const isMatch = account.search(/\d\d\d\w\d\d\d\d\w\d\d\d/) !== -1;
            if (isMatch) {
                account = this.bankAccountService.getAccount(account);
            }
            else if (this.jobPermissionService.hasPermission(player.job.id, JobPermission.SocietyBankAccount)) {
                account = this.bankAccountService.getAccount(account);
            }
            else {
                return null;
            }
        }
        const bankingInformations: BankingInformation = {
            name: player.name,
            accountinfo: account.id,
            bankbalance: groupDigits(account.money) + "$",
            money: groupDigits(player.money.money) + "$",
            offshore: null
        };
        const offshoreAccount = this.bankAccountService.getAccount("offshore_" + account.id);
        if (offshoreAccount) {
            bankingInformations.offshore = groupDigits(offshoreAccount.marked_money) + "$";
        }
        return bankingInformations;
    }

    @Rpc(RpcServerEvent.BANK_CREATE_OFFSHORE_ACCOUNT)
    public async createOffshoreAccount(source: number, account: string): Promise<[boolean, string] | boolean> {
        const player = this.playerService.getPlayer(source);
        const offshore = this.bankAccountService.getAccount("offshore_" + account);
        if (this.jobPermissionService.hasPermission(player.job.id, JobPermission.SocietyBankAccount)) {
            if (offshore) {
                return [false, "already_exist"];
            }
            this.bankAccountService.createAccount("offshore_" + account, "Compte offshore " + account, "offshore", "offshore_" + account);
            return true;
        }
        else {
            return [false, "action_forbidden"];
        }
    }

    @Rpc(RpcServerEvent.BANK_TRANSFER_OFFSHORE_MONEY)
    public async transferOffshoreMoney(source: number, accountTarget: string, amount: number): Promise<[boolean, string] | boolean> {
        const player = this.qbCore.getPlayer(source);
        const currentMoney = player.Functions.GetMoney("marked_money");
        if (this.jobPermissionService.hasPermission(player.PlayerData.job.id, JobPermission.SocietyBankAccount)) {
            if (amount <= currentMoney) {
                if (player.Functions.RemoveMoney("marked_money", amount)) {
                    this.bankAccountService.addMoney("offshore_" + accountTarget, amount, "marked_money")
                    return true;
                }
                else {
                    return [false, "offshore_full"];
                }
            }
        }
        else {
            return [false, "action_forbidden"];
        }
        return [false, "unknown"];
    }

    @OnEvent(ServerEvent.BANK_SAFE_DEPOSIT)
    public async onSafeDeposit(source: number, money_type: 'money' | 'marked_money', safeStorage: any, amount: number): Promise<void> {
        const player = this.qbCore.getPlayer(source);
        const currentMoney = player.Functions.GetMoney(money_type);
        if (amount > currentMoney) {
            this.notifier.notify(source, 'Vous n\'avez pas assez d\'argent', 'error');
            return;
        }
        if (player.Functions.RemoveMoney(money_type, amount)) {
            const added = this.bankAccountService.addMoney(safeStorage, amount, money_type);
            if (added) {
                this.notifier.notify(source, `Vous avez déposé ~g~$${amount}`);
            } else {
                player.Functions.AddMoney(money_type, amount);
                this.notifier.notify(source, 'Le coffre n\'a plus de place', 'error');
            }
        }
    }

    @OnEvent(ServerEvent.BANK_SAFE_WITHDRAW)
    public async onSafeWithdraw(source: number, money_type: 'money' | 'marked_money', safeStorage: any, amount: number): Promise<void> {
        const player = this.qbCore.getPlayer(source);
        const currentMoney = this.bankAccountService.getMoney(safeStorage, money_type);
        if (amount > currentMoney) {
            this.notifier.notify(source, 'Vous n\'avez pas assez d\'argent', 'error');
            return;
        }
        if (player.Functions.AddMoney(money_type, amount)) {
            this.bankAccountService.removeMoney(safeStorage, amount, money_type);
            this.notifier.notify(source, `Vous avez retiré ~g~$${amount}`);
        }
    }
}
