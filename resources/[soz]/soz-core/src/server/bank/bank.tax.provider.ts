import { SocietyTaxes } from '@public/config/bank';
import { Once } from '@public/core/decorators/event';
import { Monitor } from '@public/shared/monitor';

import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { BankAccountService } from './bank.account.service';
import { isOk } from '@public/shared/result';

@Provider()
export class BankTaxProvider {
    @Inject(BankAccountService)
    private bankAccountService: BankAccountService;

    @Inject(Monitor)
    private monitor: Monitor;

    @Once()
    public async onOnce() {
        TriggerEvent('cron:runAt', 5, 0, this.paySocietyTaxes);
    }

    private paySocietyTaxes(d: number, h: number, m: number) {
        if (d !== 4) {
            // 1-7 = Sunday-Saturday
            return;
        }
        for (const [society, accounts] of Object.entries(SocietyTaxes.privateSociety)) {
            this.societyTaxCalculation(society, accounts);
        }
    }
    private societyTaxCalculation(society: string, accounts: string[]) {
        let societyMoney = 0;
        let societyTax = 0;

        for (const account of accounts) {
            societyMoney += this.bankAccountService.getMoney(account, 'money');
        }
        let percent = 0;
        for (const [threshold, percentage] of Object.entries(SocietyTaxes.thresholds)) {
            if (societyMoney >= parseInt(threshold, 10)) {
                percent = percentage;
                break;
            }
        }
        societyTax = Math.ceil((societyMoney * percent) / 100);
        return this.societyTaxPayment(society, percent, societyTax);
    }
    private societyTaxPayment(society: string, percentage: number, tax: number) {
        this.monitor.log('INFO', `Society ${society} paid ${tax}$ tax. Percentage: ${percentage}%`);
        for (const [account, repartition] of Object.entries(SocietyTaxes.taxRepartition)) {
            const money = Math.ceil((tax * repartition) / 100);
            const result = this.bankAccountService.transferMoney(society, account, money);
            if (isOk(result)) {
                this.monitor.log(
                    'INFO',
                    `Public society ${account} receive ${money}$ tax. Percentage: ${repartition}%`
                );
            } else {
                this.monitor.log(
                    'ERROR',
                    `Public society ${account} can't receive ${money}$ tax. Percentage: ${repartition}% | Reason: ${result.err}`
                );
            }
        }
    }
}
