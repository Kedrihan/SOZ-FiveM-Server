import { Module } from '@public/core/decorators/module';
import { BankPaycheckProvider } from './bank.paycheck.provider';
import { BankAccountProvider } from './bank.account.provider';
import { BankAtmProvider } from './bank.atm.provider';
import { BankTaxProvider } from './bank.tax.provider';
import { BankInvoiceProvider } from './bank.invoice.provider';
import { BankWashMoneyProvider } from './bank.washmoney.provider';
import { BankProvider } from './bank.provider';

@Module({
    providers: [
        BankAccountProvider,
        BankAtmProvider,
        BankTaxProvider,
        BankInvoiceProvider,
        BankPaycheckProvider,
        BankWashMoneyProvider,
        BankProvider,
    ],
})
export class BankModule {}
