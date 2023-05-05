import { JobPermissionService } from '@public/client/job/job.permission.service';
import { BankAtmDefault, DefaultAccountMoney } from '@public/config/bank';
import { Inject, Injectable } from '@public/core/decorators/injectable';
import { PrismaService } from '@public/server/database/prisma.service';
import { QBCore } from '@public/server/qbcore';
import { JobPermission } from '@public/shared/job';
import { Vector2, Vector3 } from '@public/shared/polyzone/vector';

@Injectable()
export class BankAccountManager {
    @Inject(QBCore)
    private qbCore: QBCore;

    @Inject(PrismaService)
    private prismaService: PrismaService;

    @Inject(JobPermissionService)
    private jobPermissionService: JobPermissionService;

    public async load(
        id: string,
        owner: string,
        coords: Vector2 | Vector3,
        type: string,
    ): Promise<[number | bigint, boolean]> {
        switch (type) {
            case 'player':
                return await this.loadPlayerAccount(id, owner);
            case 'business':
                return await this.loadBusinessAccount(id, owner);
            case 'atm':
                return await this.loadAtmAccount(id, owner, coords);
            case 'offshore':
                return await this.loadOffshoreAccount(id);
            case 'safe':
                return await this.loadSafeAccount(id);
            case 'house':
                return await this.loadHouseAccount(id);
        }
    }

    public async save(
        id: string,
        owner: string,
        amount: number | bigint,
        marked_money: number | bigint,
        type: string,
    ): Promise<boolean> {
        switch (type) {
            case 'player':
                return await this.savePlayerAccount(id, owner, amount);
            case 'business':
                return await this.saveBusinessAccount(owner, amount);
            case 'atm':
                return await this.saveAtmAccount(owner, amount);
            case 'farm':
                return true;
            case 'offshore':
                return await this.saveOffshoreAccount(id, amount, marked_money);
            case 'safe':
                return await this.saveSafeAccount(id, marked_money);
            case 'house':
                return await this.saveHouseAccount(id, marked_money);
        }
    }

    public accessAllowed(owner: string, player: number, type: string): boolean {
        const playerObject = this.qbCore.getPlayer(player);
        switch (type) {
            case 'house':
                return true;
            case 'offshore':
                if (playerObject) {
                    return playerObject.PlayerData.job.id === owner && false; //&& playerObject.PlayerData.job.owner -> cette propriété n'existe pas, je laisse false pour le moment;
                }
                return false;
            case 'safe':
                if (playerObject) {
                    return this.jobPermissionService.hasPermission(
                        playerObject.PlayerData.job.id,
                        JobPermission.SocietyPrivateStorage,
                    );
                }
                return false;
        }
    }

    private async savePlayerAccount(id: string, owner: string, amount: number | bigint): Promise<boolean> {
        const player = this.qbCore.getPlayerByCitizenId(owner);
        await this.prismaService.bank_accounts.updateMany({
            where: {
                accountid: id,
                citizenid: owner,
            },
            data: {
                money: amount,
            },
        });

        if (player) {
            TriggerClientEvent(
                'phone:client:app:bank:updateBalance',
                player.PlayerData.source,
                player.PlayerData.name,
                id,
                amount,
            );
        }

        return true;
    }

    private async saveBusinessAccount(owner: string, amount: number | bigint): Promise<boolean> {
        await this.prismaService.bank_accounts.updateMany({
            where: {
                account_type: 'business',
                businessid: owner,
            },
            data: {
                money: amount,
            },
        });
        return true;
    }
    private async saveAtmAccount(owner: string, amount: number | bigint): Promise<boolean> {
        await this.prismaService.bank_accounts.updateMany({
            where: {
                account_type: 'bank_atm',
                businessid: owner,
            },
            data: {
                money: amount,
            },
        });
        return true;
    }

    private async saveSafeAccount(id: string, marked_money: number | bigint): Promise<boolean> {
        await this.prismaService.bank_accounts.updateMany({
            where: {
                account_type: 'safestorages',
                businessid: id,
            },
            data: {
                marked_money: marked_money,
            },
        });
        return true;
    }

    private async saveOffshoreAccount(id: string, amount: number | bigint, marked_money: number | bigint) {
        await this.prismaService.bank_accounts.updateMany({
            where: {
                account_type: 'offshore',
                businessid: id,
            },
            data: {
                money: amount,
                marked_money: marked_money,
            },
        });
        return true;
    }

