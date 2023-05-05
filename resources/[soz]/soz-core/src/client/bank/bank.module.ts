import { Module } from '../../core/decorators/module';
import { BankInvoiceProvider } from './bank.invoice.provider';
import { BankMoneyCaseProvider } from './bank.money-case.provider';
import { BankNuiProvider } from './bank.nui.provider';
import { BankProvider } from './bank.provider';

@Module({
    providers: [BankMoneyCaseProvider, BankProvider, BankInvoiceProvider, BankNuiProvider],
})
export class BankModule {}
