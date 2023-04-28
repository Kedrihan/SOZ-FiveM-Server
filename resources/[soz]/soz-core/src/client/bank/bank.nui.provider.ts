import { OnEvent, OnNuiEvent } from '@public/core/decorators/event';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { ClientEvent, NuiEvent, ServerEvent } from '@public/shared/event';
import { Notifier } from '../notifier';
import { AnimationService } from '../animation/animation.service';
import { emitRpc } from '@public/core/rpc';
import { RpcServerEvent } from '@public/shared/rpc';
import { AtmMinimalInformation, BankingInformation } from '@public/shared/bank';
import { BankCurrentService } from './bank.current.service';
import { NuiDispatch } from '../nui/nui.dispatch';
import { Result, isErr, isOk } from '@public/shared/result';
import { BankAtmDefault, ErrorMessage } from '@public/config/bank';

@Provider()
export class BankInvoiceProvider {
    private usedBankAtm;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(NuiDispatch)
    private dispatcher: NuiDispatch;

    @Inject(BankCurrentService)
    private bankCurrentService: BankCurrentService;

    @Inject(AnimationService)
    private animationService: AnimationService;

    private playAnimation() {
        if (!IsNuiFocused()) {
            this.animationService.playAnimation(
                {
                    base: {
                        dictionary: 'anim@mp_atm@enter',
                        name: 'enter',
                        blendInSpeed: 8.0,
                        blendOutSpeed: -8.0,
                        duration: 3000,
                        options: {
                            enablePlayerControl: false,
                            onlyUpperBody: false,
                        },
                    },
                },
                {
                    noClearPedTask: true,
                },
            );
        }
    }
    private getATMOrBankAccount(atm: string, bank: string) {
        if (atm && atm.match('atm_ent_%w+')) {
            return atm;
        }
        return bank;
    }

    private async openBankScreen(
        account: string,
        isATM: boolean,
        bankAtmAccountId: string,
        atmType?: string,
        atmName?: string,
    ) {
        const bankingInfo = await emitRpc<BankingInformation>(RpcServerEvent.BANK_GET_BANKING_INFORMATIONS, account);
        if (bankingInfo) {
            this.playAnimation();

            SetNuiFocus(true, true);
            SendNUIMessage({
                status: 'openbank',
                information: bankingInfo,
                isATM,
                atmType,
                atmName,
                bankAtmAccount: bankAtmAccountId,
            });
        }
    }
    @OnEvent(ClientEvent.BANK_OPEN_SCREEN)
    public async openBankScreenEvent() {
        const currentBank = await this.bankCurrentService.getCurrentBank();
        const accountId = await emitRpc<string>(RpcServerEvent.BANK_GET_ACCOUNT, currentBank.bank);
        this.openBankScreen(null, false, accountId);
    }

    @OnEvent(ClientEvent.BANK_OPEN_ATM_SCREEN)
    public async openATMScreenEvent(data: { atmType: string; entity: number }) {
        const atm = await emitRpc<AtmMinimalInformation>(
            RpcServerEvent.ATM_GET_ACCOUNT,
            data.atmType,
            GetEntityCoords(data.entity),
        );
        this.openBankScreen(null, true, atm.account, data.atmType, atm.name);
    }

    @OnEvent(ClientEvent.BANK_OPEN_SOCIETY_SCREEN)
    public async openSocietyBankScreenEvent() {
        const currentBank = await this.bankCurrentService.getCurrentBank();
        const accountId = await emitRpc<string>(RpcServerEvent.BANK_GET_ACCOUNT, currentBank.bank);
        this.openBankScreen(null, false, accountId);
    }

    @OnNuiEvent(NuiEvent.BankClosed)
    public async closeBankScreenEvent(): Promise<void> {
        this.dispatcher.dispatch('bank', 'close');
        this.playAnimation();
    }

