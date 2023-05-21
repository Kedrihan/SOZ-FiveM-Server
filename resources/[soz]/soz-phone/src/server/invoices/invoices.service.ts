import { InvoiceItem } from '../../../typings/app/invoices';
import { PromiseEventResp, PromiseRequest } from '../lib/PromiseNetEvents/promise.types';
import { invoicesLogger } from './invoices.utils';
class _InvoicesService {
    constructor() {
        invoicesLogger.debug('Invoices service started');
    }

    async handleFetchInvoices(reqObj: PromiseRequest<void>, resp: PromiseEventResp<InvoiceItem[]>) {
        try {
            resp({ status: 'ok', data: exports['soz-core'].GetAllPlayerInvoices(reqObj.source) });
        } catch (e) {
            invoicesLogger.error(`Error in handleFetchInvoices, ${e.toString()}`);
            resp({ status: 'error', errorMsg: 'DB_ERROR' });
        }
    }

    async handlePayInvoice(reqObj: PromiseRequest<number>, resp: PromiseEventResp<void>) {
        try {
            emitNet('soz-core:server:bank:accept-invoice', reqObj.source, reqObj.data);
            resp({ status: 'ok' });
        } catch (e) {
            invoicesLogger.error(`Error in handlePayInvoice, ${e.toString()}`);
            resp({ status: 'error', errorMsg: 'DB_ERROR' });
        }
    }

    async handleRefuseInvoice(reqObj: PromiseRequest<number>, resp: PromiseEventResp<void>) {
        try {
            emitNet('soz-core:server:bank:reject-invoice', reqObj.source, reqObj.data);
            resp({ status: 'ok' });
        } catch (e) {
            invoicesLogger.error(`Error in handleRefuseInvoice, ${e.toString()}`);
            resp({ status: 'error', errorMsg: 'DB_ERROR' });
        }
    }
}

const InvoicesService = new _InvoicesService();
export default InvoicesService;
