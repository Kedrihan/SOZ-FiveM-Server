import { PlayerVehicleState } from '@public/shared/vehicle/player.vehicle';

import { On } from '../../core/decorators/event';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { Rpc } from '../../core/decorators/rpc';
import { DrivingSchoolConfig, DrivingSchoolLicenseType } from '../../shared/driving-school';
import { ClientEvent, ServerEvent } from '../../shared/event';
import { Vector3, Vector4 } from '../../shared/polyzone/vector';
import { RpcServerEvent } from '../../shared/rpc';
import { PrismaService } from '../database/prisma.service';
import { Notifier } from '../notifier';
import { PlayerMoneyService } from '../player/player.money.service';
import { PlayerService } from '../player/player.service';
import { VehicleSpawner } from '../vehicle/vehicle.spawner';

@Provider()
export class BankAtmProvider {
    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(PlayerMoneyService)
    private playerMoneyService: PlayerMoneyService;

    @Inject(PrismaService)
    private prismaService: PrismaService;

    @Inject(VehicleSpawner)
    private vehicleSpawner: VehicleSpawner;

    @On(ServerEvent.DRIVING_SCHOOL_PLAYER_PAY)
    public makePlayerPay(source: number, licenseType: DrivingSchoolLicenseType, spawnPoint: Vector4) {
        const lData = DrivingSchoolConfig.licenses[licenseType];
        if (!lData || typeof lData.price !== 'number') {
            return;
        }

        if (!this.playerMoneyService.remove(source, lData.price)) {
            this.notifier.notify(source, "Vous n'avez pas assez d'argent", 'error');
            return;
        }

        TriggerClientEvent(ClientEvent.DRIVING_SCHOOL_SETUP_EXAM, source, licenseType, spawnPoint);
    }

    @Rpc(RpcServerEvent.ATM_GET_MONEY)
    public async getAtmMoney(source: number, atmType: string, coords: number[]) {

        return await this.vehicleSpawner.spawnTemporaryVehicle(source, model);
    }
    private GetAtmAccount(atmType: string, coords: number[]) {
        const coordsHash = GetAtmHashByCoords(coords)
        const accountName = GetAtmAccountName(atmType, coordsHash, coords)
        return GetOrCreateAccount(accountName, coords)
    }

    public
    /**
     *     local function GetOrCreateAccount(accountName, coords)
    local account, created = this.Account(accountName), false
    if account == nil then
        account = Account.Create(accountName, "bank-atm", "bank-atm", accountName, nil, nil, coords)
        created = true
    end
    return account, created
end


     * local function GetAtmAccountName(atmType, atmCoordsHash, coords)
    local atmAccount = nil
    local atmIdentifier = string.format("atm_%s_%s", atmType, atmCoordsHash)

    if atmType == "ent" then
        return atmIdentifier
    end

    if Config.AtmLocations[atmIdentifier] ~= nil then
        atmAccount = Config.AtmLocations[atmIdentifier].accountId
    end

    if atmAccount == nil and coords then
        atmAccount = "bank_" .. GetClosestFleeca(coords)
    end

    return atmAccount
end
     * 
     * 
     * local function GetAtmHashByCoords(coords)
    local formattedCoords = {}
    for _, v in pairs({"x", "y", "z"}) do
        table.insert(formattedCoords, math.floor(coords[v] * 100) / 100)
    end
    return GetHashKey(table.concat(formattedCoords, "_"))
end


     * QBCore.Functions.CreateCallback("banking:server:getAtmMoney", function(source, cb, atmType, coords)
    local account, _ = GetAtmAccount(atmType, coords)
    cb(account.money)
end)
     */

    @On(ServerEvent.DRIVING_SCHOOL_UPDATE_VEHICLE_LIMIT)
    public async updateVehicleLimit(source: number, limit: number, price: number) {
        if (!this.playerMoneyService.remove(source, price, 'money')) {
            this.notifier.notify(source, "Vous n'avez pas assez d'argent", 'error');
            return;
        }

        this.playerService.setPlayerMetadata(source, 'vehiclelimit', limit);

        this.notifier.notify(
            source,
            `Vous venez d'améliorer votre carte grise au niveau ${limit} pour $${price}`,
            'success'
        );
    }

    @Rpc(RpcServerEvent.DRIVING_SCHOOL_CHECK_REMAINING_SLOTS)
    public async checkRemainingSlots(source: number) {
        const player = this.playerService.getPlayer(source);
        if (!player) return;

        const vehicleModels = (
            await this.prismaService.vehicle.findMany({
                select: {
                    model: true,
                },
                where: {
                    dealershipId: {
                        not: null,
                    },
                    AND: {
                        dealershipId: {
                            not: 'cycle',
                        },
                    },
                },
            })
        ).map(v => v.model);
        const playerVehicleCount = await this.prismaService.playerVehicle.count({
            where: {
                citizenid: player.citizenid,
                job: null,
                state: {
                    not: PlayerVehicleState.Destroyed,
                },
                vehicle: {
                    in: vehicleModels,
                },
            },
        });
        const limit = player.metadata.vehiclelimit;

        return Math.max(limit - playerVehicleCount, 0);
    }
}
