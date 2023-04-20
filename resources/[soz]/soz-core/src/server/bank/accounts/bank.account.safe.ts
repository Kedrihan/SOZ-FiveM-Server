import { AccountShell } from "./bank.account.base";
import { Inject, Injectable } from "@public/core/decorators/injectable";
import { PrismaService } from "@public/server/database/prisma.service";
import { JobPermissionService } from "@public/client/job/job.permission.service";
import { QBCore } from "@public/server/qbcore";
import { JobPermission } from "@public/shared/job";


@Injectable()
export class SafeStorageAccount extends AccountShell {

    @Inject(PrismaService)
    private prismaService: PrismaService;

    @Inject(QBCore)
    private qbCore: QBCore;

    @Inject(JobPermissionService)
    private jobPermissionService: JobPermissionService;

    constructor() {
        super();
    }

    public async load(id: string, owner: string): Promise<[number | bigint, boolean]> {
        let created = false;
        let result = await this.prismaService.bank_accounts.findFirst({
            where: {
                account_type: "safestorages",
                businessid: id,
            },
            select: {
                money: true,
            },
        });

        if (result == null) {
            await this.prismaService.bank_accounts.create({
                data: {
                    account_type: "safestorages",
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
                account_type: "safestorages",
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
            return this.jobPermissionService.hasPermission(playerObject.PlayerData.job.id, JobPermission.SocietyPrivateStorage);
        }
        return false;
    }
}