    @OnNuiEvent(NuiEvent.CreateOffshoreAccount)
    public async createOffshoreAccountEvent(data: { account: string }): Promise<void> {
        const result = await emitRpc<Result<boolean, string>>(
            RpcServerEvent.BANK_CREATE_OFFSHORE_ACCOUNT,
            data.account,
        );
        if (isOk(result)) {
            this.notifier.advancedNotify(
                'Maze Banque',
                'Création de compte',
                'Vous avez crée un nouveau compte',
                'CHAR_BANK_MAZE',
                'success',
            );
            this.openBankScreen(null, false, 'offshore_' + data.account);
        } else {
            this.notifier.notify(ErrorMessage[result.err], 'error');
        }
    }

    @OnNuiEvent(NuiEvent.BankDeposit)
    public async depositEvent(data: {
        account: string;
        amount: number;
        isATM: boolean;
        bankAtmAccount: string;
        atmType?: string;
        atmName?: string;
    }): Promise<void> {
        if (!data.amount || data.amount <= 0) {
            return;
        }
        const result = await emitRpc<Result<boolean, string>>(
            RpcServerEvent.BANK_TRANSFER_MONEY,
            data.account,
            data.amount,
        );
        if (isOk(result)) {
            this.notifier.advancedNotify(
                'Maze Banque',
                'Dépot: ~g~' + data.amount + '$',
                `Vous avez déposé de l'argent`,
                'CHAR_BANK_MAZE',
                'success',
            );
        } else {
            this.notifier.notify(ErrorMessage[result.err], 'error');
        }
        this.openBankScreen(data.account, data.isATM, data.bankAtmAccount, data.atmType, data.atmName);
    }

    @OnNuiEvent(NuiEvent.BankWithdraw)
    public async withdrawEvent(data: {
        account: string;
        amount: number;
        isATM: boolean;
        bankAtmAccount: string;
        atmType?: string;
        atmName?: string;
    }): Promise<void> {
        const terminalType = await emitRpc<string>(
            RpcServerEvent.BANK_GET_TERMINAL_TYPE,
            data.bankAtmAccount,
            data.atmType,
        );
        const terminalConfig = BankAtmDefault[terminalType];
        let lastUse = null;
        if (terminalConfig.maxWithdrawal) {
            if (data.amount > terminalConfig.maxWithdrawal) {
                this.notifier.notify(
                    ErrorMessage['max_widthdrawal_limit'].replace('{0}', terminalConfig.maxWithdrawal.toString()),
                    'error',
                );
                return;
            }
            lastUse = this.usedBankAtm[data.atmName || data.bankAtmAccount];
            if (lastUse !== undefined) {
                const amountAvailableForWithdraw = terminalConfig.maxWithdrawal - lastUse.amountWithdrawn;
                const remainingTime = terminalConfig.limit + lastUse.lastUsed - GetGameTimer();

                const limit = ErrorMessage['limit']
                    .replace('{0}', amountAvailableForWithdraw.toString())
                    .replace('{1}', Math.ceil(terminalConfig.limit / 60000).toString());
                if (remainingTime > 0) {
                    if (amountAvailableForWithdraw <= 0) {
                        this.notifier.notify(
                            limit +
                                ErrorMessage['time_limit'].replace('{0}', Math.ceil(remainingTime / 60000).toString()),
                            'error',
                        );
                        return;
                    } else if (data.amount > amountAvailableForWithdraw) {
                        this.notifier.notify(
                            limit +
                                ErrorMessage['withdrawal_limit'].replace('{0}', amountAvailableForWithdraw.toString()),
                            'error',
                        );
                        return;
                    }
                }
            }
        }
        const resultLiquidity = await emitRpc<Result<boolean, string>>(
            RpcServerEvent.BANK_HAS_ENOUGH_LIQUIDITY,
            this.getATMOrBankAccount(data.atmName, data.bankAtmAccount),
            data.amount,
        );
        if (isErr(resultLiquidity)) {
            if (resultLiquidity.err === 'invalid_liquidity') {
                this.notifier.notify(ErrorMessage[resultLiquidity.err], 'error');
            } else {
                this.notifier.notify(ErrorMessage['unknown'], 'error');
            }
        }
        const hasEnoughLiquidity = isOk(resultLiquidity);
        if (hasEnoughLiquidity && data.amount !== null && data.amount > 0) {
            const result = await emitRpc<Result<boolean, string>>(
                RpcServerEvent.BANK_TRANSFER_MONEY,
                data.account,
                'player',
                data.amount,
            );
            if (isOk(result)) {
                this.notifier.advancedNotify(
                    'Maze Banque',
                    'Retrait: ~r~' + data.amount + '$',
                    `Vous avez retiré de l'argent`,
                    'CHAR_BANK_MAZE',
                    'success',
                );
                TriggerServerEvent(ServerEvent.BANK_REMOVE_LIQUIDITY, data.bankAtmAccount, data.amount);
                let newAmount = Number(data.amount);
                if (lastUse && lastUse.amountWithdrawn) {
                    if (lastUse.amountWithdrawn == terminalConfig.maxWithdrawal) {
                        lastUse.amountWithdrawn = 0;
                    }
                    newAmount = lastUse.amountWithdrawn + data.amount;
                }
                this.usedBankAtm[data.atmName || data.bankAtmAccount] = {
                    lastUsed: GetGameTimer(),

                    amountWithdrawn: newAmount,
                };
            } else {
                this.notifier.notify(ErrorMessage[result.err], 'error');
            }
            this.openBankScreen(data.account, data.isATM, data.bankAtmAccount, data.atmType, data.atmName);
        }
    }

