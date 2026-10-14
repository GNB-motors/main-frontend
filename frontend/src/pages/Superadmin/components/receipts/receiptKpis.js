import { verifyFuelMath } from './receiptVerification';

/** The KPI cards' shape from the server's whole-tab summary. */
export const kpisFromSummary = (summary) => {
  const n = (v) => Number(v) || 0;
  const totalLitres = n(summary.totalLitres);
  const totalAmount = n(summary.totalAmount);
  return {
    totalCount: n(summary.totalCount),
    totalLitres,
    totalAmount,
    pendingCount: n(summary.pendingCount),
    pendingAmount: n(summary.pendingAmount),
    missingOdoCount: n(summary.missingOdoCount),
    rateAnomaliesCount: n(summary.rateAnomaliesCount),
    avgRate: totalLitres > 0 ? (totalAmount / totalLitres).toFixed(2) : '—',
  };
};

/**
 * Compute KPI stats summary across items
 */
export const computeReceiptKpis = (items = []) => {
  const totalCount = items.length;
  let totalLitres = 0;
  let totalAmount = 0;
  let pendingCount = 0;
  let pendingAmount = 0;
  let missingOdoCount = 0;
  let rateAnomaliesCount = 0;

  items.forEach((d) => {
    const l = Number(d.litres) || 0;
    const a = Number(d.amount) || 0;
    totalLitres += l;
    totalAmount += a;

    if (d.status === 'READY') {
      pendingCount += 1;
      pendingAmount += a;
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
    totalCount,
    totalLitres,
    totalAmount,
    pendingCount,
    pendingAmount,
    missingOdoCount,
    rateAnomaliesCount,
    avgRate,
  };
};
