import { BankAtmDefault } from "@public/config/bank";
import { AccountShell } from "./bank.account.base";
import { Inject, Injectable } from "@public/core/decorators/injectable";
import { PrismaService } from "@public/server/database/prisma.service";
import { Vector2 } from "@public/shared/polyzone/vector";

@Injectable()
export class AtmAccount extends AccountShell {

    @Inject(PrismaService)
    private prismaService: PrismaService;

    constructor() {
        super();
    }

    public async load(id: string, owner: string, coords: Vector2): Promise<[number | bigint, boolean]> {
        let created = false;
        let defaultMoney = 0;

        let result = await this.prismaService.bank_accounts.findFirst({
            where: {
                account_type: "bank_atm",
                businessid: owner,
            },
            select: {
                money: true,
            },
        });

        if (result == null) {
            let ownerType = AtmAccount.getTerminalType(owner)
            defaultMoney = this.getDefaultMoney(ownerType) || 0
            await this.prismaService.bank_accounts.create({
                data: {
                    account_type: "bank_atm",
                    businessid: owner,
                    money: defaultMoney,
                    coords: JSON.stringify({
                        x: coords[0],
                        y: coords[1],
                    }),
                },
            });
            created = true;
        }

        return [result.money || defaultMoney, created];
    }

    public async save(id: string, owner: string, amount: number | bigint, marked_money: number | bigint): Promise<boolean> {
        await this.prismaService.bank_accounts.updateMany({
            where: {
                account_type: "bank_atm",
                businessid: owner,
            },
            data: {
                money: amount,
            },
        });
        return true
    }

    // Get owner type based on businessid,
    //  eg. "bank_pacific1" => "pacific"
    //      "atm_big_123456" => "big"
    public static getTerminalType(businessid: string, atmType: string = null): string {
        if (atmType != null) {
            return atmType;
        }
        if (businessid.match("atm_ent_.%d+")) {
            return "ent";
        }
        return businessid.match("%a+%d")[0].match("%a+")[0];
    }
    //Get default money amout for specified type of account (bank/ATM)
    private getDefaultMoney(bankType: string) {
        if (BankAtmDefault[bankType] != null) {
            return BankAtmDefault[bankType].maxMoney;
        }
    }
}