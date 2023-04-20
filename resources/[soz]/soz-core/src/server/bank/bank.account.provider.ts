
import { Once, OnceStep } from '../../core/decorators/event';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { Rpc } from '../../core/decorators/rpc';
import { RpcServerEvent } from '../../shared/rpc';
import { PrismaService } from '../database/prisma.service';
import { Notifier } from '../notifier';
import { PlayerMoneyService } from '../player/player.money.service';
import { PlayerService } from '../player/player.service';
import { AtmLocations, BankPedLocations, FarmAccountMoney, HouseSafeTiers, SafeStorages } from '@public/config/bank';
import { JobService } from '../job.service';
import { AtmAccount } from './accounts/bank.account.atm';
import { PlayerAccount } from './accounts/bank.account.player';
import { BusinessAccount } from './accounts/bank.account.business';
import { SafeStorageAccount } from './accounts/bank.account.safe';
import { OffshoreAccount } from './accounts/bank.account.offshore';
import { FarmAccount } from './accounts/bank.account.farm';
import { HouseSafeAccount } from './accounts/bank.account.house';

@Provider()
export class BankAccountProvider {

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(JobService)
    private jobService: JobService;

    @Inject(PlayerMoneyService)
    private playerMoneyService: PlayerMoneyService;

    @Inject(PrismaService)
    private prismaService: PrismaService;

    private AccountType = {
        "player": new PlayerAccount(),
        "business": new BusinessAccount(),
        "safestorages": new SafeStorageAccount(),
        "offshore": new OffshoreAccount(),
        "bank_atm": new AtmAccount(),
        "farm": new FarmAccount(),
        "house_safe": new HouseSafeAccount()
    }

    private Accounts = [];

    @Once(OnceStep.DatabaseConnected)
    public async onOnceStart() {
        const allJobs = this.jobService.getJobs();
        const allAccounts = await this.prismaService.bank_accounts.findMany();
        const EnterpriseAccountNotLoaded = { ...allJobs };
        const EnterpriseSafeNotLoaded = { ...SafeStorages };
        const BankNotLoaded = { ...BankPedLocations };
        const AtmNotLoaded = { ...AtmLocations };
        for (const account of allAccounts) {
            if (account.account_type === "player") {
                this.createAccount(account.accountid, account.citizenid, account.account_type, account.citizenid, account.money)
            }
            else if (account.account_type === "business") {
                this.createAccount(account.businessid, allJobs[account.businessid].label, account.account_type, account.businessid,
                    account.money)
                EnterpriseAccountNotLoaded[account.businessid] = null
            }
            else if (account.account_type === "safestorages") {
                if (account.houseid) { this.createAccount(account.houseid, account.houseid, "house_safe", account.houseid, account.money, account.marked_money) }
                else {
                    this.createAccount(account.businessid, SafeStorages[account.businessid].label, account.account_type,
                        account.businessid, account.money, account.marked_money)
                    EnterpriseSafeNotLoaded[account.businessid] = null
                }
            }
            else if (account.account_type === "offshore") {
                this.createAccount(account.businessid, account.businessid, account.account_type, account.businessid, account.money, account.marked_money)
            }
            else if (account.account_type === "bank_atm") {
                this.createAccount(account.businessid, account.businessid, account.account_type, account.businessid, account.money, account.marked_money, account.coords)
                if (account.businessid.match("bank_%w+")) {
                    const bank = account.businessid.match("%a+%d")[0]
                    BankNotLoaded[bank] = null
                }
                else if (account.businessid.match("atm_%w+")) { AtmNotLoaded[account.businessid] = null }

            }
        }
        // Create account present in configuration if not exist in database
        for (const [k, v] of Object.entries(EnterpriseAccountNotLoaded)) {
            if (k !== "unemployed") {
                this.createAccount(k, v.label, "business", k);
            }
        }

        // Create account present in configuration if not exist in database
        for (const [k, v] of Object.entries(EnterpriseSafeNotLoaded)) {
            this.createAccount(k, v.label, "safestorages", v.owner);
        }

        // Create account present in configuration if not exist in database
        for (const [k, coords] of Object.entries(BankNotLoaded)) {
            if (k !== "pacific2" && k !== "pacific3") {
                this.createAccount(k, k, "bank-atm", "bank_" + k, undefined, undefined, coords);
            }
        }

        for (const [account, money] of Object.entries(FarmAccountMoney)) {
            this.createAccount(account, account, "farm", account, money);
        }
    }

