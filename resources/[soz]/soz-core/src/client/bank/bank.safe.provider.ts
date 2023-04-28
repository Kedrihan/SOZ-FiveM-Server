import { OnEvent, OnNuiEvent, Once, OnceStep } from '@public/core/decorators/event';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { ClientEvent, NuiEvent, ServerEvent } from '@public/shared/event';
import { Notifier } from '../notifier';
import { InputService } from '../nui/input.service';
import { emitRpc } from '@public/core/rpc';
import { MenuType } from '@public/shared/nui/menu';
import { RpcServerEvent } from '@public/shared/rpc';
import { PlayerService } from '../player/player.service';
import { NuiMenu } from '../nui/nui.menu';
import { TargetFactory } from '../target/target.factory';
import { SafeStorages } from '@public/config/bank';

@Provider()
export class BankInvoiceProvider {
    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(InputService)
    private inputService: InputService;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(NuiMenu)
    private nuiMenu: NuiMenu;

    @Inject(TargetFactory)
    private targetFactory: TargetFactory;

    @Once(OnceStep.PlayerLoaded)
    public onPlayerLoaded() {
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
                        action: async () => {
                            const result = await emitRpc<[boolean, number, number]>(
                                RpcServerEvent.BANK_OPEN_SAFE_STORAGE,
                                id,
                            );
                            const isAllowed = result[0];
                            if (isAllowed) {
                                const money = result[1];
                                const marked_money = result[2];
                                this.nuiMenu.openMenu(MenuType.SafeMenu, {
                                    safeStorage: id,
                                    money: money,
                                    marked_money: marked_money,
                                });
                            } else {
                                this.notifier.notify("Vous n'avez pas accès à ce coffre", 'error');
                            }
                        },
                    },
                ],
                2.5,
            );
        }
    }

    @OnNuiEvent<{ safeStorage: string; money_type: 'money' | 'marked_money' }>(NuiEvent.SafeDeposit)
    public async onSafeDeposit({
        safeStorage,
        money_type,
    }: {
        safeStorage: string;
        money_type: 'money' | 'marked_money';
    }) {
        const amount = await this.inputService.askInput({
            title: 'Quantité',
            defaultValue: '0',
        });
        if (amount && parseInt(amount) > 0) {
            emitNet(ServerEvent.BANK_SAFE_DEPOSIT, money_type, safeStorage, parseInt(amount));
        }
    }

    @OnNuiEvent<{ safeStorage: string; money_type: 'money' | 'marked_money' }>(NuiEvent.SafeDepositAll)
    public async onSafeDepositAll({
        safeStorage,
        money_type,
    }: {
        safeStorage: string;
        money_type: 'money' | 'marked_money';
    }) {
        const player = this.playerService.getPlayer();
        if (player.money[money_type] && player.money[money_type] > 0) {
            emitNet(ServerEvent.BANK_SAFE_DEPOSIT, money_type, safeStorage, player.money[money_type]);
        }
    }

    @OnNuiEvent<{ safeStorage: string; money_type: 'money' | 'marked_money' }>(NuiEvent.SafeWithdraw)
    public async onSafeWithdraw({
        safeStorage,
        money_type,
    }: {
        safeStorage: string;
        money_type: 'money' | 'marked_money';
    }) {
        const amount = await this.inputService.askInput({
            title: 'Quantité',
            defaultValue: '0',
        });
        if (amount && parseInt(amount) > 0) {
            emitNet(ServerEvent.BANK_SAFE_WITHDRAW, money_type, safeStorage, parseInt(amount));
        }
    }

    @OnEvent(ClientEvent.BANK_OPEN_HOUSE_SAFE_STORAGE)
    public async onOpenHouseSafeStorage(houseId: string) {
        const result = await emitRpc<[boolean, number, number, number]>(
            RpcServerEvent.BANK_OPEN_HOUSE_SAFE_STORAGE,
            houseId,
        );
        const isAllowed = result[0];
        if (isAllowed) {
            const money = result[1];
            const marked_money = result[2];
            const max = result[3];
            this.nuiMenu.openMenu(MenuType.SafeHouseMenu, {
                safeStorage: houseId,
                money: money,
                marked_money: marked_money,
                max: max,
            });
        }
    }
}
