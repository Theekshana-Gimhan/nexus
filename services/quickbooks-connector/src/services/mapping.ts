export function mapInvoiceFromQBO(qboInvoice: any) {
  return {
    externalId: qboInvoice.Id,
    amount: qboInvoice.TotalAmt,
    customer: {
      id: qboInvoice.CustomerRef?.value,
      name: qboInvoice.CustomerRef?.name
    },
    date: qboInvoice.TxnDate,
    meta: qboInvoice
  };
}
