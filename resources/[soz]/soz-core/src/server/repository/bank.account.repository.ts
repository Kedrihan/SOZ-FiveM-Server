import {
    AtmLocations,
    BankAccountTypes,
    BankAtmDefault,
    BankPedLocations,
    FarmAccountMoney,
    HouseSafeTiers,
    JobSafeMaxMoney,
    SafeStorages,
} from '@public/config/bank';
import { AtmLocation, BankAccount, BankMetrics, JobSafe } from '@public/shared/bank';

import { Inject, Injectable } from '../../core/decorators/injectable';

import { Err, Ok, Result } from '@public/shared/result';
import { Repository } from './repository';
import { PrismaService } from '../database/prisma.service';
import { JobService } from '../job.service';
import { BankAccountManager } from '../bank/bank.account.manager';
import { Job, JobType } from '@public/shared/job';
import { Vector4 } from '@public/shared/polyzone/vector';

@Injectable()
export class BankAccountRepository extends Repository<BankAccount[]> {
    @Inject(JobService)
    private jobService: JobService;
    @Inject(PrismaService)
    private prismaService: PrismaService;
    @Inject(BankAccountManager)
    private bankAccountManager: BankAccountManager;

    private Accounts: BankAccount[] = [];

    protected async load(): Promise<BankAccount[]> {
        const allJobs = this.jobService.getJobs();
        const allAccounts = await this.prismaService.bank_accounts.findMany();
        const EnterpriseAccountNotLoaded: Record<JobType, Job> = { ...allJobs };
        const EnterpriseSafeNotLoaded: Record<string, JobSafe> = { ...SafeStorages };
        const BankNotLoaded: Record<string, Vector4> = { ...BankPedLocations };
        const AtmNotLoaded: Record<string, AtmLocation> = { ...AtmLocations };
        for (const account of allAccounts) {
            if (account.account_type === 'player') {
                this.createAccount(
                    account.accountid,
                    account.citizenid,
                    account.account_type,
                    account.citizenid,
                    Number(account.money),
                );
            } else if (account.account_type === 'business') {
                this.createAccount(
                    account.businessid,
                    allJobs[account.businessid].label,
                    account.account_type,
                    account.businessid,
                    Number(account.money),
                );
                EnterpriseAccountNotLoaded[account.businessid] = null;
            } else if (account.account_type === 'safestorages') {
                if (account.houseid) {
                    this.createAccount(
                        account.houseid,
                        account.houseid,
                        'house_safe',
                        account.houseid,
                        Number(account.money),
                        Number(account.marked_money),
                    );
                } else {
                    this.createAccount(
                        account.businessid,
                        SafeStorages[account.businessid].label,
                        account.account_type,
                        account.businessid,
                        Number(account.money),
                        Number(account.marked_money),
                    );
                    EnterpriseSafeNotLoaded[account.businessid] = null;
                }
            } else if (account.account_type === 'offshore') {
                this.createAccount(
                    account.businessid,
                    account.businessid,
                    account.account_type,
                    account.businessid,
                    Number(account.money),
                    Number(account.marked_money),
                );
            } else if (account.account_type === 'bank_atm') {
                this.createAccount(
                    account.businessid,
                    account.businessid,
                    account.account_type,
                    account.businessid,
                    Number(account.money),
                    Number(account.marked_money),
                    account.coords,
                );
                if (account.businessid.match('bank_%w+')) {
                    const bank = account.businessid.match('%a+%d')[0];
                    BankNotLoaded[bank] = null;
                } else if (account.businessid.match('atm_%w+')) {
                    AtmNotLoaded[account.businessid] = null;
                }
            }
        }
        // Create account present in configuration if not exist in database
        for (const [k, v] of Object.entries(EnterpriseAccountNotLoaded)) {
            if (v !== null && k !== JobType.Unemployed) {
                this.createAccount(k, v.label, 'business', k);
            }
        }

        // Create account present in configuration if not exist in database
        for (const [k, v] of Object.entries(EnterpriseSafeNotLoaded)) {
            if (v !== null) {
                this.createAccount(k, v.label, 'safestorages', v.owner);
            }
        }

        // Create account present in configuration if not exist in database
        for (const [k, coords] of Object.entries(BankNotLoaded)) {
            if (coords !== null && k !== 'pacific2' && k !== 'pacific3') {
                this.createAccount(k, k, 'bank_atm', 'bank_' + k, undefined, undefined, coords);
            }
        }

        for (const [account, money] of Object.entries(FarmAccountMoney)) {
            this.createAccount(account, account, 'farm', account, money);
        }

        return this.Accounts;
    }
    public async createAccount(
        id: string,
        label: string,
        account_type: string,
        owner: string,
        money = 0,
        marked_money = 0,
        coords = null,
    ): Promise<BankAccount> {
        if (!BankAccountTypes.includes(account_type)) {
            console.log(`Account type ${account_type} not valid !`);
            return;
        }
        const self: BankAccount = {
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
        };
        if (self.money == null) {
            self.money = Number((await this.bankAccountManager.load(self.id, self.owner, self.coords, self.type))[0]);
        }
        if (self.type === 'safestorages') {
            if (!self.id.match('safe_%w+')) {
                self.id = 'safe_' + self.id;
            }
            self.max = JobSafeMaxMoney;
        }
        if (self.type === 'house_safe') {
            self.max = HouseSafeTiers[0];
        }
        this.Accounts[self.id] = self;
        return this.Accounts[self.id];
    }

