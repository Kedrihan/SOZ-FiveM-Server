import { Once, OnceStep, OnEvent, OnNuiEvent } from '@core/decorators/event';
import { Inject } from '@core/decorators/injectable';
import { Provider } from '@core/decorators/provider';
import { TargetFactory, TargetOptions } from '@public/client/target/target.factory';
import { emitRpc } from '@public/core/rpc';
import { ClientEvent, NuiEvent, ServerEvent } from '@public/shared/event';
import { JobPermission } from '@public/shared/job';
import { BankData } from '@public/shared/nui/bank';
import { RpcServerEvent } from '@public/shared/rpc';

import { AtmLocations, ATMModels, BankAtmDefault, BankPedLocations, SafeStorages } from '../../config/bank';
import { BlipFactory } from '../blip';
import { ItemService } from '../item/item.service';
import { JobPermissionService } from '../job/job.permission.service';
import { PlayerService } from '../player/player.service';

@Provider()
export class BankProvider {
    private currentBank = null;
    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(JobPermissionService)
    private jobPermissionService: JobPermissionService;

    @Inject(BlipFactory)
    private blipFactory: BlipFactory;

    @Inject(ItemService)
    private itemService: ItemService;

    @Inject(TargetFactory)
    private targetFactory: TargetFactory;

    @Once(OnceStep.PlayerLoaded)
    public onPlayerLoaded() {
        const bankActions: TargetOptions[] = [
            {
                label: 'Compte Personnel',
                icon: 'c:bank/compte_personal.png',
                event: 'banking:openBankScreen',
                blackoutGlobal: true,
            },
        ];

        for (const item of ['small_moneybag', 'medium_moneybag', 'big_moneybag']) {
            bankActions.push({
                label: 'Remplir avec ' + this.itemService.getItem(item).label,
                icon: 'c:stonk/remplir.png',
                blackoutGlobal: true,
                blackoutJob: 'cash-transfer',
                canInteract: async () => {
                    if (this.currentBank !== null && this.currentBank.bank !== null && this.currentBank.type !== null) {
                        const currentMoney = await emitRpc<number>(
                            RpcServerEvent.BANK_GET_MONEY,
                            this.currentBank.bank
                        );
                        if (currentMoney < BankAtmDefault[this.currentBank.type].maxMoney) {
                            return this.playerService.isOnDuty();
                        }
                        return false;
                    }
                    return false;
                },
                action: async () => {
                    const currentMoney = await emitRpc<number>(RpcServerEvent.BANK_GET_MONEY, this.currentBank.bank);
                    const maxMoney = BankAtmDefault[this.currentBank.type].maxMoney;
                    TriggerServerEvent(ServerEvent.STONK_FILL_IN, this.currentBank.bank, item, currentMoney, maxMoney);
                },
                item: item,
            });
        }
        for (const [bank, coords] of Object.entries(BankPedLocations)) {
            if (!this.blipFactory.exist('bank_' + bank)) {
                if (bank == 'pacific1') {
                    this.blipFactory.create('bank_' + bank, {
                        name: 'Pacific Bank',
                        coords: {
                            x: coords[0],
                            y: coords[1],
                            z: coords[2],
                        },
                        sprite: 108,
                        color: 28,
                        scale: 1.0,
                    });
                } else if (bank.match(/fleeca\d+/).length > 0) {
                    this.blipFactory.create('bank_' + bank, {
                        name: 'Banque',
                        coords: {
                            x: coords[0],
                            y: coords[1],
                            z: coords[2],
                        },
                        sprite: 108,
                        color: 2,
                    });
                }
            }
            this.targetFactory.createForPed({
                model: 'ig_bankman',
                coords: {
                    x: coords[0],
                    y: coords[1],
                    z: coords[2],
                    w: coords[3],
                },
                minusOne: true,
                freeze: true,
                invincible: true,
                blockevents: true,
                scenario: 'WORLD_HUMAN_CLIPBOARD',
                target: { options: bankActions, distance: 3.0 },
            });
        }
        this.targetFactory.createForBoxZone(
            'bank_society',
            {
                center: [246.43, 223.79, 106.29],
                length: 2.0,
                width: 15.0,
                minZ: 105.29,
                maxZ: 108.29,
                heading: 340,
            },
            [
                {
                    label: 'Compte Société',
                    icon: 'c:bank/compte_societe.png',
                    event: 'banking:openSocietyBankScreen',
                    blackoutGlobal: true,
                    canInteract: () => {
                        const player = this.playerService.getPlayer();

                        if (!player) {
                            return false;
                        }

                        return (
                            this.playerService.isOnDuty() &&
                            this.jobPermissionService.hasPermission(player.job.id, JobPermission.SocietyBankAccount)
                        );
                    },
                },
            ]
        );
        for (const [model, atmType] of Object.entries(ATMModels)) {
            this.targetFactory.createForModel(
                model,
                [
                    {
                        event: 'banking:openATMScreen',
                        icon: 'c:bank/compte_personal.png',
                        label: 'Compte Personnel',
                    },
                    this.atmRefillAction(atmType, 'small_moneybag'),
                    this.atmRefillAction(atmType, 'medium_moneybag'),
                    this.atmRefillAction(atmType, 'big_moneybag'),
                ],
                1.0
            );
        }
        for (const [id, atmData] of Object.entries(AtmLocations)) {
            if (!atmData.hideBlip) {
                if (this.blipFactory.exist(id)) {
                    this.blipFactory.remove(id);
                }
                this.blipFactory.create(id, {
                    name: 'ATM',
                    coords: { x: atmData.coords[0], y: atmData.coords[1] },
                    sprite: 278,
                    color: 60,
                    alpha: 100,
                });
            }
        }
        for (const [id, safe] of Object.entries(SafeStorages)) {
            this.targetFactory.createForBoxZone(
                'safe:' + id,
                {
                    center: safe.position,
                    length: (safe.size && safe.size[0]) || 1.0,
                    width: (safe.size && safe.size[1]) || 1.0,
                    heading: safe.heading || 0.0,
                    minZ: safe.position[2] - (safe.offsetDownZ || 1.0),
                    maxZ: safe.position[2] + (safe.offsetUpZ || 1.0),
                    debugPoly: safe.debug || false,
                },
                [
                    {
                        label: 'Ouvrir',
                        icon: 'c:bank/compte_safe.png',
                        blackoutGlobal: true,
                        blackoutJob: safe.owner,
                        job: safe.owner,
                        canInteract: () => {
                            const player = this.playerService.getPlayer();

                            if (!player) {
                                return false;
                            }
                            return safe.owner === null || player.job.id.toString() === safe.owner;
                        },
                        action: () => {
                            /**
                             if data.safe.owner == nil or (PlayerData.job ~= nil and PlayerData.job.id == data.safe.owner) then
                                QBCore.Functions.TriggerCallback("banking:server:openSafeStorage", function(isAllowed, money, black_money)
                                    if isAllowed then
                                        OpenSafeStorageMenu(data.SafeId, money, black_money)
                                    else
                                        exports["soz-hud"]:DrawNotification("Vous n'avez pas accès à ce coffre", "error")
                                    end
                                end, data.SafeId)
                            end
                             */
                        },
                    },
                ],
                2.5
            );
        }
    }

