export enum InvoicesEvents {
    FETCH_ALL_INVOICES = 'phone:app:invoices:getInvoices',
    NEW_INVOICE = 'phone:app:invoices:newInvoice',
    REMOVE_INVOICE = 'phone:app:invoices:removeInvoice',
    REFUSE_INVOICE = 'phone:app:invoices:refuse',
    PAY_INVOICE = 'phone:app:invoices:pay',

    FIVEM_EVENT_INVOICE_PAID = 'soz-core:client:banking:invoicePaid',
    FIVEM_EVENT_INVOICE_REJECTED = 'soz-core:client:banking:invoiceRejected',
    FIVEM_EVENT_INVOICE_RECEIVED = 'soz-core:client:banking:invoiceReceived',
}

export interface InvoiceItem {
    id: number;
    label: string;
    emitterName: string;
    amount: number;
    created_at: number;
}