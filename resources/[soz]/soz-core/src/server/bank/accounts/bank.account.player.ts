import { DefaultAccountMoney } from "@public/config/bank";
import { AccountShell } from "./bank.account.base";
import { Inject, Injectable } from "@public/core/decorators/injectable";
import { PrismaService } from "@public/server/database/prisma.service";
import { QBCore } from "@public/server/qbcore";
import { BankEvents } from "../../../../../soz-phone/typings/app/bank";

@Injectable()
export class PlayerAccount extends AccountShell {

    @Inject(QBCore)
    private qbCore: QBCore;

    @Inject(PrismaService)
    private prismaService: PrismaService;

    constructor() {
        super();
    }

    public async load(id: string, owner: string): Promise<[number | bigint, boolean]> {
        let created = false;
        let result = await this.prismaService.bank_accounts.findFirst({
            where: {
                account_type: "player",
                accountid: id,
                citizenid: owner,
            },
            select: {
                money: true,
            },
        });

        if (result == null) {
            await this.prismaService.bank_accounts.create({
                data: {
                    account_type: "player",
                    accountid: id,
                    citizenid: owner,
                    money: 0,
                },
            });
            created = true;
        }

        return [result.money || DefaultAccountMoney["player"] || 0, created];
    }

    public async save(id: string, owner: string, amount: number | bigint, marked_money: number | bigint): Promise<boolean> {
        const player = this.qbCore.getPlayerByCitizenId(owner);
        await this.prismaService.bank_accounts.update({
            where: {
                accountid: id,
                citizenid: owner,
            },
            data: {
                money: amount,
            }
        });

        if (player) {
            TriggerClientEvent(BankEvents.FIVEM_EVENT_UPDATE_BALANCE, player.PlayerData.source, player.PlayerData.name, id, amount);
        }

        return true;
    }
}