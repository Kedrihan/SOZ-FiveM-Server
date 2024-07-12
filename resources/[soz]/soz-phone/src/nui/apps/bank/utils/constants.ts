import { BankTransaction, IBankCredentials } from '../../../../../typings/app/bank';

export const MockBankAccountData: IBankCredentials = {
    name: 'John Doe',
    account: '555Z5555T555',
    balance: 1258745,
};

export const MockBankTransactionsData: BankTransaction[] = [
    {
        date: 1598400000000,
        amount: BigInt(500),
        emitterName: 'John Doe',
        targetName: 'Joe Smith',
        emitterAccount: 'BBB',
        targetAccount: 'AAA',
    },
    {
        date: 1598600000000,
        amount: BigInt(1500),
        emitterName: '',
        targetName: 'John Doe',
        emitterAccount: 'radar',
        targetAccount: 'BBB',
    },
    {
        date: 1598650000000,
        amount: BigInt(1500),
        emitterName: '',
        targetName: 'John Doe',
        emitterAccount: 'bank_pacific',
        targetAccount: 'BBB',
    },
    {
        date: 1598680000000,
        amount: BigInt(1500),
        emitterName: 'John Doe',
        targetName: '',
        emitterAccount: 'BBB',
        targetAccount: 'bank_pacific',
    },
];
