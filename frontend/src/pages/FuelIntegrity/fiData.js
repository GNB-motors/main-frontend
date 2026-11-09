import { formatINR, formatLitres } from '../../utils/formatters';
import { formatInIST } from '../../utils/dateUtils';
import { isReviewLoss, reviewLossL, lossLabelFor } from './fuelVerdicts';

export const RISK_RANK = { Critical: 4, High: 3, Medium: 2, Low: 1, Healthy: 0 };
export const RISK_TONE = {
  Critical: 'critical',
  High: 'critical',
  Medium: 'caution',
  Low: 'caution',
  Healthy: 'ok',
};

export function computeRisk(v) {
  if ((v.siphonSuspectedLossL || 0) > 0) return 'Critical';
  if ((v.defFlagCount || 0) >= 15 || (v.billFlagCount || 0) >= 3) return 'High';
  if ((v.defFlagCount || 0) >= 5 || (v.billFlagCount || 0) >= 1) return 'Medium';
  if ((v.defFlagCount || 0) >= 1) return 'Low';
  return 'Healthy';
}

// Merged events feed: fills + reviewed loss windows + DEF-flag windows,
// newest first. V2 balance loss and legacy parked loss keep their own labels.
export function buildEvents(fills, windows, pricePerL) {
  const fillEvents = fills.map((f) => ({
    id: `fill-${f._id}`,
    kind: 'fill',
    vehicle: f.registrationNumber,
    litres: f.litres,
    inr: f.litres != null ? f.litres * pricePerL : null,
    at: f.at,
    lat: f.lat,
    lng: f.lng,
    confirmationStatus: f.confirmationStatus,
    billFlag: f.billFlag,
    billVarianceL: f.billVarianceL,
    billComparable: f.billComparable,
    billToleranceL: f.billToleranceL,
    smoothedJumpL: f.smoothedJumpL,
    odometer: f.odometer,
    claimedLitres: f.claimedLitres,
  }));
  // Use the v2 REVIEW_LOSS or legacy parked-loss verdict. The old boolean
  // flag alone does not establish a reviewable loss.
  const lossEvents = windows
    .filter((w) => isReviewLoss(w))
    .map((w) => ({
      id: `loss-${w._id}`,
      kind: 'loss',
      vehicle: w.registrationNumber,
      litres: reviewLossL(w),
      lossLabel: lossLabelFor(w),
      inr: reviewLossL(w) != null ? Math.max(0, reviewLossL(w)) * pricePerL : null,
      at: w.windowTo,
      windowFrom: w.windowFrom,
      windowTo: w.windowTo,
      confidence: w.siphonConfidence,
      window: w,
    }));
  const defEvents = windows
    .filter((w) => w.defRatioFlag)
    .map((w) => ({
      id: `def-${w._id}`,
      kind: 'def',
      vehicle: w.registrationNumber,
      at: w.windowTo,
      windowFrom: w.windowFrom,
      windowTo: w.windowTo,
      defPct: w.defToFuelRatioPct,
      defFlag: w.defRatioFlag,
      window: w,
    }));
  return [...fillEvents, ...lossEvents, ...defEvents].sort(
    (a, b) => new Date(b.at) - new Date(a.at),
  );
}

const matchesChip = (ev, chip) => {
  switch (chip) {
    case 'needs-review':
      return (
        ev.kind === 'loss' ||
        ev.kind === 'def' ||
        ev.billFlag ||
        ev.confirmationStatus === 'ESTIMATED'
      );
    case 'def':
      return ev.kind === 'def';
    case 'bill':
      return !!ev.billFlag;
    case 'loss':
      return ev.kind === 'loss';
    default:
      return true;
  }
};

export function eventMatchesFilters(
  ev,
  { eventType = 'all', statusFilter = 'all', chip = 'all' } = {},
) {
  if (eventType !== 'all' && ev.kind !== eventType) return false;
  if (statusFilter !== 'all') {
    if (ev.kind !== 'fill' || ev.confirmationStatus !== statusFilter) return false;
  }
  return matchesChip(ev, chip);
}

// Chart buckets (IST daily) for the fleet-wide activity chart.
export function buildChartData(fills, windows) {
  const buckets = {};
  const b = (ts) => {
    const k = formatInIST(ts, 'DD MMM');
    if (!k) return null;
    if (!buckets[k]) {
      buckets[k] = { day: k, volume: 0, loss: 0, events: 0, def: 0, _t: new Date(ts).getTime() };
    }
    return buckets[k];
  };
  fills.forEach((f) => {
    const x = b(f.at);
    if (x) {
      x.volume += f.litres || 0;
      x.events += 1;
    }
  });
  windows.forEach((w) => {
    if (isReviewLoss(w)) {
      const x = b(w.windowTo);
      if (x) {
        x.loss += Math.max(0, reviewLossL(w) ?? 0);
        x.events += 1;
      }
    }
    if (w.defRatioFlag) {
      const x = b(w.windowTo);
      if (x) x.def += 1;
    }
  });
  return Object.values(buckets)
    .sort((a, z) => a._t - z._t)
    .map((x) => ({
      ...x,
      volume: Math.round(x.volume * 10) / 10,
      loss: Math.round(x.loss * 10) / 10,
    }));
}

