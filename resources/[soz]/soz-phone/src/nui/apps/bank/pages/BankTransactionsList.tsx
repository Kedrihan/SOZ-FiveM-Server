import React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from '../../../store';
import { BankTransactionCard } from '../components/BankTransactionCard';
import { AppContent } from '@ui/components/AppContent';

const BankTransactionsList = (): any => {
    const transactionsList = useSelector((state: RootState) => state.appBankTransactions);

    return (
        <AppContent scrollable={true}>
            <ul className={`p-2`}>
                {transactionsList.map(transaction => (
                    <BankTransactionCard key={transaction.id} {...transaction} />
                ))}
            </ul>
        </AppContent>
    );
};

export default BankTransactionsList;