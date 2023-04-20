import { DefaultAccountMoney } from "@public/config/bank";
import { AccountShell } from "./bank.account.base";
import { Inject, Injectable } from "@public/core/decorators/injectable";
import { PrismaService } from "@public/server/database/prisma.service";

@Injectable()
export class BusinessAccount extends AccountShell {

    @Inject(PrismaService)
    private prismaService: PrismaService;

    constructor() {
        super();
    }

    public async load(id: string, owner: string): Promise<[number | bigint, boolean]> {
        let created = false;
        let result = await this.prismaService.bank_accounts.findFirst({
            where: {
                account_type: "business",
                businessid: owner,
            },
            select: {
                money: true,
            },
        });

        if (result == null) {
            await this.prismaService.bank_accounts.create({
                data: {
                    account_type: "business",
                    businessid: owner,
                    money: 0,
                },
            });
            created = true;
        }

        return [result.money || DefaultAccountMoney["business"] || 0, created];
    }

    public async save(id: string, owner: string, amount: number | bigint, marked_money: number | bigint): Promise<boolean> {
        await this.prismaService.bank_accounts.updateMany({
            where: {
                account_type: "business",
                businessid: owner,
            },
            data: {
                money: amount,
            },
        });
        return true
    }
}