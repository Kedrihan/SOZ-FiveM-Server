import { AccountShell } from "./bank.account.base";
import { Inject, Injectable } from "@public/core/decorators/injectable";
import { PrismaService } from "@public/server/database/prisma.service";

@Injectable()
export class HouseSafeAccount extends AccountShell {

    @Inject(PrismaService)
    private prismaService: PrismaService;

    constructor() {
        super();
    }

    public async load(id: string, owner: string): Promise<[number | bigint, boolean]> {
        let created = false;
        let result = await this.prismaService.bank_accounts.findFirst({
            where: {
                account_type: "safestorages",
                houseid: id,
            },
            select: {
                money: true,
            },
        });

        if (result == null) {
            await this.prismaService.bank_accounts.create({
                data: {
                    account_type: "safestorages",
                    houseid: id,
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
                houseid: id,
            },
            data: {
                marked_money: marked_money,
            },
        });
        return true
    }

    public accessAllowed(owner: string, player: string): boolean {
        return true;
    }
}