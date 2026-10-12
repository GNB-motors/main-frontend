/**
 * A loss alert's check against the refuel bills (backend fuelIntegrity/billCheck).
 * One verdict, shown the same way on Owner Alerts, Fuel Integrity and the
 * mileage cycles. Tones follow StatusPill: a confirmed loss is critical, a
 * contradicted one is ok (it left the theft list).
 */
export const BILL_VERDICT = {
  CONFIRMED: { label: 'Bill confirms loss', tone: 'critical' },
  WAITING_FOR_BILL: { label: 'Pending bill check', tone: 'inert' },
  INCONCLUSIVE: { label: 'Bill can’t tell', tone: 'caution' },
  CONTRADICTED: { label: 'Bill shows no loss', tone: 'ok' },
  TELEMETRY_CLEARED: { label: 'Cleared on recheck', tone: 'ok' },
  NO_BILLS: { label: 'No bills to check', tone: 'inert' },
};

/** @returns {{verdict:string, label:string, tone:string, reason:string|null}|null} */
export function billCheckView(check) {
  if (!check || !check.verdict) return null;
  const v = BILL_VERDICT[check.verdict];
  if (!v) return null;
  return { verdict: check.verdict, ...v, reason: check.reason || null };
}
