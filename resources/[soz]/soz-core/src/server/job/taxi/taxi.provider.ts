import { OnEvent } from '@core/decorators/event';
import { Inject } from '@core/decorators/injectable';
import { Provider } from '@core/decorators/provider';
import { BankAccountRepository } from '@public/server/repository/bank.account.repository';
import { ServerEvent } from '@public/shared/event';
import { TaxiConfig } from '@public/shared/job/cjr';
import { Monitor } from '@public/shared/monitor';
import { toVector3Object, Vector3 } from '@public/shared/polyzone/vector';
import { isErr } from '@public/shared/result';

@Provider()
export class TaxiProvider {
    @Inject(BankAccountRepository)
    private bankAccountRepository: BankAccountRepository;

    @Inject(Monitor)
    private monitor: Monitor;

    @OnEvent(ServerEvent.TAXI_NPC_PAY)
    public async decrement(source: number, amount: number) {
        const transfer = await this.bankAccountRepository.transferMoney(
            TaxiConfig.bankAccount.farm,
            TaxiConfig.bankAccount.safe,
            amount,
        );
        if (isErr(transfer)) {
            this.monitor.log('ERROR', 'Failed to transfer money to safe', {
                account_source: TaxiConfig.bankAccount.farm,
                account_destination: TaxiConfig.bankAccount.safe,
                amount: amount,
            });
        }

        this.monitor.publish(
            'job_carljr_npc_course',
            {
                player_source: source,
            },
            {
                amount: amount,
                position: toVector3Object(GetEntityCoords(GetPlayerPed(source)) as Vector3),
            },
        );
    }
}