    private async saveHouseAccount(id: string, marked_money: number | bigint) {
        await this.prismaService.bank_accounts.updateMany({
            where: {
                account_type: 'safestorages',
                houseid: id,
            },
            data: {
                marked_money: marked_money,
            },
        });
        return true;
    }

    private async loadBusinessAccount(id: string, owner: string): Promise<[number | bigint, boolean]> {
        let created = false;
        let result = await this.prismaService.bank_accounts.findFirst({
            where: {
                account_type: 'business',
                businessid: owner,
            },
            select: {
                money: true,
            },
        });

        if (result == null) {
            await this.prismaService.bank_accounts.create({
                data: {
                    account_type: 'business',
                    businessid: owner,
                    money: 0,
                },
            });
            created = true;
        }

        return [result.money || DefaultAccountMoney['business'] || 0, created];
    }

    private async loadPlayerAccount(id: string, owner: string): Promise<[number | bigint, boolean]> {
        let created = false;
        let result = await this.prismaService.bank_accounts.findFirst({
            where: {
                account_type: 'player',
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
                    account_type: 'player',
                    accountid: id,
                    citizenid: owner,
                    money: 0,
                },
            });
            created = true;
        }

        return [result.money || DefaultAccountMoney['player'] || 0, created];
    }
    private async loadOffshoreAccount(id: string): Promise<[number | bigint, boolean]> {
        let created = false;
        let result = await this.prismaService.bank_accounts.findFirst({
            where: {
                account_type: 'offshore',
                businessid: id,
            },
            select: {
                money: true,
            },
        });

        if (result == null) {
            await this.prismaService.bank_accounts.create({
                data: {
                    account_type: 'offshore',
                    businessid: id,
                    money: 0,
                },
            });
            created = true;
        }

        return [result.money || 0, created];
    }

    private async loadSafeAccount(id: string): Promise<[number | bigint, boolean]> {
        let created = false;
        let result = await this.prismaService.bank_accounts.findFirst({
            where: {
                account_type: 'safestorages',
                businessid: id,
            },
            select: {
                money: true,
            },
        });

        if (result == null) {
            await this.prismaService.bank_accounts.create({
                data: {
                    account_type: 'safestorages',
                    businessid: id,
                    money: 0,
                },
            });
            created = true;
        }

        return [result.money || 0, created];
    }
    private async loadHouseAccount(id: string): Promise<[number | bigint, boolean]> {
        let created = false;
        let result = await this.prismaService.bank_accounts.findFirst({
            where: {
                account_type: 'safestorages',
                houseid: id,
            },
            select: {
                money: true,
            },
        });

        if (result == null) {
            await this.prismaService.bank_accounts.create({
                data: {
                    account_type: 'safestorages',
                    houseid: id,
                    money: 0,
                },
            });
            created = true;
        }

        return [result.money || 0, created];
    }
    private async loadAtmAccount(
        id: string,
        owner: string,
        coords: Vector2 | Vector3,
    ): Promise<[number | bigint, boolean]> {
        let created = false;
        let defaultMoney = 0;

        let result = await this.prismaService.bank_accounts.findFirst({
            where: {
                account_type: 'bank_atm',
                businessid: owner,
            },
            select: {
                money: true,
            },
        });

        if (result == null) {
            let ownerType = this.getTerminalType(owner);
            defaultMoney = this.getDefaultMoney(ownerType) || 0;
            await this.prismaService.bank_accounts.create({
                data: {
                    account_type: 'bank_atm',
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
    // Get owner type based on businessid,
    //  eg. "bank_pacific1" => "pacific"
    //      "atm_big_123456" => "big"
    public getTerminalType(businessid: string, atmType: string = null): string {
        if (atmType != null) {
            return atmType;
        }
        if (businessid.match('atm_ent_.%d+')) {
            return 'ent';
        }
        return businessid.match('%a+%d')[0].match('%a+')[0];
    }
    //Get default money amout for specified type of account (bank/ATM)
    private getDefaultMoney(bankType: string) {
        if (BankAtmDefault[bankType] != null) {
            return BankAtmDefault[bankType].maxMoney;
        }
    }
}
