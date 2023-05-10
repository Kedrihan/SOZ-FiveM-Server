import { AtmLocations, BankPedLocations } from '@public/config/bank';
import { AtmMinimalInformation, BankAccount } from '@public/shared/bank';

import { OnEvent } from '../../core/decorators/event';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { Rpc } from '../../core/decorators/rpc';
import { ClientEvent, ServerEvent } from '../../shared/event';
import { getDistance, Vector3 } from '../../shared/polyzone/vector';
import { RpcServerEvent } from '../../shared/rpc';
import { Notifier } from '../notifier';
import { QBCore } from '../qbcore';
import { BankAccountRepository } from '../repository/bank.account.repository';

@Provider()
export class BankAtmProvider {
    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(QBCore)
    private qbCore: QBCore;

    @Inject(BankAccountRepository)
    private bankAccountRepository: BankAccountRepository;

    @Rpc(RpcServerEvent.ATM_GET_MONEY)
    public async getAtmMoney(source: number, atmType: string, coords: Vector3): Promise<number> {
        const [account] = await this.getAtmAccount(atmType, coords);
        return account.money;
    }

    @Rpc(RpcServerEvent.ATM_GET_ACCOUNT)
    public async getAtmAccountCallback(
        source: number,
        atmType: string,
        coords: Vector3,
    ): Promise<AtmMinimalInformation> {
        const coordsHash = this.getAtmHashByCoords(coords);
        const [account, created] = await this.getAtmAccount(atmType, coords);
        if (created) {
            const allPlayersSources = this.qbCore.getPlayersSources();
            for (const playerSource of allPlayersSources) {
                TriggerClientEvent(ClientEvent.ATM_DISPLAY_BLIPS, playerSource, { [account.owner]: coords });
            }
        }
        return { account: account.owner, name: `atm_${atmType}_${coordsHash}` };
    }

    @Rpc(RpcServerEvent.BANK_GET_ACCOUNT)
    public async getBankAccountCallback(source: number, bank: string): Promise<string> {
        const [account] = await this.getBankAccount(bank);
        return account.id;
    }

    @Rpc(RpcServerEvent.BANK_GET_MONEY)
    public async getBankMoneyCallback(source: number, bank: string): Promise<number> {
        const [account] = await this.getBankAccount(bank);
        return account.money;
    }

    @Rpc(RpcServerEvent.BANK_HAS_ENOUGH_LIQUIDITY)
    public async hasEnoughLiquidityCallback(
        source: number,
        accountId: string,
        amount: number,
    ): Promise<[boolean, string]> {
        const account = this.bankAccountRepository.getAccount(accountId);
        if (account == null) {
            this.notifier.notify(source, 'Compte invalide', 'error');
            return;
        }
        if (account.money < amount) {
            return [false, 'invalid_liquidity'];
        }
        return [true, null];
    }

    @OnEvent(ServerEvent.BANK_REMOVE_LIQUIDITY)
    public async removeLiquidity(source: number, accountId: string, amount: number): Promise<void> {
        const account = this.bankAccountRepository.getAccount(accountId);
        if (account == null) {
            this.notifier.notify(source, 'Compte invalide', 'error');
            return;
        }
        if (account.money < amount) {
            this.notifier.notify(source, "Pas assez d'argent", 'error');
            return;
        }
        account.money -= amount;
        this.bankAccountRepository.removeMoney(account, amount);
    }

    @OnEvent(ServerEvent.ATM_REMOVE_LIQUIDITY)
    public async removeAtmLiquidity(
        source: number,
        coords: Vector3,
        atmType: string,
        amount: number,
        value: number,
    ): Promise<void> {
        const [account] = await this.getAtmAccount(atmType, coords);
        this.bankAccountRepository.removeMoney(account, amount * value);
    }

    private async getOrCreateAccount(accountName: string, coords: Vector3): Promise<[BankAccount, boolean]> {
        let account = this.bankAccountRepository.getAccount(accountName);
        let created = false;
        if (account == null) {
            account = await this.bankAccountRepository.createAccount(
                accountName,
                'bank-atm',
                'bank-atm',
                accountName,
                null,
                null,
                coords,
            );
            created = true;
        }
        return [account, created];
    }
    private getClosestFleeca(coord: Vector3): string {
        let closestBank = null;
        for (const [id, l] of Object.entries(BankPedLocations)) {
            if (!id.includes('pacific')) {
                const distance = getDistance(l, coord);
                if (closestBank == null || distance < closestBank.distance) {
                    closestBank = { id, distance };
                }
            }
        }
        return closestBank.id;
    }
    private getAtmHashByCoords(coords: Vector3): number {
        const formattedCoords = [];
        for (const v of coords) {
            formattedCoords.push(Math.floor(v * 100) / 100);
        }
        return GetHashKey(formattedCoords.join('_'));
    }

    public getAtmAccountName(atmType: string, atmCoordsHash: number, coords: Vector3): string {
        let atmAccount = null;
        const atmIdentifier = `atm_${atmType}_${atmCoordsHash}`;
        if (atmType == 'ent') {
            return atmIdentifier;
        }
        if (AtmLocations[atmIdentifier] != null) {
            atmAccount = AtmLocations[atmIdentifier].accountId;
        }
        if (atmAccount == null && coords) {
            atmAccount = `bank_${this.getClosestFleeca(coords)}`;
        }
        return atmAccount;
    }
    public getBankAccountName(bank: string): string {
        return `bank_${bank}`;
    }
    private async getAtmAccount(atmType: string, coords: Vector3): Promise<[BankAccount, boolean]> {
        const coordsHash = this.getAtmHashByCoords(coords);
        const accountName = this.getAtmAccountName(atmType, coordsHash, coords);
        return await this.getOrCreateAccount(accountName, coords);
    }
    private async getBankAccount(bank: string): Promise<[BankAccount, boolean]> {
        const accountName = this.getBankAccountName(bank);
        return await this.getOrCreateAccount(accountName, null);
    }
}
