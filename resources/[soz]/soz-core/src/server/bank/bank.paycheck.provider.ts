import { Tick, TickInterval } from '@public/core/decorators/tick';
import { Monitor } from '@public/shared/monitor';

import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { JobService } from '../job.service';
import { Notifier } from '../notifier';
import { QBCore } from '../qbcore';
import { BankAccountService } from './bank.account.service';
import { isOk } from '@public/shared/result';

@Provider()
export class BankPaycheckProvider {
    @Inject(BankAccountService)
    private bankAccountService: BankAccountService;

    @Inject(JobService)
    private jobService: JobService;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(QBCore)
    private qbCore: QBCore;

    @Inject(Monitor)
    private monitor: Monitor;

    @Tick(TickInterval.PAYCHECK_INTERVAL)
    public async onTick() {
        const allPlayersSources = this.qbCore.getPlayersSources();
        const allJobs = this.jobService.getJobs();
        for (const playerSource of allPlayersSources) {
            const player = this.qbCore.getPlayer(playerSource);
            const grade = allJobs[player.PlayerData.job.id].grades[player.PlayerData.job.grade];
            let payment = grade.salary || 0;

            if (!player.PlayerData.metadata.injail && player.PlayerData.job && payment > 0) {
                if (!player.PlayerData.job.onduty) {
                    payment = Math.ceil((payment * 30) / 100);
                }
                const result = this.bankAccountService.transferMoney(
                    player.PlayerData.job.id,
                    player.PlayerData.charinfo.account,
                    payment
                );
                if (isOk(result)) {
                    this.notifier.advancedNotify(
                        playerSource,
                        'Maze Banque',
                        'Mouvement bancaire',
                        "Un versement vient d'être réalisé sur votre compte",
                        'CHAR_BANK_MAZE',
                        'success'
                    );
                    this.monitor.publish(
                        'paycheck',
                        {
                            player_source: player.PlayerData.source,
                        },
                        {
                            amount: payment,
                        }
                    );
                } else {
                    console.log(result.err);
                }
            }
        }
    }
}
