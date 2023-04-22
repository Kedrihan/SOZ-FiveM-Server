
import { On, Once, OnceStep } from '../../core/decorators/event';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { Rpc } from '../../core/decorators/rpc';
import { RpcServerEvent } from '../../shared/rpc';
import { PrismaService } from '../database/prisma.service';
import { AtmLocations, BankPedLocations, FarmAccountMoney, SafeStorages } from '@public/config/bank';
import { JobService } from '../job.service';
import { AtmAccount } from './accounts/bank.account.atm';
import { PlayerData } from '@public/shared/player';
import { Tick, TickInterval } from '@public/core/decorators/tick';
import { BankAccountService } from './bank.account.service';

@Provider()
export class BankAccountProvider {

    @Inject(BankAccountService)
    private bankAccountService: BankAccountService;

    @Inject(JobService)
    private jobService: JobService;

    @Inject(PrismaService)
    private prismaService: PrismaService;

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
                this.bankAccountService.createAccount(account.accountid, account.citizenid, account.account_type, account.citizenid, account.money)
            }
            else if (account.account_type === "business") {
                this.bankAccountService.createAccount(account.businessid, allJobs[account.businessid].label, account.account_type, account.businessid,
                    account.money)
                EnterpriseAccountNotLoaded[account.businessid] = null
            }
            else if (account.account_type === "safestorages") {
                if (account.houseid) { this.bankAccountService.createAccount(account.houseid, account.houseid, "house_safe", account.houseid, account.money, account.marked_money) }
                else {
                    this.bankAccountService.createAccount(account.businessid, SafeStorages[account.businessid].label, account.account_type,
                        account.businessid, account.money, account.marked_money)
                    EnterpriseSafeNotLoaded[account.businessid] = null
                }
            }
            else if (account.account_type === "offshore") {
                this.bankAccountService.createAccount(account.businessid, account.businessid, account.account_type, account.businessid, account.money, account.marked_money)
            }
            else if (account.account_type === "bank_atm") {
                this.bankAccountService.createAccount(account.businessid, account.businessid, account.account_type, account.businessid, account.money, account.marked_money, account.coords)
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
                this.bankAccountService.createAccount(k, v.label, "business", k);
            }
        }

        // Create account present in configuration if not exist in database
        for (const [k, v] of Object.entries(EnterpriseSafeNotLoaded)) {
            this.bankAccountService.createAccount(k, v.label, "safestorages", v.owner);
        }

        // Create account present in configuration if not exist in database
        for (const [k, coords] of Object.entries(BankNotLoaded)) {
            if (k !== "pacific2" && k !== "pacific3") {
                this.bankAccountService.createAccount(k, k, "bank-atm", "bank_" + k, undefined, undefined, coords);
            }
        }

        for (const [account, money] of Object.entries(FarmAccountMoney)) {
            this.bankAccountService.createAccount(account, account, "farm", account, money);
        }
    }

    @Once(OnceStep.PlayerLoaded)
    public async onPlayerLoaded(player: PlayerData) {
        let account = this.bankAccountService.getAccount(player.charinfo.account);
        if (account == null) {
            account = this.bankAccountService.createAccount(player.charinfo.account, player.name, "player", player.citizenid)
        }
    }

    @On("onResourceStop")
    public async onResourceStop(resource: string) {
        if (resource === GetCurrentResourceName()) {
            this.saveAccounts();
        }
    }

    @Tick(TickInterval.EVERY_MINUTE)
    public async saveAccounts() {
        for (const account of this.bankAccountService.Accounts) {
            if (account.changed) {
                if (this.bankAccountService.AccountType[account.type].save(account.id, account.owner, account.money, account.marked_money)) {
                    account.changed = false;
                }
            }
        }
    }

    @Rpc(RpcServerEvent.BANK_GET_TERMINAL_TYPE)
    public async getTerminalType(source: number, accountId: string, atmType: string) {
        return AtmAccount.getTerminalType(accountId, atmType);
    };
}
