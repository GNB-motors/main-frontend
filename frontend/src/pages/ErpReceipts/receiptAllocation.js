/**
 * Receipt-to-bill allocation math for the adjustment screen.
 *
 * Mirrors the server (erpReceipt/receipt.service: cnLineTotal and its two
 * over-allocation checks) so Post is disabled exactly when the API would
 * refuse: a CN line settles cash received plus every deduction, and that
 * whole amount counts against both the bill's outstanding and the receipt
 * voucher's unadjusted amount.
 */

// Floating-point slack, so 0.1 + 0.2 against 0.3 is not "over".
const EPSILON = 0.001;

export const emptyCnRow = () => ({
  amountReceived: 0,
  detentionDeducted: 0,
  shortageDeducted: 0,
  othersDeducted: 0,
  othersLabel: '',
  remarks: '',
});

/** What one CN line settles. Inputs arrive as strings from <input>; blanks count as 0. */
export const cnLineTotal = (row) =>
  (Number(row.amountReceived) || 0) +
  (Number(row.detentionDeducted) || 0) +
  (Number(row.shortageDeducted) || 0) +
  (Number(row.othersDeducted) || 0);

/** Opening draft for a bill: each CN starts with the detention/shortage already on it. */
export const draftForBill = (bill) => {
  const draft = {};
  for (const cn of bill.cns || []) {
    draft[cn.cnId] = {
      ...emptyCnRow(),
      detentionDeducted: cn.detentionAmount || 0,
      shortageDeducted: cn.shortageAmount || 0,
    };
  }
  return draft;
};

/** The cnAllocations payload for POST /adjustments, with every amount coerced to a number. */
export const toCnAllocations = (bill, cnDraft) =>
  (bill.cns || []).map((cn) => ({
    cnId: cn.cnId,
    ...cnDraft[cn.cnId],
    amountReceived: Number(cnDraft[cn.cnId]?.amountReceived) || 0,
    detentionDeducted: Number(cnDraft[cn.cnId]?.detentionDeducted) || 0,
    shortageDeducted: Number(cnDraft[cn.cnId]?.shortageDeducted) || 0,
    othersDeducted: Number(cnDraft[cn.cnId]?.othersDeducted) || 0,
  }));

/** Live footer for the selected bill: applied, remaining, and whether Post is allowed. */
export const allocationState = ({ voucherUnadjusted = 0, bill = null, cnDraft = {} }) => {
  const allocatingForBill = bill
    ? (bill.cns || []).reduce((s, cn) => s + cnLineTotal(cnDraft[cn.cnId] || emptyCnRow()), 0)
    : 0;
  const remaining = voucherUnadjusted - allocatingForBill;
  const overBill = !!bill && allocatingForBill > (bill.outstandingAmount || 0) + EPSILON;
  const overVoucher = remaining < -EPSILON;
  return {
    allocatingForBill,
    remaining,
    overBill,
    overVoucher,
    canPost: allocatingForBill > EPSILON && !overBill && !overVoucher,
  };
};

/** Sum of what is still unallocated across the unadjusted-receipts queue. */
export const unadjustedTotal = (vouchers) =>
  vouchers.reduce((s, v) => s + (v.unadjustedAmount || 0), 0);
