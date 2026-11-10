/**
 * The chart maths for the driver predictions. Pure, so it can be reasoned
 * about (and tested) without a browser: dates become offsets from the first
 * day in the batch, which is what turns a list of periods into a timeline.
 */
const DAY = 86400000;

export function parseDate(value) {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isNaN(time) ? null : time;
}

/** One group per truck, in the order the trucks first appear. */
export function groupByTruck(periods = []) {
  const groups = new Map();
  periods.forEach((period) => {
    const key = String(period.vehicleId || period.plate || 'unassigned');
    if (!groups.has(key)) {
      groups.set(key, {
        vehicleId: period.vehicleId || '',
        plate: period.plate || 'Unassigned truck',
        rows: [],
      });
    }
    groups.get(key).rows.push(period);
  });
  return [...groups.values()];
}

/**
 * Offsets from the first day of the batch, so every truck's chart can share
 * one x-axis. A period that is still running runs to the last day seen.
 */
export function buildTimeline(periods = []) {
  const starts = periods.map((period) => parseDate(period.from)).filter(Boolean);
  const ends = periods.map((period) => parseDate(period.to)).filter(Boolean);
  const base = starts.length ? Math.min(...starts) : Date.now();
  const last = ends.length ? Math.max(...ends) : base;
  const span = Math.max(1, Math.round((last - base) / DAY));

  const rows = periods.map((period) => {
    const start = parseDate(period.from) ?? base;
    const end = parseDate(period.to) ?? last;
    const offset = Math.max(0, Math.round((start - base) / DAY));
    const duration = Math.max(1, Math.round((end - start) / DAY));
    return {
      periodId: period.periodId,
      label: `${period.driverName || 'Driver'}${period.phone ? ` · ${period.phone}` : ''}`,
      driverName: period.driverName || 'Driver',
      phone: period.phone || '',
      plate: period.plate || '',
      from: period.from || '',
      to: period.to || '',
      photoCount: period.photoCount ?? 0,
      status: period.status || 'predicted',
      warnings: Array.isArray(period.warnings) ? period.warnings : [],
      offset,
      duration: Math.min(duration, Math.max(1, span - offset)),
    };
  });

  return { base, span, rows };
}

/** A short date for the axis and the tooltip. */
export function formatDay(base, day) {
  return new Date(base + Math.round(day) * DAY).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}
