
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { BankAccountService } from './bank.account.service';
import { Once } from '@public/core/decorators/event';
import { OffShoreMaxWashAmount } from '@public/config/bank';

@Provider()
export class BankWashMoneyProvider {

    @Inject(BankAccountService)
    private bankAccountService: BankAccountService;

    @Once()
    public async onOnce() {
        TriggerEvent("cron:runAt", 2, 0, this.washMoney)
    }

    private washMoney() {
        const offshoreAccounts = this.bankAccountService.getAllAccounts().filter(account => account.id.includes("offshore_"));
        const maxWashAmount = Math.ceil((OffShoreMaxWashAmount / offshoreAccounts.length) - 0.5);

        for (const account of offshoreAccounts) {
            let toWash = maxWashAmount;

            if (account.marked_money < toWash) {
                toWash = account.marked_money;
            }

            this.bankAccountService.removeMoney(account.id, toWash, "marked_money");
            this.bankAccountService.addMoney(account.id.replace("offshore_", ""), toWash, "money");
        }
    }
}