// Daily fills vs reviewable loss, for one vehicle's drill-down.
export function buildDrillChartData(fills, windows, vehicle) {
  const buckets = {};
  const bucketFor = (ts) => {
    const k = formatInIST(ts, 'DD MMM');
    if (!k) return null;
    if (!buckets[k]) buckets[k] = { day: k, fills: 0, loss: 0 };
    return buckets[k];
  };
  fills
    .filter((f) => f.registrationNumber === vehicle)
    .forEach((f) => {
      const x = bucketFor(f.at);
      if (x) x.fills += f.litres || 0;
    });
  windows
    .filter((w) => w.registrationNumber === vehicle)
    .forEach((w) => {
      if (!isReviewLoss(w)) return;
      const x = bucketFor(w.windowTo);
      if (x) x.loss += Math.max(0, reviewLossL(w) ?? 0);
    });
  return Object.values(buckets).map((x) => ({
    ...x,
    fills: Math.round(x.fills * 10) / 10,
    loss: Math.round(x.loss * 10) / 10,
  }));
}

// Anomaly breakdown — most affected vehicles.
export function buildAffected(vehicles) {
  const list = (vehicles || [])
    .map((v) => ({
      reg: v.registrationNumber,
      anomalies: (v.defFlagCount || 0) + (v.billFlagCount || 0),
      def: v.defFlagCount || 0,
      bill: v.billFlagCount || 0,
    }))
    .filter((v) => v.anomalies > 0)
    .sort((a, z) => z.anomalies - a.anomalies)
    .slice(0, 5);
  const max = list[0]?.anomalies || 1;
  return { list, max };
}

// Vehicle risk table (sorted highest risk first).
export function buildRiskVehicles(vehicles) {
  return (vehicles || [])
    .map((v) => ({ ...v, risk: computeRisk(v) }))
    .sort(
      (a, z) =>
        RISK_RANK[z.risk] - RISK_RANK[a.risk] || (z.defFlagCount || 0) - (a.defFlagCount || 0),
    );
}

export function buildChipDefs(events) {
  return [
    { key: 'all', label: 'All', count: events.length },
    {
      key: 'needs-review',
      label: 'Needs review',
      count: events.filter(
        (e) =>
          e.kind === 'loss' ||
          e.kind === 'def' ||
          e.billFlag ||
          e.confirmationStatus === 'ESTIMATED',
      ).length,
    },
    { key: 'def', label: 'DEF flags', count: events.filter((e) => e.kind === 'def').length },
    { key: 'bill', label: 'Bill mismatch', count: events.filter((e) => e.billFlag).length },
    {
      key: 'loss',
      label: 'Fuel loss to review',
      count: events.filter((e) => e.kind === 'loss').length,
    },
  ];
}

// Fleet integrity status banner — severity derived from the fuel that went
// down while parked first, then bill mismatches.
export function buildBanner(lossL, billCount, pricePerL) {
  if (lossL == null) {
    return {
      state: 'warn',
      title: 'Fuel integrity — not measured yet',
      msg: 'We could not measure whether any fuel went down while parked in this period.',
    };
  }
  if (lossL > 0) {
    return {
      state: 'warn',
      title: 'Fuel integrity — needs review',
      msg: `${formatLitres(lossL)} of fuel went down while parked (≈${formatINR(lossL * pricePerL)}). Review the windows below before you act — a sensor, a missed fill or a parked truck with the engine off can look the same.`,
    };
  }
  if (billCount > 0) {
    return {
      state: 'warn',
      title: 'Fuel integrity — needs attention',
      msg: `${billCount} bill mismatch${billCount === 1 ? '' : 'es'} require review.`,
    };
  }
  return {
    state: 'ok',
    title: 'Fuel integrity healthy',
    msg: 'Every litre in the selected period is explained by the driving.',
  };
}

// Clean long dealer/pump names into concise, human-readable station names
export function cleanStationName(raw) {
  if (!raw) return { displayName: 'Unknown Station', brand: '', location: '' };
  const str = String(raw).trim();
  let brand = '';
  if (/reliance|bp\s*mobility/i.test(str)) brand = 'Reliance BP';
  else if (/indian\s*oil|iocl/i.test(str)) brand = 'Indian Oil';
  else if (/bharat\s*petroleum|bpcl/i.test(str)) brand = 'BPCL';
  else if (/hindustan\s*petroleum|hpcl/i.test(str)) brand = 'HPCL';
  else if (/nayara/i.test(str)) brand = 'Nayara';
  else if (/shell/i.test(str)) brand = 'Shell';

  let name = str;
  const dealerMatch = str.match(/dealer of ([^,]+)/i);
  if (dealerMatch) {
    name = dealerMatch[1].trim();
  } else {
    const parts = str.split(/[,-]/);
    name = parts[0].replace(/^M\/s\.?\s+/i, '').trim();
  }

  const locMatch = str.match(
    /(NH\s*[-]?\s*\d+|[A-Z0-9\s]+(?:RICE MILL|BYPASS|CROSSING|DIST|ROAD|STATION|HIGHWAY))/i,
  );
  const location = locMatch ? locMatch[0].trim() : str.split(',')[1]?.trim() || '';

  return {
    displayName:
      brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} · ${name}` : name,
    brand,
    location,
    raw: str,
  };
}
