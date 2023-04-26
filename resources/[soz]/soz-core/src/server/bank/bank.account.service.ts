import { AtmLocations, BankAtmDefault, HouseSafeTiers } from '@public/config/bank';
import { BankAccount, BankMetrics } from '@public/shared/bank';

import { Injectable } from '../../core/decorators/injectable';
import { AtmAccount } from './accounts/bank.account.atm';
import { BusinessAccount } from './accounts/bank.account.business';
import { FarmAccount } from './accounts/bank.account.farm';
import { HouseSafeAccount } from './accounts/bank.account.house';
import { OffshoreAccount } from './accounts/bank.account.offshore';
import { PlayerAccount } from './accounts/bank.account.player';
import { SafeStorageAccount } from './accounts/bank.account.safe';

@Injectable()
export class BankAccountService {
    private AccountType: Record<string, any> = {
        player: new PlayerAccount(),
        business: new BusinessAccount(),
        safestorages: new SafeStorageAccount(),
        offshore: new OffshoreAccount(),
        bank_atm: new AtmAccount(),
        farm: new FarmAccount(),
        house_safe: new HouseSafeAccount(),
    };
    private Accounts: BankAccount[] = [];

    public createAccount(
        id: string,
        label: string,
        account_type: string,
        owner: string,
        money = 0,
        marked_money = 0,
        coords = null,
    ): BankAccount {
        if (this.AccountType[account_type] === undefined) {
            console.log('Account type not valid !');
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
            self.money = this.AccountType[self.type].load(self.id, self.owner, self.coords);
        }
        if (self.type === 'safestorages') {
            if (!self.id.match('safe_%w+')) {
                self.id = 'safe_' + self.id;
            }
            self.max = 300000;
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

    public removeMoney(acc: any, money: number, money_type = 'money'): [boolean, string] {
        const account = this.getAccount(acc);

        if (account[money_type] - money >= 0) {
            account[money_type] = Math.ceil(account[money_type] - money - 0.5);
            account.changed = true;
            return [true, ''];
        } else {
            return [false, 'no_account_money'];
        }
    }

    public transferMoney(accSource: any, accTarget: any, money: number): [boolean, string] {
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
                        roundMoney > targetAccount.max
                    ) {
                        success = false;
                        reason = 'transfer_failed';

                        return [success, reason];
                    }

                    if (this.removeMoney(accSource, roundMoney) && this.addMoney(accTarget, roundMoney)) {
                        this.AccountType[sourceAccount.type].save(
                            sourceAccount.id,
                            sourceAccount.owner,
                            sourceAccount.money,
                            sourceAccount.marked_money,
                        );
                        this.AccountType[targetAccount.type].save(
                            targetAccount.id,
                            targetAccount.owner,
                            targetAccount.money,
                            targetAccount.marked_money,
                        );

                        success = true;
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

        return [success, reason];
    }

    public accessGranted(acc: any, playerId: number): boolean {
        const account = this.getAccount(acc);
        let owner = account.owner;
        if (owner.startsWith('safe_')) {
            owner = owner.substr(5);
        }
        return this.AccountType[account.type].accessAllowed(owner, playerId);
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

    public getAllAccountTypes(): Record<string, any> {
        return this.AccountType;
    }

    public saveAccounts(): void {
        for (const account of this.getAllAccounts()) {
            if (account.changed) {
                const accountType = this.getAllAccountTypes()[account.type];
                if (accountType.save(account.id, account.owner, account.money, account.marked_money)) {
                    account.changed = false;
                }
            }
        }
    }
}
