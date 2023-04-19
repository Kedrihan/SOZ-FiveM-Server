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

type BankingInformation = {
    playerName: string;
    accountInfo: string;
    bankBalance: number;
    playerMoney: number;
    offshore: number;
};
