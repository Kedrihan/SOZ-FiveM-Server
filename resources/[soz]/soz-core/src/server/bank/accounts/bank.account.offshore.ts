import { AccountShell } from "./bank.account.base";
import { Inject, Injectable } from "@public/core/decorators/injectable";
import { PrismaService } from "@public/server/database/prisma.service";
import { QBCore } from "@public/server/qbcore";

@Injectable()
export class OffshoreAccount extends AccountShell {

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
                account_type: "offshore",
                businessid: id,
            },
            select: {
                money: true,
            },
        });

        if (result == null) {
            await this.prismaService.bank_accounts.create({
                data: {
                    account_type: "offshore",
                    businessid: id,
                    money: 0,
                },
            });
            created = true;
        }

        return [result.money || 0, created];
    }

    public async save(id: string, owner: string, amount: number | bigint, marked_money: number | bigint): Promise<boolean> {
        await this.prismaService.bank_accounts.updateMany({
            where: {
                account_type: "offshore",
                businessid: id,
            },
            data: {
                money: amount,
                marked_money: marked_money,
            },
        });
        return true
    }

    public accessAllowed(owner: string, player: string): boolean {
        const playerObject = this.qbCore.getPlayer(Number.parseInt(player));
        if (playerObject) {
            return playerObject.PlayerData.job.id === owner && false; //&& playerObject.PlayerData.job.owner -> cette propriété n'existe pas, je laisse false pour le moment;
        }
        return false;
    }
}