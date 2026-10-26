/**
 * usageModel — the presentation logic for the Screen Usage page, kept out of
 * the component so it can be tested (frontend convention: pure logic lives in a
 * *.js beside the component).
 *
 * Two rules run through everything here:
 *  - no percentage of anything is derived from a self-learned boundary. The
 *    median surface is a description of this org's own behaviour, not an
 *    accuracy claim, so the page shows counts and the sentence the server wrote.
 *  - "who" is answered by ROLE counts. There is no per-person row to render,
 *    because there is no per-person row to fetch.
 */

export const DISPOSITION_COPY = Object.freeze({
  NEVER_OPENED: {
    label: 'Never opened',
    tone: 'folded',
    meaning: 'Not opened once since usage recording started.',
  },
  BELOW_ORG_FLOOR: {
    label: 'Below this org’s median',
    tone: 'folded',
    meaning: 'Opened, but less than this organization opens its median screen.',
  },
  AT_OR_ABOVE_FLOOR: {
    label: 'Used',
    tone: 'kept',
    meaning: 'At or above this organization’s own median surface.',
  },
  NOT_MEASURED: {
    label: 'Not measured',
    tone: 'neutral',
    meaning: 'Not enough of this organization’s own history to compare anything.',
  },
});

const SEVERITY_ORDER = { critical: 0, caution: 1, info: 2 };

/** Human label for a dashboard path. The path itself is the fallback, not a bare enum. */
export function pathLabel(path) {
  if (typeof path !== 'string' || !path) return 'Unknown screen';
  const trimmed = path.replace(/\/+$/, '') || '/';
  if (trimmed === '/') return 'Dashboard';
  const last = trimmed.split('/').filter(Boolean).pop();
  return last
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** One row per surface, most used first, never-opened last but never hidden. */
export function buildSurfaceRows(surfaces = []) {
  const order = { NEVER_OPENED: 0, BELOW_ORG_FLOOR: 1, NOT_MEASURED: 2, AT_OR_ABOVE_FLOOR: 3 };
  return [...surfaces]
    .map((s) => ({
      surfaceKey: s.surfaceKey,
      label: pathLabel(s.surfaceKey),
      disposition: s.disposition,
      dispositionCopy: DISPOSITION_COPY[s.disposition] || DISPOSITION_COPY.NOT_MEASURED,
      reason: s.reason || '',
      evidence: s.evidence || {},
      isFolded: order[s.disposition] <= 1,
    }))
    .sort((a, b) => {
      const d = order[a.disposition] - order[b.disposition];
      if (d !== 0) return d;
      return (b.evidence.views || 0) - (a.evidence.views || 0);
    });
}

/**
 * The headline counts. Deliberately NOT percentages: with a self-learned median
 * as the boundary, "72% of screens are unused" would read as a finding about the
 * product when it is only a finding about this org's own distribution.
 */
export function summarize(profile) {
  const rows = buildSurfaceRows(profile?.surfaces || []);
  const folded = rows.filter((r) => r.isFolded);
  const used = rows.filter((r) => r.disposition === 'AT_OR_ABOVE_FLOOR');
  return {
    state: profile?.state || 'INSUFFICIENT',
    window: profile?.window || { from: null, to: null },
    learned: profile?.learned || {},
    totalViews: profile?.learned?.totalViews || 0,
    userDays: profile?.learned?.userDays || 0,
    foldedCount: folded.length,
    usedCount: used.length,
    rows,
    folded,
  };
}

/** The sentence under the title: what this page can and cannot say yet. */
export function measurementNote(profile) {
  if (!profile || profile.state !== 'LEARNED') {
    return 'Not enough of your own history yet. Nothing is being hidden from the menu — as soon as there is enough to compare, this page will say what it folded and why.';
  }
  const floor = profile.learned?.engagementFloor;
  const window = profile.window || {};
  return `Every number below is your own, measured from ${window.from || 'the first day we recorded'} to ${window.to || 'today'}. A screen folds only when it sits below your own median of ${floor} opens, or has never been opened. Nothing is deleted: every folded screen keeps its page, its data and its link.`;
}

/** Daily series for a tiny bar row. Returns the last N days, oldest first. */
export function recentDays(daily = [], count = 14) {
  return daily.slice(-count).map((d) => ({
    day: d.day,
    views: d.views || 0,
    followOn: d.followOn || 0,
    userDays: d.userDays || 0,
  }));
}

/** Sort inbox-style: most urgent first. Shared by the inbox page. */
export function bySeverityThenRecency(a, b) {
  const sev = (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9);
  if (sev !== 0) return sev;
  return new Date(b.lastSeenAt || 0).getTime() - new Date(a.lastSeenAt || 0).getTime();
}
/** Calendar days through the last completed rollup; missing days have zero opens. */
export function calendarTrend(daily = [], endDay, count = 14) {
  if (!endDay || !/^\d{4}-\d{2}-\d{2}$/.test(endDay)) return [];
  const end = new Date(`${endDay}T00:00:00Z`);
  if (!Number.isFinite(end.getTime())) return [];
  const byDay = new Map(daily.map((day) => [day.day, day]));
  return Array.from({ length: count }, (_, index) => {
    const day = new Date(end.getTime() - (count - index - 1) * 86400000).toISOString().slice(0, 10);
    return { day, views: byDay.get(day)?.views || 0, followOn: byDay.get(day)?.followOn || 0 };
  });
}

export function navLabels(catalog = []) {
  return new Map(
    catalog
      .flatMap((item) => (item.type === 'group' ? item.children || [] : [item]))
      .filter((item) => item.to)
      .map((item) => [item.to, item.label]),
  );
}

export function visibleUsageRows(
  surfaces,
  labels,
  { query = '', disposition = '', sort = 'views' } = {},
) {
  const needle = query.trim().toLowerCase();
  return buildSurfaceRows(surfaces)
    .map((row) => ({
      ...row,
      label: labels.get(row.surfaceKey) || row.label,
      canOpen:
        labels.has(row.surfaceKey) &&
        row.surfaceKey.startsWith('/') &&
        !row.surfaceKey.startsWith('//'),
    }))
    .filter(
      (row) =>
        (!disposition || row.disposition === disposition) &&
        (!needle || `${row.label} ${row.surfaceKey}`.toLowerCase().includes(needle)),
    )
    .sort((a, b) =>
      sort === 'name'
        ? a.label.localeCompare(b.label)
        : sort === 'recent'
          ? new Date(b.evidence.lastViewedAt || 0) - new Date(a.evidence.lastViewedAt || 0)
          : (b.evidence.views || 0) - (a.evidence.views || 0) || a.label.localeCompare(b.label),
    );
}
