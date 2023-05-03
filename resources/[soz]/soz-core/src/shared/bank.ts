export type Invoice = {
    id: number;
    citizenid: string;
    emitter: string;
    emitterName: string;
    emitterSafe: string;
    targetAccount: string;
    label: string;
    amount: number;
    payed: boolean;
    refused: boolean;
    createdAt: number;
};
import { Vector2, Vector3 } from './polyzone/vector';

export type SocietyTax = {
    privateSociety: Record<string, string[]>;
    taxRepartition: Record<string, number>;
    thresholds: Record<number, number>;
};
export type AtmLocation = {
    accountId: string;
    coords: Vector2;
    hideBlip?: boolean;
};
export type BankAtmLimitation = {
    maxMoney: number;
    maxWithdrawal: number;
    limit: number;
};
export type JobSafe = {
    label: string;
    owner: string;
    position: Vector3;
    size: Vector2;
    heading?: number;
    offsetUpZ?: number;
    offsetDownZ?: number;
    minZ?: number;
    maxZ?: number;
    debug?: boolean;
};
export type BankMetrics = {
    id: string;
    label: string;
    type: string;
    owner: string;
    money: number;
    marked_money: number;
};
export type BankAccount = {
    id: string;
    label: string;
    type: string;
    owner: string;
    money: number;
    marked_money: number;
    coords: Vector3;
    changed: boolean;
    time: number;
    max: number;
};
export type AtmMinimalInformation = {
    account: string;
    name: string;
};
export type BankingInformation = {
    name: string;
    accountinfo: string;
    bankbalance: string;
    money: string;
    offshore: string;
};
export type CurrentBank = { bank: string; type: string };
