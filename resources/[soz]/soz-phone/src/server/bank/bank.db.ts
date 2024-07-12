import { BankTransaction } from '../../../typings/app/bank';

export class _BankTransactionDB {
    async getTransactions(account: string): Promise<BankTransaction[]> {
        var transactions = await exports.oxmysql.query_async(
            `SELECT emitterAccount, emitterName, targetAccount, targetName, amount, unix_timestamp(date)*1000 as date
            FROM bank_transactions 
            WHERE date > date_sub(now(), interval 7 day) 
                AND (targetAccount = ? OR emitterAccount = ?)
                AND targetAccount <> emitterAccount`,
            [account, account],
        );
        return transactions;
    }
}

const BankTransactionDb = new _BankTransactionDB();
export default BankTransactionDb;
