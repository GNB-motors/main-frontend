/**
 * Pure helpers for the corridor time-of-day heatmap — no React, no fetching.
 *
 * Sequential ramp: the dataviz skill's validated default blue scale
 * (references/palette.md, steps 100->700), light->dark = faster->slower.
 * Reused verbatim rather than inventing new hex values.
 */
export const SEQUENTIAL_RAMP = [
  '#cde2fb', // 100
  '#9ec5f4', // 200
  '#6da7ec', // 300
  '#3987e5', // 400
  '#256abf', // 500
  '#184f95', // 600
  '#0d366b', // 700
];

export const NO_DATA_COLOR = '#eef0f2';
export const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOW_FULL_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** Index buckets by "hour_dow" for O(1) lookup while rendering the grid. */
export function indexBuckets(buckets) {
  const byKey = new Map();
  for (const b of buckets || []) {
    byKey.set(`${b.hour}_${b.dow}`, b);
  }
  return byKey;
}

/**
 * Map a p50Min value to a ramp color, normalized against this corridor's own
 * min/max — a 20-min corridor and a 6-hour corridor each get their own
 * light->dark range, so the pattern within one corridor stays legible instead
 * of being flattened by a shared cross-corridor scale.
 */
export function colorForValue(value, min, max) {
  if (value == null) return NO_DATA_COLOR;
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return SEQUENTIAL_RAMP[Math.floor(SEQUENTIAL_RAMP.length / 2)];
  }
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const idx = Math.min(SEQUENTIAL_RAMP.length - 1, Math.floor(t * SEQUENTIAL_RAMP.length));
  return SEQUENTIAL_RAMP[idx];
}

/** Confidence fades a thin bucket out rather than presenting it at full strength. */
export function opacityForSamples(samples) {
  if (!samples) return 1;
  if (samples >= 5) return 1;
  if (samples >= 2) return 0.7;
  return 0.45;
}

/** min/max p50Min across the populated buckets, or null if none have a value. */
export function p50Range(buckets) {
  const values = (buckets || []).map((b) => b.p50Min).filter((v) => v != null);
  if (!values.length) return { min: null, max: null };
  return { min: Math.min(...values), max: Math.max(...values) };
}

/** Format minutes into human-readable e.g. "2h 30m" or "45m". */
export function formatMinutes(minutes) {
  if (minutes == null || !Number.isFinite(minutes)) return '—';
  const m = Math.round(minutes);
  const hours = Math.floor(m / 60);
  const rem = m % 60;
  if (hours === 0) return `${rem}m`;
  if (rem === 0) return `${hours}h`;
  return `${hours}h ${rem}m`;
}

