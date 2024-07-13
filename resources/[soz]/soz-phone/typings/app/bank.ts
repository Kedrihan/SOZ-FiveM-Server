export interface IBankCredentials {
    name: string;
    account: string;
    balance: number;
}
export interface BankTransaction {
    id: number,
    amount: bigint;
    emitterAccount: string;
    targetAccount: string;
    emitterName: string;
    targetName: string;
    date: number;
}

export enum BankEvents {
    FIVEM_EVENT_FETCH_BALANCE = 'phone:app:bank:fetchBalance',
    FIVEM_EVENT_UPDATE_BALANCE = 'phone:client:app:bank:updateBalance',
    GET_CREDENTIALS = 'phone:app:bank:getAccountData',
    SEND_CREDENTIALS = 'phone:app:bank:sendAccountData',
    FIVEM_EVENT_FETCH_TRANSACTIONS = 'phone:app:bank:fetchTransactions',
    FIVEM_EVENT_TRANSACTION_CREATED = 'phone:app:bank:transactionCreated',
    NEW_TRANSACTION = 'phone:app:bank:addTransaction',
}
