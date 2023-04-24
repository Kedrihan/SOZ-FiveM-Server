import { Invoice } from '@public/shared/bank';
import { Inject, Injectable } from '../../core/decorators/injectable';
import { Err, Ok, Result } from '../../shared/result';
import { BankAccountProvider } from './bank.account.provider';

@Injectable()
export class BankService {
    @Inject(BankAccountProvider)
    private bankAccountProvider: BankAccountProvider;

    public transferBankMoney(source: string, target: string, amount: number): Promise<Result<boolean, string>> {
        return new Promise((resolve) => {
            this.bankAccountProvider.transferMoney(source, target, amount, (success, reason) => {
                if (success) {
                    resolve(Ok(true));
                } else {
                    resolve(Err(reason));
                }
            });
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
}
