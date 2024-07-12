import { BankEvents, BankTransaction } from '../../../typings/app/bank';
import { sendMessage } from '../../utils/messages';
import { RegisterNuiProxy } from '../cl_utils';

RegisterNuiProxy(BankEvents.FIVEM_EVENT_FETCH_BALANCE);
RegisterNuiProxy(BankEvents.FIVEM_EVENT_FETCH_TRANSACTIONS);

onNet(BankEvents.FIVEM_EVENT_UPDATE_BALANCE, async (playerName: string, account: string, balance: number) => {
    sendMessage('BANK', BankEvents.SEND_CREDENTIALS, {
        name: playerName,
        account: account,
        balance: balance,
    });
});

onNet(BankEvents.FIVEM_EVENT_TRANSACTION_CREATED, (result: BankTransaction) => {
    sendMessage('BANK', BankEvents.NEW_TRANSACTION, result);
});