    public removeAccount(acc: any): void {
        const account = this.getAccount(acc);
        delete this.Accounts[account.id];
    }

    public getMoney(acc: any, money_type: string | null): number {
        const account = this.getAccount(acc);

        if (money_type === null) {
            money_type = 'money';
        }

        if (account === null) {
            return 0;
        }

        return account[money_type];
    }

    public addMoney(acc: any, money: number, money_type = 'money', allowOverflow = false): boolean {
        const account = this.getAccount(acc);

        const total = Math.ceil(account[money_type] + money - 0.5);
        if (
            !allowOverflow &&
            (account.type === 'house_safe' || account.type === 'safestorages') &&
            total > account.max
        ) {
            return false;
        }

        account[money_type] = total;
        account.changed = true;
        return true;
    }

    public removeMoney(acc: any, money: number, money_type = 'money'): Result<boolean, string> {
        const account = this.getAccount(acc);

        if (account[money_type] - money >= 0) {
            account[money_type] = Math.ceil(account[money_type] - money - 0.5);
            account.changed = true;
            return Ok(true);
        } else {
            return Err('no_account_money');
        }
    }

    public async transferMoney(accSource: any, accTarget: any, money: number): Promise<Result<boolean, string>> {
        const sourceAccount = this.getAccount(accSource);
        const targetAccount = this.getAccount(accTarget);
        const roundMoney = Math.round(money);

        let success = false;
        let reason: string | null = null;

        if (sourceAccount !== null) {
            if (targetAccount !== null) {
                if (roundMoney <= sourceAccount.money) {
                    if (
                        (targetAccount.type === 'house_safe' || targetAccount.type === 'safestorages') &&
                        roundMoney + targetAccount.money > targetAccount.max
                    ) {
                        success = false;
                        reason = 'transfer_failed';
                        return Err(reason);
                    }

                    if (this.removeMoney(accSource, roundMoney) && this.addMoney(accTarget, roundMoney)) {
                        await this.bankAccountManager.save(
                            sourceAccount.id,
                            sourceAccount.owner,
                            sourceAccount.money,
                            sourceAccount.marked_money,
                            sourceAccount.type,
                        );

                        await this.bankAccountManager.save(
                            targetAccount.id,
                            targetAccount.owner,
                            targetAccount.money,
                            targetAccount.marked_money,
                            targetAccount.type,
                        );

                        success = true;
                        return Ok(success);
                    } else {
                        success = false;
                        reason = 'transfer_failed';
                    }
                } else {
                    success = false;
                    reason = 'no_account_money';
                }
            } else {
                success = false;
                reason = 'invalid_account';
            }
        } else {
            success = false;
            reason = 'invalid_account';
        }

        return Err(reason);
    }

    public async accessGranted(acc: any, playerId: number): Promise<boolean> {
        const account = this.getAccount(acc);
        let owner = account.owner;
        if (owner.startsWith('safe_')) {
            owner = owner.substr(5);
        }
        return this.bankAccountManager.accessAllowed(owner, playerId, account.type);
    }

    public getMetrics(): BankMetrics[] {
        const metrics: BankMetrics[] = [];
        for (const account of this.Accounts) {
            metrics.push({
                id: account.id,
                label: account.label,
                type: account.type,
                owner: account.owner,
                money: account.money,
                marked_money: account.marked_money,
            });
        }
        return metrics;
    }

    public getAccountCapacity(acc: any): number {
        const account = this.getAccount(acc);
        let capacity = 0;
        if (account === null) {
            return -1;
        }
        for (const [k, v] of Object.entries(BankAtmDefault)) {
            if (account.id.includes(k)) {
                capacity = v.maxMoney;
            }
        }
        for (const [, v] of Object.entries(AtmLocations)) {
            if (account.id === v.accountId) {
                let type = 'small';
                if (account.id.substr(3, 4) === 'big') {
                    type = 'big';
                }
                capacity += BankAtmDefault[type].maxMoney;
            }
        }
        return capacity;
    }

    public getAccount(arg: any): BankAccount | null {
        if (arg) {
            if (typeof arg == 'object') {
                return arg;
            }
            if (typeof arg == 'number') {
                arg = arg.toString();
            }

            return this.Accounts[arg];
        }
    }

    public getAllAccounts(): BankAccount[] {
        return this.Accounts;
    }

    public async saveAccounts(): Promise<void> {
        for (const account of this.getAllAccounts()) {
            if (account.changed) {
                await this.bankAccountManager.save(
                    account.id,
                    account.owner,
                    account.money,
                    account.marked_money,
                    account.type,
                );
                if (
                    await this.bankAccountManager.save(
                        account.id,
                        account.owner,
                        account.money,
                        account.marked_money,
                        account.type,
                    )
                ) {
                    account.changed = false;
                }
            }
        }
    }
}