    @Rpc(RpcServerEvent.BANK_GET_TERMINAL_TYPE)
    public async getTerminalType(source: number, accountId: string, atmType: string) {
        return AtmAccount.getTerminalType(accountId, atmType);
    };

    public createAccount(id: string, label: string, account_type: string, owner: string, money: number | bigint = 0, marked_money: number | bigint = 0, coords = null) {
        if (this.AccountType[account_type] === undefined) {
            console.log("Account type not valid !")
            return
        }
        const self = {
            id: id.toString(),
            label: label || id,
            type: account_type,
            owner: owner,
            money: money,
            marked_money: marked_money,
            coords: coords,
            changed: false,
            time: new Date().getTime(),
            max: 0,
        }
        if (self.money == null) {
            self.money = this.AccountType[self.type].load(self.id, self.owner, self.coords)
        }
        if (self.type === "safestorages") {
            if (!self.id.match("safe_%w+")) {
                self.id = "safe_" + self.id
            }
            self.max = 300000
        }
        if (self.type === "house_safe") {
            self.max = HouseSafeTiers[0]
        }
        this.Accounts[self.id] = self
        return this.Accounts[self.id]
    }

    public removeAccount(acc: any): void {
        const account = this.getAccount(acc);
        this.Accounts[account.id] = null;
    }
    public getMoney(acc: any, money_type: string | null): number {
        const account = this.getAccount(acc);

        if (money_type === null) {
            money_type = "money";
        }

        if (account === null) {
            return 0;
        }

        return account[money_type];
    }

    public addMoney(acc: any, money: number, money_type: string | null = null, allowOverflow: boolean = false): boolean {
        const account = this.getAccount(acc);

        if (money_type === null) {
            money_type = "money";
        }

        let total = Math.ceil(account[money_type] + money - 0.5);
        if (!allowOverflow && (account.type === "house_safe" || account.type === "safestorages") && total > account.max) {
            return false;
        }

        account[money_type] = total;
        account.changed = true;
        return true;
    }

    public removeMoney(acc: any, money: number, money_type: string | null = null): [boolean, string] | boolean {
        const account = this.getAccount(acc);

        if (money_type === null) {
            money_type = "money";
        }

        if (account[money_type] - money >= 0) {
            account[money_type] = Math.ceil(account[money_type] - money - 0.5);
            account.changed = true;
            return true;
        } else {
            return [false, "no_account_money"];
        }
    }

    public transferMoney(accSource: any, accTarget: any, money: number, cb?: (success: boolean, reason: string | null) => void): void {
        const sourceAccount = this.getAccount(accSource);
        const targetAccount = this.getAccount(accTarget);
        const roundMoney = Math.round(money);

        let success = false;
        let reason: string | null = null;

        if (sourceAccount !== null) {
            if (targetAccount !== null) {
                if (roundMoney <= sourceAccount.money) {
                    if ((targetAccount.type === "house_safe" || targetAccount.type === "safestorages") && roundMoney > targetAccount.max) {
                        success = false;
                        reason = "transfer_failed";

                        if (cb) {
                            cb(success, reason);
                        }
                        return;
                    }

                    if (this.removeMoney(accSource, roundMoney) && this.addMoney(accTarget, roundMoney)) {
                        this.AccountType[sourceAccount.type].save(sourceAccount.id, sourceAccount.owner, sourceAccount.money, sourceAccount.marked_money);
                        this.AccountType[targetAccount.type].save(targetAccount.id, targetAccount.owner, targetAccount.money, targetAccount.marked_money);

                        success = true;
                    } else {
                        success = false;
                        reason = "transfer_failed";
                    }
                } else {
                    success = false;
                    reason = "no_account_money";
                }
            } else {
                success = false;
                reason = "invalid_account";
            }
        } else {
            success = false;
            reason = "invalid_account";
        }

        if (cb) {
            cb(success, reason);
        }
    }

    private getAccount(arg: any) {
        if (arg) {
            if (typeof arg == "object") { return arg }
            if (typeof arg == "number") {
                arg = arg.toString()
            }

            return this.Accounts[arg]
        }
    }
}