/** Format an hour (0..23) into 12-hour format e.g. "12 AM", "4 PM", "11 PM". */
export function formatHour12(h) {
  const hour = ((h % 24) + 24) % 24;
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

/** Format an hour into 24-hour timestamp e.g. "04:00" */
export function formatHour24(h) {
  const hour = ((h % 24) + 24) % 24;
  return `${String(hour).padStart(2, '0')}:00`;
}

/**
 * Convert UTC (hour, dow) to IST (Indian Standard Time: UTC + 5:30).
 * Since UTC hours represent intervals [H:00, H+59], their midpoint H:30
 * maps to (H + 6):00 IST. This establishes a clean 1-to-1 bijection.
 */
export function utcToIst(utcHour, utcDOW) {
  const nextDay = utcHour + 6 >= 24;
  const istHour = (utcHour + 6) % 24;
  const istDOW = nextDay ? (utcDOW + 1) % 7 : utcDOW;
  return { istHour, istDOW };
}

/**
 * Convert IST (hour, dow) back to UTC (hour, dow).
 */
export function istToUtc(istHour, istDOW) {
  const prevDay = istHour - 6 < 0;
  const utcHour = (istHour - 6 + 24) % 24;
  const utcDow = prevDay ? (istDOW - 1 + 7) % 7 : istDOW;
  return { utcHour, utcDow };
}

/**
 * Derive operational intelligence from the full corridor time profile:
 * - Optimal departure window (saves time, avoids traffic)
 * - Peak congestion window (high delay risk)
 * - Congestion penalty (+% and +min)
 * - Average planning buffer (p90 - p50)
 * - Total sample count
 * - Fastest and slowest days of the week
 */
export function computeCorridorInsights(buckets) {
  const valid = (buckets || []).filter((b) => Number.isFinite(b.p50Min) && b.p50Min > 0);
  if (valid.length === 0) {
    return {
      hasData: false,
      totalSamples: 0,
      minP50: null,
      maxP50: null,
      optimalWindow: null,
      peakWindow: null,
      delayDeltaMin: 0,
      delayDeltaPct: 0,
      avgBufferMin: 0,
      fastestDay: null,
      slowestDay: null,
    };
  }

  let totalSamples = 0;
  let sumBuffer = 0;
  let bufferCount = 0;

  for (const b of valid) {
    totalSamples += b.samples || 0;
    if (Number.isFinite(b.p90Min) && b.p90Min >= b.p50Min) {
      sumBuffer += b.p90Min - b.p50Min;
      bufferCount += 1;
    }
  }

  const { min: minP50, max: maxP50 } = p50Range(valid);
  const delayDeltaMin = Math.round(maxP50 - minP50);
  const delayDeltaPct = minP50 > 0 ? Math.round((delayDeltaMin / minP50) * 100) : 0;
  const avgBufferMin = bufferCount > 0 ? Math.round(sumBuffer / bufferCount) : 0;

  // Average per hour across all days
  const hourTotals = Array.from({ length: 24 }, () => ({ sum: 0, count: 0, maxP90: 0 }));
  for (const b of valid) {
    hourTotals[b.hour].sum += b.p50Min;
    hourTotals[b.hour].count += 1;
    if (b.p90Min && b.p90Min > hourTotals[b.hour].maxP90) {
      hourTotals[b.hour].maxP90 = b.p90Min;
    }
  }

  const hourAvgs = hourTotals.map((h) => (h.count > 0 ? h.sum / h.count : null));

  // Find best 3-hour consecutive window
  let bestWindowStart = 0;
  let bestWindowAvg = Infinity;
  let worstWindowStart = 0;
  let worstWindowAvg = -Infinity;

  for (let start = 0; start < 24; start++) {
    const w = [start, (start + 1) % 24, (start + 2) % 24];
    const vals = w.map((h) => hourAvgs[h]).filter((v) => v != null);
    if (vals.length >= 2) {
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (avg < bestWindowAvg) {
        bestWindowAvg = avg;
        bestWindowStart = start;
      }
      if (avg > worstWindowAvg) {
        worstWindowAvg = avg;
        worstWindowStart = start;
      }
    }
  }

  const optimalWindow =
    bestWindowAvg < Infinity
      ? {
          startUtc: bestWindowStart,
          endUtc: (bestWindowStart + 3) % 24,
          avgDurationMin: Math.round(bestWindowAvg),
          savingsMin: Math.round(worstWindowAvg - bestWindowAvg),
        }
      : null;

  const peakWindow =
    worstWindowAvg > -Infinity
      ? {
          startUtc: worstWindowStart,
          endUtc: (worstWindowStart + 3) % 24,
          avgDurationMin: Math.round(worstWindowAvg),
          penaltyPct:
            bestWindowAvg > 0
              ? Math.round(((worstWindowAvg - bestWindowAvg) / bestWindowAvg) * 100)
              : 0,
        }
      : null;

  // Day of week averages
  const dowTotals = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));
  for (const b of valid) {
    dowTotals[b.dow].sum += b.p50Min;
    dowTotals[b.dow].count += 1;
  }
  const dowAvgs = dowTotals.map((d) => (d.count > 0 ? d.sum / d.count : null));
  let fastestDow = null;
  let slowestDow = null;
  let minDowVal = Infinity;
  let maxDowVal = -Infinity;

  for (let dow = 0; dow < 7; dow++) {
    if (dowAvgs[dow] != null) {
      if (dowAvgs[dow] < minDowVal) {
        minDowVal = dowAvgs[dow];
        fastestDow = dow;
      }
      if (dowAvgs[dow] > maxDowVal) {
        maxDowVal = dowAvgs[dow];
        slowestDow = dow;
      }
    }
  }

  return {
    hasData: true,
    totalSamples,
    minP50,
    maxP50,
    delayDeltaMin,
    delayDeltaPct,
    avgBufferMin,
    optimalWindow,
    peakWindow,
    fastestDay: fastestDow != null ? DOW_FULL_LABELS[fastestDow] : null,
    slowestDay: slowestDow != null ? DOW_FULL_LABELS[slowestDow] : null,
  };
}
