/**
 * Congestion on the Live map (00_PLAN.md item 5).
 *
 * Everything here is presentation over the payload of GET /api/road/congestion/org. Three rules are
 * enforced here rather than left to the component:
 *
 *  1. NO SPEED LEGEND. The map never says "below 20 km/h = jam". It says which roads are in the top slice
 *     of THEIR OWN road class, in their own region, at this hour, and it prints the quantile and the
 *     number of edges that boundary came from. That is what the backend learned; a legend that invented a
 *     speed threshold would misstate it.
 *  2. NO BLENDING. `ours.speedKmh` (our trucks) and `network.engineKmh` (the road engine's own figure for
 *     the same edge) are shown side by side. There is deliberately no combined colour derived from both.
 *  3. A GAP STAYS A GAP. Edges the backend refused to rate are not here to draw. `gapsOf` turns the counts
 *     the backend reports into words, so an empty map says WHY it is empty instead of just being empty.
 */
import { decodePolyline6 } from './polyline6';

/* Label colours. SLOWEST_SLICE is a RANK (the slowest (1 − q) of this org's roads of the same class, region
   and hour, which exists every hour by construction), so it is never called "congested". TYPICAL is
   deliberately quiet; LIVE is the R22 live probe layer, which only ever reaches trunk roads because of
   cadence, so it gets its own colour. */
export const SLOWEST_SLICE_COLOR = '#e11d48';
export const TYPICAL_COLOR = '#0ea5e9';
export const LIVE_COLOR = '#f59e0b';

export const GAP_TEXT = {
  NO_FREE_FLOW_EVIDENCE: 'not enough night driving to know this road’s own free-flow speed',
  NO_HOUR_EVIDENCE: 'nobody drove here at this hour, so there is no hour factor for it',
  NO_BAND: 'this road class has no learned boundary for this organisation yet',
  THIN_BIN: 'too few edges of this class to set a boundary they would all have to agree with',
};

/** "Mon 08:00 IST" from an IST hour-of-week (Monday 00:00 = 0). */
export function hourLabel(how) {
  if (!Number.isInteger(how) || how < 0 || how > 167) return 'this hour';
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const day = days[Math.floor(how / 24)];
  const hour = String(how % 24).padStart(2, '0');
  return `${day} ${hour}:00 IST`;
}

export function colorFor(row) {
  if (row?.layer === 'LIVE') return LIVE_COLOR;
  return row?.label === 'SLOWEST_SLICE' ? SLOWEST_SLICE_COLOR : TYPICAL_COLOR;
}

/** The sample behind the number, in the same sentence as the number. */
export function titleFor(row) {
  if (!row) return '';
  const bits = [];
  if (row.roadClass) bits.push(row.roadClass);
  if (Number.isFinite(row.ours?.speedKmh)) bits.push(`ours ${row.ours.speedKmh} km/h`);
  if (Number.isFinite(row.network?.engineKmh)) bits.push(`map ${row.network.engineKmh} km/h`);
  const head = bits.join(' · ');
  const idx = Number.isFinite(row.index) ? `×${row.index} free flow` : null;
  const band = Number.isFinite(row.band)
    ? `boundary ×${row.band} from ${row.bandEdges} edges`
    : null;
  const sample = [];
  if (row.sample?.nightRows != null) sample.push(`${row.sample.nightRows} night rows`);
  if (row.sample?.hourRows != null) sample.push(`${row.sample.hourRows} hour observations`);
  if (row.sample?.crossings != null) sample.push(`${row.sample.crossings} crossings in window`);
  return [head, [idx, band].filter(Boolean).join(' · '), sample.join(', ')]
    .filter(Boolean)
    .join(' — ');
}

/** Drawable segments. An edge with no geometry is skipped, never drawn as a straight guess. */
export function segmentsFrom(rows = []) {
  return (Array.isArray(rows) ? rows : [])
    .filter((r) => r && r.geom)
    .map((r) => {
      const path = decodePolyline6(r.geom);
      if (path.length < 2) return null;
      const slowest = r.label === 'SLOWEST_SLICE';
      const live = r.layer === 'LIVE';
      return {
        key: r.edgeKey,
        path,
        title: titleFor(r),
        options: {
          strokeColor: colorFor(r),
          strokeOpacity: slowest ? 0.9 : 0.5,
          strokeWeight: slowest || live ? 5 : 3,
          zIndex: live ? 950 : slowest ? 900 : 500,
          title: titleFor(r),
        },
      };
    })
    .filter(Boolean);
}