    @OnNuiEvent(NuiEvent.BankOffshoreDeposit)
    public async offshoreDepositEvent(data: {
        account: string;
        amount: number;
        isATM: boolean;
        bankAtmAccount: string;
        atmType?: string;
        atmName?: string;
    }): Promise<void> {
        const amount = Number(data.amount);
        if (amount !== null && amount > 0) {
            const result = await emitRpc<Result<boolean, string>>(
                RpcServerEvent.BANK_TRANSFER_OFFSHORE_MONEY,
                data.account,
                amount,
            );
            if (isOk(result)) {
                this.notifier.advancedNotify(
                    'Maze Banque',
                    'Dépot: ~g~' + amount + '$',
                    `Vous avez déposé de l'argent`,
                    'CHAR_BANK_MAZE',
                    'success',
                );
            } else {
                this.notifier.notify(ErrorMessage[result.err], 'error');
            }
            this.openBankScreen(data.account, data.isATM, data.bankAtmAccount, data.atmType, data.atmName);
        }
    }

    @OnNuiEvent(NuiEvent.BankTransfer)
    public async transferEvent(data: {
        accountSource: string;
        accountTarget: string;
        amount: number;
        isATM: boolean;
        bankAtmAccount: string;
        atmType?: string;
        atmName?: string;
    }): Promise<void> {
        const amount = Number(data.amount);
        if (amount !== null && amount > 0) {
            const result = await emitRpc<Result<boolean, string>>(
                RpcServerEvent.BANK_TRANSFER_MONEY,
                data.accountSource,
                data.accountTarget,
                amount,
                true,
            );
            if (isOk(result)) {
                this.notifier.advancedNotify(
                    'Maze Banque',
                    'Transfert: ~r~' + amount + '$',
                    `Vous avez transféré de l'argent sur un compte`,
                    'CHAR_BANK_MAZE',
                    'success',
                );
            } else {
                this.notifier.notify(ErrorMessage[result.err], 'error');
            }
            this.openBankScreen(data.accountSource, data.isATM, data.bankAtmAccount, data.atmType, data.atmName);
        }
    }

    /*

    */
}
