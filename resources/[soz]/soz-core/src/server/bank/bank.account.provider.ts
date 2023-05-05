import { Tick, TickInterval } from '@public/core/decorators/tick';
import { PlayerData } from '@public/shared/player';

import { On, Once, OnceStep } from '../../core/decorators/event';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { Rpc } from '../../core/decorators/rpc';
import { RpcServerEvent } from '../../shared/rpc';
import { AtmAccount } from './accounts/bank.account.atm';
import { BankAccountRepository } from '../repository/bank.account.repository';

@Provider()
export class BankAccountProvider {
    @Inject(BankAccountRepository)
    private bankAccountRepository: BankAccountRepository;

    @Once(OnceStep.PlayerLoaded)
    public async onPlayerLoaded(player: PlayerData): Promise<void> {
        let account = this.bankAccountRepository.getAccount(player.charinfo.account);
        if (account == null) {
            account = this.bankAccountRepository.createAccount(
                player.charinfo.account,
                player.name,
                'player',
                player.citizenid,
            );
        }
    }

    @On('onResourceStop')
    public async onResourceStop(resource: string) {
        if (resource === GetCurrentResourceName()) {
            this.bankAccountRepository.saveAccounts();
        }
    }

    @Tick(TickInterval.EVERY_MINUTE)
    public async saveAccounts(): Promise<void> {
        this.bankAccountRepository.saveAccounts();
    }

    @Rpc(RpcServerEvent.BANK_GET_TERMINAL_TYPE)
    public async getTerminalType(source: number, accountId: string, atmType: string): Promise<string> {
        return AtmAccount.getTerminalType(accountId, atmType);
    }
}
