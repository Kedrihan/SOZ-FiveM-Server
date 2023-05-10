import { BankingInformation } from '../bank';

export interface NuiBankMethodMap {
    open: BankData;
    close: never;
    error: string;
    success: string;
}

export type BankData = {
    information: BankingInformation;
    isATM: boolean;
    atmType: string;
    atmName: string;
    bankAtmAccount: number;
    offshore: any;
};