/**
 * The legend, worded so nobody can read it as a speed rule. `coverage.band.quantile` and the edge count
 * behind the boundary are printed; without them the colours are decoration.
 */
export function legendOf(coverage) {
  if (!coverage?.band) return [];
  const q = coverage.band.quantile;
  const pct = Number.isFinite(q) ? Math.round((1 - q) * 100) : null;
  const how = hourLabel(coverage.how);
  const weeks = Array.isArray(coverage.band.weeks) ? coverage.band.weeks : [];
  const measured = coverage.band.measuredAt
    ? new Date(coverage.band.measuredAt).toLocaleDateString('en-IN')
    : null;
  // No measurement is not a licence to quote the quantile as if it meant something here.
  const learned = pct != null && coverage.band.binsMeasured > 0;
  const base = !learned
    ? 'boundary not measured for this hour yet — nothing below is a verdict'
    : `top ${pct}% of this road class in this region at ${how}` +
      (coverage.band.binsMeasured
        ? ` — learned from ${coverage.band.binsMeasured} class×hour bins`
        : '');
  const items = [
    {
      color: SLOWEST_SLICE_COLOR,
      label: pct != null ? `Slowest ${pct}% of your roads like this` : 'Slowest of your roads like this',
      detail: `a rank, not a jam: every hour some roads are in it. At or above the boundary our own trucks learned: ${base}`,
    },
    { color: TYPICAL_COLOR, label: 'Typical for a road like this', detail: 'below that boundary' },
  ];
  if (coverage.live) {
    items.push({
      color: LIVE_COLOR,
      label: 'Live — our crossings right now',
      detail:
        `${coverage.live.edgesLive} of the rows below cleared the probe gate ` +
        `(${coverage.live.gateP} coverage, ≥ ${coverage.live.minCrossings} crossings in ` +
        `${coverage.live.windowMin} min). Cadence limits this to trunk roads; the rest stay typical.`,
    });
  }
  const tail = [measured ? `measured ${measured}` : null, weeks.length ? `band week ${weeks[weeks.length - 1]}` : null]
    .filter(Boolean)
    .join(' · ');
  if (tail) items[items.length - 1].detail += ` · ${tail}`;
  return items;
}

/** What could NOT be rated, in words. Present whenever the map is thinner than the fleet's road list. */
export function gapsOf(coverage) {
  const gaps = coverage?.edges?.gaps;
  if (!gaps) return [];
  return Object.entries(gaps)
    .filter(([, count]) => count > 0)
    .map(([reason, count]) => ({
      reason,
      count,
      text: `${count} edge${count === 1 ? '' : 's'} ${GAP_TEXT[reason] || reason}`,
    }));
}

export function summaryOf(coverage, rows = []) {
  const e = coverage?.edges;
  if (!e) return '';
  const parts = [
    `${e.returned} of ${e.read} edge${e.read === 1 ? '' : 's'} rated`,
  ];
  if (coverage.band?.binsMeasured) {
    parts.push(`boundary learned ${coverage.band.binsMeasured} bin${coverage.band.binsMeasured === 1 ? '' : 's'}`);
  }
  if (coverage.store) {
    parts.push(`read from ${coverage.store === 'CLICKHOUSE' ? 'ClickHouse' : 'the org edge index'}`);
  }
  if (coverage.truncated) parts.push('read was TRUNCATED — this is a partial list');
  const gaps = gapsOf(coverage);
  if (gaps.length) parts.push(`${gaps.reduce((s, g) => s + g.count, 0)} not rated`);
  if (!rows.length && !e.read) parts.push('no road-matched edges for this organisation yet');
  return parts.join(' · ');
}

/** The few rows a reader should see as numbers, worst first. */
export function topEdges(rows = [], n = 5) {
  return (Array.isArray(rows) ? rows : []).slice(0, Math.max(0, n));
}