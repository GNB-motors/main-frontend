import { verifyFuelMath } from './receiptVerification';

/** A number the server sent, or null when there is none. */
const numOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * How many bills carry a value: { with, of } for the amount and the volume.
 *
 * A total is only a measurement when we know how many bills it came from, so
 * the coverage travels with the total.
 */
const coverageOf = (coverage) => {
  if (!coverage || typeof coverage !== 'object') return null;
  const pair = (withValue, of) => {
    const a = numOrNull(withValue);
    const b = numOrNull(of);
    return a != null && b != null ? { with: a, of: b } : null;
  };
  const total = coverage.totalBills ?? coverage.of ?? coverage.total ?? null;
  const amount =
    coverage.amount && typeof coverage.amount === 'object'
      ? pair(coverage.amount.with, coverage.amount.of)
      : pair(coverage.billsWithAmount ?? coverage.amountWithValue, total);
  const litres =
    coverage.litres && typeof coverage.litres === 'object'
      ? pair(coverage.litres.with, coverage.litres.of)
      : pair(coverage.billsWithLitres ?? coverage.litresWithValue, total);
  return { amount, litres };
};

/** The KPI cards' shape from the server's whole-tab summary. */
export const kpisFromSummary = (summary) => {
  const s = summary || {};
  const totalCount = numOrNull(s.totalCount);
  // A server sum over bills where no litres were read comes back as 0; a
  // real fill is never 0 L, so over a non-empty tab that 0 means "unknown".
  const rawLitres = numOrNull(s.totalLitres);
  const totalLitres = rawLitres === 0 && totalCount > 0 ? null : rawLitres;
  const totalAmount = numOrNull(s.totalAmount);
  return {
    // The summary covers the whole tab.
    scope: 'tab',
    totalCount,
    totalLitres,
    totalAmount,
    pendingCount: numOrNull(s.pendingCount),
    pendingAmount: numOrNull(s.pendingAmount),
    missingOdoCount: numOrNull(s.missingOdoCount),
    rateAnomaliesCount: numOrNull(s.rateAnomaliesCount),
    avgRate:
      totalLitres != null && totalAmount != null && totalLitres > 0
        ? (totalAmount / totalLitres).toFixed(2)
        : '—',
    coverage: coverageOf(s.coverage),
  };
};

/**
 * Compute KPI stats across the rows on the page.
 *
 * These numbers describe one page, not the whole tab, so they are marked
 * 'page' and the cards say they are not a tab total.
 */
export const computeReceiptKpis = (items = []) => {
  let totalLitres = 0;
  let totalAmount = 0;
  let litresBills = 0;
  let amountBills = 0;
  let pendingCount = 0;
  let pendingAmount = 0;
  let pendingAmountsKnown = true;
  let missingOdoCount = 0;
  let rateAnomaliesCount = 0;

  items.forEach((d) => {
    const litres = numOrNull(d.litres);
    const amount = numOrNull(d.amount);
    if (litres != null) {
      totalLitres += litres;
      litresBills += 1;
    }
    if (amount != null) {
      totalAmount += amount;
      amountBills += 1;
    }

    if (d.status === 'READY') {
      pendingCount += 1;
      if (amount == null) pendingAmountsKnown = false;
      else pendingAmount += amount;
    }

    if (d.odometerReading == null || (d.adminNotes && d.adminNotes.includes('MISSING_ODOMETER'))) {
      missingOdoCount += 1;
    }

    const math = verifyFuelMath(d.litres, d.rate, d.amount);
    if (math && !math.isValid) {
      rateAnomaliesCount += 1;
    }
  });

  const avgRate = totalLitres > 0 ? (totalAmount / totalLitres).toFixed(2) : '—';

  return {
    // These numbers cover the page on screen, never the whole tab.
    scope: 'page',
    totalCount: items.length,
    totalLitres,
    totalAmount,
    pendingCount,
    pendingAmount: pendingAmountsKnown ? pendingAmount : null,
    missingOdoCount,
    rateAnomaliesCount,
    avgRate,
    coverage: {
      amount: { with: amountBills, of: items.length },
      litres: { with: litresBills, of: items.length },
    },
  };
};
