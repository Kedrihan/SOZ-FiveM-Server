import { BankEvents, BankTransaction, IBankCredentials } from '../../../typings/app/bank';
import { PromiseEventResp, PromiseRequest } from '../lib/PromiseNetEvents/promise.types';
import { bankLogger } from './bank.utils';
import BankTransactionDB, { _BankTransactionDB } from './bank.db';

class _BankService {
    private readonly bankTransferDB: _BankTransactionDB;

    constructor() {
        this.bankTransferDB = BankTransactionDB;
    }

    async handleFetchAccount(reqObj: PromiseRequest<void>, resp: PromiseEventResp<IBankCredentials>) {
        try {
            const account = exports['soz-bank'].GetPlayerAccount(reqObj.source);
            resp({ status: 'ok', data: account });
        } catch (e) {
            bankLogger.error(`Error in handleFetchAccount, ${e.toString()}`);
            resp({ status: 'error', errorMsg: 'DB_ERROR' });
        }
    }

    async handleFetchTransactions(
        reqObj: PromiseRequest<string>,
        resp: PromiseEventResp<BankTransaction[]>,
    ): Promise<void> {
        try {
            const account = exports['soz-bank'].GetPlayerAccount(reqObj.source);
            const transactions = await this.bankTransferDB.getTransactions(account.account);

            resp({ status: 'ok', data: transactions });
        } catch (e) {
            bankLogger.error(`Error in handleFetchTransactions, ${e.toString()}`);
            resp({ status: 'error', errorMsg: 'DB_ERROR' });
        }
    }
}

const BankService = new _BankService();
export default BankService;
