import { formatINR, formatLitres } from '../../utils/formatters';
import { toIST } from './fiDates';

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

// Merged events feed: fills + siphon-suspected losses + DEF-flag windows,
// newest first.
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
    smoothedJumpL: f.smoothedJumpL,
    odometer: f.odometer,
    claimedLitres: f.claimedLitres,
  }));
  const lossEvents = windows
    .filter((w) => w.siphonSuspected)
    .map((w) => ({
      id: `loss-${w._id}`,
      kind: 'loss',
      vehicle: w.registrationNumber,
      litres: w.unaccountedLossL,
      inr: w.unaccountedLossL != null ? Math.max(0, w.unaccountedLossL) * pricePerL : null,
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
    const k = toIST(ts)?.format('DD MMM');
    if (!k) return null;
    if (!buckets[k]) {
      buckets[k] = { day: k, volume: 0, loss: 0, events: 0, def: 0, _t: toIST(ts).valueOf() };
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
    if (w.siphonSuspected) {
      const x = b(w.windowTo);
      if (x) {
        x.loss += Math.max(0, w.unaccountedLossL || 0);
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

// Daily fills vs suspected losses for one vehicle's drill-down.
export function buildDrillChartData(fills, windows, vehicle) {
  const buckets = {};
  const bucketFor = (ts) => {
    const k = toIST(ts)?.format('DD MMM');
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
      if (!w.siphonSuspected) return;
      const x = bucketFor(w.windowTo);
      if (x) x.loss += Math.max(0, w.unaccountedLossL || 0);
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
      label: 'Unexplained loss',
      count: events.filter((e) => e.kind === 'loss').length,
    },
  ];
}

// Fleet integrity status banner — severity derived from unexplained loss first,
// then bill mismatches.
export function buildBanner(lossL, billCount, pricePerL) {
  if (lossL > 0) {
    return {
      state: 'crit',
      title: 'Fuel integrity — critical',
      msg: `${formatLitres(lossL)} unexplained loss (~${formatINR(lossL * pricePerL)}) — investigate now.`,
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
    msg: 'No unexplained fuel loss detected in the selected period.',
  };
}
