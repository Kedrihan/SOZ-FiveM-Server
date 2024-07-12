import { createModel } from '@rematch/core';

import { ServerPromiseResp } from '../../../../typings/common';
import { fetchNui } from '../../utils/fetchNui';
import { buildRespObj } from '../../utils/misc';
import { RootModel } from '..';
import { BankEvents, BankTransaction } from '@typings/app/bank';
import { MockBankTransactionsData } from '../../apps/bank/utils/constants';

export const appBankTransactions = createModel<RootModel>()({
    state: [] as BankTransaction[],
    reducers: {
        set: (state, payload) => {
            return [...payload];
        },
        add: (state, payload) => {
            return [payload, ...state];
        },
    },
    effects: (dispatch) => ({
        async appendTransaction(payload: BankTransaction) {
            dispatch.appBankTransactions.add(payload);
        },
        // loader
        async loadTransactions() {
            fetchNui<ServerPromiseResp<BankTransaction[]>>(
                BankEvents.FIVEM_EVENT_FETCH_TRANSACTIONS,
                undefined,
                buildRespObj(MockBankTransactionsData),
            )
                .then((transactions) => {
                    dispatch.appBankTransactions.set(transactions.data.reverse() || []);
                })
                .catch(() => console.error('Failed to load transactions'));
        },
    }),
});
