
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { JobService } from '../job.service';
import { Tick, TickInterval } from '@public/core/decorators/tick';
import { QBCore } from '../qbcore';
import { Notifier } from '../notifier';
import { BankService } from './bank.service';

@Provider()
export class BankPaycheckProvider {

    @Inject(BankService)
    private bankService: BankService;

    @Inject(JobService)
    private jobService: JobService;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(QBCore)
    private qbCore: QBCore;

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
                    payment = Math.ceil(payment * 30 / 100);
                }
                this.bankAccountService.transfertMoney(player.PlayerData.job.id, player.PlayerData.charinfo.account, payment, (success, reason) => {
                    if (success) {
                        this.notifier.advancedNotify(playerSource, 'Maze Banque', 'Mouvement bancaire', 'Un versement vient d\'être réalisé sur votre compte', 'CHAR_BANK_MAZE', 'success');
                    }
                });

            }

        }
        /*

local Players = QBCore.Functions.GetQBPlayers()
    local SozJobCore = exports["soz-jobs"]:GetCoreObject()

    for _, Player in pairs(Players) do
        local grade = SozJobCore.Jobs[Player.PlayerData.job.id].grades[tostring(Player.PlayerData.job.grade)] or {}
        local payment = grade.salary or 0

        if Player.PlayerData.metadata["injail"] == 0 and Player.PlayerData.job and payment > 0 then
            if Player.PlayerData.job.id == SozJobCore.JobType.Unemployed then
                Account.AddMoney(Player.PlayerData.charinfo.account, payment)
                NotifyPaycheck(Player.PlayerData.source)

                TriggerEvent("monitor:server:event", "paycheck", {player_source = Player.PlayerData.source}, {
                    amount = tonumber(payment),
                })
            else
                if not Player.PlayerData.job.onduty then
                    payment = math.ceil(payment * 30 / 100)
                end

                Account.TransfertMoney(Player.PlayerData.job.id, Player.PlayerData.charinfo.account, payment, function(success, reason)
                    if success then
                        NotifyPaycheck(Player.PlayerData.source)

                        TriggerEvent("monitor:server:event", "paycheck", {player_source = Player.PlayerData.source}, {
                            amount = tonumber(payment),
                        })
                    else
                        print(reason)
                    end
                end)
            end
        end
    end        
        */
    }
}
