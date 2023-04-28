import { OnEvent } from '@public/core/decorators/event';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { ClientEvent, ServerEvent } from '@public/shared/event';
import { Notifier } from '../notifier';


@Provider()
export class BankInvoiceProvider {
    @Inject(Notifier)
    private notifier: Notifier;


    @OnEvent(ClientEvent.BANK_INVOICE_RECEIVED)
    public onInvoiceReceived(invoiceId: number, label: string, amount: number, emitterName: string) {
        const notificationTimer = GetGameTimer() + 20000;
        this.notifier.advancedNotify("Maze Facture", "Facture de ~r~$" + amount,
            "Raison : " + label + "~n~~n~Faites ~g~Y~s~ pour accepter la facture ou ~r~N~s~ pour la refuser",
            "CHAR_BANK_MAZE", "info", 20000);

        while (notificationTimer > GetGameTimer()) {
            DisableControlAction(0, 246, true);
            DisableControlAction(0, 249, true);

            if (IsDisabledControlJustReleased(0, 246)) {
                emitNet(ServerEvent.BANK_ACCEPT_INVOICE, invoiceId);
                return;
            }

            if (IsDisabledControlJustReleased(0, 249)) {
                emitNet(ServerEvent.BANK_REFUSE_INVOICE, invoiceId);
                return;
            }

            Wait(0);
        }
    }
}
