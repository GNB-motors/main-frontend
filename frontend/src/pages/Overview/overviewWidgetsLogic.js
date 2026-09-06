/**
 * overviewWidgetsLogic — pure response → MetricTile-prop mappers for the
 * five Overview dashboard widgets (Workstream H step 4, GNB Dashboard artboard).
 *
 * Honesty contract (the hard rule): these mappers never invent a number.
 *  - error with status 403        → permission-denied
 *  - error with status 404        → not-set-up (endpoint not mounted/served)
 *  - any other error (5xx, network) → error
 *  - endpoint alive but no rows   → no-signal (a zero-telemetry org is the
 *    demo org's normal state, not a failure)
 *  - real rows                    → normal, values summed from served fields only
 *
 * Each mapper takes the useApi triple minus loading: { data, error }.
 * Callers render a skeleton while `loading && !data && !error` and only then
 * call the mapper, so no mapper branch depends on the wall clock — fully
 * deterministic to test.
 */
import { formatInrCompact, formatNum } from '../../utils/formatters';

export const tileStateFromError = (error) => {
  if (error?.status === 403) {
    return { state: 'permission-denied', message: 'You do not have access to this feed.' };
  }
  if (error?.status === 404) {
    return { state: 'not-set-up', message: 'This feed is not set up yet.' };
  }
  return { state: 'error', message: 'Feed down — could not load this metric.' };
};

const sum = (rows, key) => rows.reduce((acc, row) => acc + (Number(row?.[key]) || 0), 0);

/**
 * Fleet right now — GET /api/livetracking/positions.
 * data: array of position rows ({ state: ACTIVE|PARKED|OFFLINE, isStale }).
 */
export function mapFleetNowTile({ data, error }) {
  if (error) return { label: 'Fleet right now', ...tileStateFromError(error) };
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) {
    return {
      label: 'Fleet right now',
      state: 'no-signal',
      message: 'No live telemetry for this fleet yet — waiting for the first pull.',
    };
  }
  const moving = rows.filter((r) => r?.state === 'ACTIVE').length;
  const parked = rows.filter((r) => r?.state === 'PARKED').length;
  const silent = rows.length - moving - parked;
  return {
    label: 'Fleet right now',
    state: 'normal',
    tone: moving > 0 ? 'ok' : 'warn',
    value: formatNum(moving),
    unit: 'moving',
    subline: `${formatNum(parked)} parked · ${formatNum(silent)} no signal of ${formatNum(rows.length)} tracked`,
    cta: { label: 'Open live map', href: '/live-tracking' },
  };
}

/**
 * Needs you today — /api/erp/approvals/summary + /api/app/v1/bills?status=PENDING.
 * data: { approvals: { data: { total } }, bills: { data: { total } } }.
 * The tile is the SUM of both queues, so the service fails the whole call if
 * either feed fails — a partial count would read as complete.
 */
export function mapNeedsTodayTile({ data, error }) {
  if (error) return { label: 'Needs you today', ...tileStateFromError(error) };
  const pendingApprovals = Number(data?.approvals?.data?.total) || 0;
  const pendingBills = Number(data?.bills?.data?.total) || 0;
  const total = pendingApprovals + pendingBills;
  return {
    label: 'Needs you today',
    state: 'normal',
    tone: total > 0 ? 'warn' : 'ok',
    value: formatNum(total),
    unit: 'pending',
    subline:
      total === 0
        ? 'Nothing needs your attention'
        : `${formatNum(pendingApprovals)} approvals · ${formatNum(pendingBills)} driver bills waiting`,
    cta: total > 0 ? { label: 'Review', href: '/erp/approvals' } : undefined,
  };
}

/**
 * Idling waste — GET /api/idling-reports/summary over the last 30 days.
 * data: array of per-vehicle rows ({ totalIdleHours, totalWasteInr }).
 * Cron-populated telemetry: an empty array means "nothing reported yet",
 * which for a zero-telemetry org is the correct answer — hence no-signal.
 */
export function mapIdlingWasteTile({ data, error }) {
  if (error) return { label: 'Idling waste', ...tileStateFromError(error) };
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) {
    return {
      label: 'Idling waste',
      state: 'no-signal',
      message: 'Idling telemetry has not reported yet — the nightly job populates this.',
    };
  }
  const wasteInr = sum(rows, 'totalWasteInr');
  const idleHours = sum(rows, 'totalIdleHours');
  return {
    label: 'Idling waste',
    state: 'normal',
    tone: wasteInr > 0 ? 'warn' : 'ok',
    value: formatInrCompact(wasteInr),
    subline: `${formatNum(idleHours, { decimals: 1 })} idle hours · ${formatNum(rows.length)} vehicles`,
  };
}

/**
 * Fuel spend — GET /api/fuel-spend/summary over the last 30 days.
 * data: { totals: { litres, amountInr, logCount } } — a ₹ view over actual
 * fuel bills. Zero bills in the window means the receipts (not the spend
 * itself) are absent, so the tile waits rather than printing a false ₹0.
 */
export function mapFuelSpendTile({ data, error }) {
  if (error) return { label: 'Fuel spend', ...tileStateFromError(error) };
  const totals = data?.totals;
  const logCount = Number(totals?.logCount) || 0;
  const amountInr = Number(totals?.amountInr) || 0;
  if (logCount === 0 || amountInr <= 0) {
    return {
      label: 'Fuel spend',
      state: 'no-signal',
      message: 'No fuel bills recorded in this window yet.',
    };
  }
  return {
    label: 'Fuel spend',
    state: 'normal',
    tone: 'ok',
    value: formatInrCompact(amountInr),
    subline: `${formatNum(Number(totals?.litres) || 0)} L across ${formatNum(logCount)} bills`,
  };
}

/**
 * Cost per km — NOT SET UP BY DESIGN. No endpoint serves fleet cost-per-km:
 * the daily mileage report engine computes it (fleetCostPerKm) but only inside
 * the email-report job; its only route is POST /mileage-report/trigger. With
 * nothing served, the honest state is not-set-up — never a client-side
 * formula stitched from unrelated endpoints.
 */
export const COST_PER_KM_TILE = {
  label: 'Cost per km',
  state: 'not-set-up',
  message:
    'Fleet cost-per-km is not served by the API yet. This tile activates once the mileage-report feed ships.',
};