    @OnEvent(ClientEvent.BANK_ENTER_LOCATION)
    public async onBankEnter(bankType: string, bankName: string) {
        if (BankPedLocations[bankName] != null) {
            this.currentBank = { bank: bankName, type: bankName.match('%a+')[0] };
        }
    }

    @OnEvent(ClientEvent.BANK_EXIT_LOCATION)
    public async onBankExit(bankType: string, bankName: string) {
        if (BankPedLocations[bankName] != null) {
            this.currentBank = null;
        }
    }

    @OnNuiEvent(NuiEvent.BankDeposit)
    public async onBankDeposit({ data, value }: { data: BankData; value: number }) {}
    @OnNuiEvent(NuiEvent.BankWithdraw)
    public async onBankWithdraw({ data, value }: { data: BankData; value: number }) {}

    private atmRefillAction(atmType: string, item: string) {
        return {
            label: 'Remplir avec ' + this.itemService.getItem(item).label,
            icon: 'c:stonk/remplir.png',
            blackoutGlobal: true,
            blackoutJob: 'cash-transfer',
            canInteract: async (entity: number) => {
                if (atmType !== 'ent') {
                    return false;
                }
                const currentMoney = await emitRpc<number>(
                    RpcServerEvent.ATM_GET_MONEY,
                    atmType,
                    GetEntityCoords(entity)
                );
                if (currentMoney < BankAtmDefault[atmType].maxMoney) {
                    return this.playerService.isOnDuty();
                }
                return false;
            },
            action: (entity: number) => {
                const currentMoney = await emitRpc<number>(
                    RpcServerEvent.ATM_GET_MONEY,
                    atmType,
                    GetEntityCoords(entity)
                );
                const atm = await 
                /*local currentMoney = QBCore.Functions.TriggerRpc("banking:server:getAtmMoney", atmType, GetEntityCoords(entity))
                local atm = QBCore.Functions.TriggerRpc("banking:server:getAtmAccount", atmType, GetEntityCoords(entity))
                local maxMoney = Config.BankAtmDefault[atmType].maxMoney

                TriggerServerEvent("soz-core:server:job:stonk:fill-in", atm.account, item, currentMoney, maxMoney)*/
            },
            item: item,
        };
    }
}
