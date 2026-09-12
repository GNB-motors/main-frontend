/**
 * documentRoutes — the single source of truth for "where does this document live".
 *
 * The ledger records a `sourceType` + `sourceId` on every entry, and the whole
 * point of the overhaul is that those become links rather than plain text. This
 * maps one to the other.
 *
 * ── THE NULL CONTRACT ──────────────────────────────────────────────────────
 * `documentPathFor` returns **null** for any source type that has no page yet
 * (and for types that never will — an OPENING or REVERSAL entry is not a
 * document you can open).
 *
 * Every link helper must render plain text when the path is null. That is what
 * lets us wire links across the whole module now and let the destinations land
 * later, without ever shipping a link that 404s.
 */

export const SOURCE_TYPES = [
  'SALE_BILL', 'PURCHASE_BILL', 'SUPPLIER_INVOICE', 'RECEIPT', 'PAYMENT',
  'SHORTAGE', 'DETENTION', 'ADVANCE', 'JOURNAL', 'OPENING', 'REVERSAL', 'ON_ACCOUNT',
];

const LABELS = {
  SALE_BILL: 'Sale bill',
  PURCHASE_BILL: 'Purchase bill',
  SUPPLIER_INVOICE: 'Supplier invoice',
  RECEIPT: 'Receipt',
  PAYMENT: 'Payment',
  SHORTAGE: 'Shortage',
  DETENTION: 'Detention',
  ADVANCE: 'Advance',
  JOURNAL: 'Journal',
  OPENING: 'Opening balance',
  REVERSAL: 'Reversal',
  ON_ACCOUNT: 'On account',
};

/** Account types as they appear in an Account 360 URL. */
export const accountPathFor = (accountType, accountId) => {
  if (!accountType || !accountId) return null;
  return `/erp/accounts/${String(accountType).toLowerCase()}/${accountId}`;
};

/**
 * @param {string} sourceType  a LedgerEntry.sourceType
 * @param {string} sourceId    the document id
 * @param {object} extra       optional context, e.g. { tripId }
 * @returns {string|null}      a route, or null when there is nowhere to go
 */
export const documentPathFor = (sourceType, sourceId, extra = {}) => {
  if (!sourceType) return null;

  switch (sourceType) {
    case 'SALE_BILL':
      return sourceId ? `/erp/billing/bill/${sourceId}` : null;

    case 'PURCHASE_BILL':
      return sourceId ? `/erp/payables/purchase-bill/${sourceId}` : null;

    case 'SUPPLIER_INVOICE':
      return sourceId ? `/erp/payables/supplier-invoice/${sourceId}` : null;

    // All four resolve to a Voucher document. Carry the real subtype so the
    // detail page makes ONE activity call, not up to four probes to rediscover
    // a type already known here.
    case 'RECEIPT':
    case 'PAYMENT':
    case 'ON_ACCOUNT':
    case 'JOURNAL':
      return sourceId ? `/erp/accounts/voucher/${sourceId}?type=${sourceType}` : null;

    // Advances belong to a trip, not to a document of their own.
    case 'ADVANCE':
      return extra.tripId ? `/erp/trips/${extra.tripId}` : null;

    // Shortage/detention are deductions recorded against a trip's unloading.
    case 'SHORTAGE':
    case 'DETENTION':
      return extra.tripId ? `/erp/trips/${extra.tripId}` : null;

    // Not documents. Deliberately null.
    case 'OPENING':
    case 'REVERSAL':
    default:
      return null;
  }
};

export const documentLabelFor = (sourceType) => LABELS[sourceType]
  || String(sourceType || '').replace(/_/g, ' ');

/** The docType segment the finance-hub activity endpoint accepts. */
export const ACTIVITY_DOC_TYPES = new Set([
  'SALE_BILL', 'PURCHASE_BILL', 'SUPPLIER_INVOICE',
  'RECEIPT', 'PAYMENT', 'ON_ACCOUNT', 'JOURNAL',
]);

export const hasActivity = (sourceType) => ACTIVITY_DOC_TYPES.has(sourceType);

export default documentPathFor;
