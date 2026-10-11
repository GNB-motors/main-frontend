/**
 * Money rules for the Account 360 screen.
 *
 * Balances follow the ledger convention: positive = net debit = they owe us.
 */

/**
 * Credit-limit usage for a party balance. A credit (negative) balance uses
 * none of the limit; no limit, or no balance yet, means there is no gauge.
 * @returns {{ utilisation: number|null, overLimit: boolean, overBy: number }}
 */
export const creditUsage = (creditLimit, balance) => {
  if (!(creditLimit > 0) || balance == null) {
    return { utilisation: null, overLimit: false, overBy: 0 };
  }
  const owed = Number(balance) || 0;
  return {
    utilisation: (Math.max(0, owed) / creditLimit) * 100,
    overLimit: owed > creditLimit,
    overBy: Math.max(0, owed - creditLimit),
  };
};

/**
 * Total still open across a page of statement items. A fully settled item
 * keeps its explicit 0; only an item with no outstanding figure falls back to
 * its net amount.
 */
export const openItemsTotal = (rows) =>
  rows.reduce((s, r) => s + (r.outstandingAmount ?? r.netAmount ?? 0), 0);
