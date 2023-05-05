import { OffShoreMaxWashAmount } from '@public/config/bank';
import { Once } from '@public/core/decorators/event';

import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { BankAccountRepository } from '../repository/bank.account.repository';

@Provider()
export class BankWashMoneyProvider {
    @Inject(BankAccountRepository)
    private bankAccountRepository: BankAccountRepository;

    @Once()
    public async onOnce() {
        TriggerEvent('cron:runAt', 2, 0, this.washMoney);
    }

    private washMoney() {
        const offshoreAccounts = this.bankAccountRepository
            .getAllAccounts()
            .filter((account) => account.id.includes('offshore_'));
        const maxWashAmount = Math.ceil(OffShoreMaxWashAmount / offshoreAccounts.length - 0.5);

        for (const account of offshoreAccounts) {
            let toWash = maxWashAmount;

            if (account.marked_money < toWash) {
                toWash = account.marked_money;
            }

            this.bankAccountRepository.removeMoney(account.id, toWash, 'marked_money');
            this.bankAccountRepository.addMoney(account.id.replace('offshore_', ''), toWash, 'money');
        }
    }
}
