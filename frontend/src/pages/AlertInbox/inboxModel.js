/**
 * inboxModel — the alert inbox's presentation logic, kept beside the component
 * so it can be tested.
 *
 * The one rule this file has to hold: an inbox item without a `wants` sentence
 * is a bug, not a rendering problem. `assertEveryItemSaysWhatItWants` is used by
 * the page before it renders anything, so an empty ask can never reach a user.
 */

export const SEVERITY_COPY = Object.freeze({
  critical: { label: 'Needs someone now', rank: 0 },
  caution: { label: 'Needs a decision', rank: 1 },
  info: { label: 'Worth a look', rank: 2 },
});

/** The empty inbox is a real state and has to say what it means. */
export function emptyInboxCopy() {
  return {
    title: 'Nothing needs doing',
    hint: 'No open items in this inbox. Source feeds update periodically; continue to check urgent alerts in their dedicated pages.',
  };
}

/** Items grouped for reading — but every item is still its own row. */
export function groupByCondition(items = []) {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.condition)) {
      groups.set(item.condition, {
        condition: item.condition,
        label: item.label || item.condition,
        items: [],
      });
    }
    groups.get(item.condition).items.push(item);
  }
  return [...groups.values()].sort((a, b) => {
    const ra = SEVERITY_COPY[a.items[0]?.severity]?.rank ?? 9;
    const rb = SEVERITY_COPY[b.items[0]?.severity]?.rank ?? 9;
    if (ra !== rb) return ra - rb;
    return b.items.length - a.items.length;
  });
}

/**
 * Guard used by the page: every item states what it wants done.
 * Returns the offending items rather than throwing, so a caller can log and
 * still render the rest — a broken ask must not empty the inbox.
 */
export function assertEveryItemSaysWhatItWants(items = []) {
  return items.filter((item) => !item.wants || !String(item.wants).trim());
}

/** "reported by N modules" as a readable phrase, not a count alone. */
export function sourcesLine(item) {
  const names = [...new Set((item.sources || []).map((s) => s.source))];
  if (!names.length) return 'No source detail available.';
  if (names.length === 1) return `Reported by ${names[0]}.`;
  return `Reported by ${names.length} modules: ${names.join(', ')}.`;
}

/** Relative time without pulling in a date library, for the list subtitle. */
export function sinceLabel(iso) {
  if (!iso) return 'unknown';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'unknown';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return new Date(iso).toISOString().slice(0, 10);
}
export const SOURCE_LABELS = Object.freeze({
  ownerAlerts: 'Owner alerts',
  fleetAlerts: 'Fleet alerts',
  hotspotWatch: 'Fuel hotspots',
  supportTicket: 'Support',
});

// Only known internal destinations are used; API text never becomes a URL.
export function reviewTarget(item) {
  const ticket = item.sources?.find((s) => s.source === 'supportTicket' && s.refId);
  if (ticket) return { ticketId: ticket.refId, label: 'Open ticket' };
  if (item.condition === 'HOTSPOT_REVIEW') {
    const hotspot = item.sources?.find((s) => s.source === 'hotspotWatch' && s.refId);
    return {
      to: `/place-hub?tab=fuel${hotspot ? `&hotspot=${encodeURIComponent(hotspot.refId)}` : ''}`,
      label: 'Review hotspot',
    };
  }
  const vehicle =
    item.subjectKey && !item.subjectKey.includes(':') && item.subjectKey !== 'ORG'
      ? `?vehicle=${encodeURIComponent(item.subjectKey)}`
      : '';
  const owner = item.sources?.some((s) => s.source === 'ownerAlerts');
  return { to: `${owner ? '/owner-alerts' : '/fleet-alerts'}${vehicle}`, label: 'Review alert' };
}

export function filterInbox(
  items,
  { status = 'OPEN', query = '', severity = '', source = '' } = {},
) {
  const needle = query.trim().toLowerCase();
  return items.filter(
    (item) =>
      item.status === status &&
      (!severity || item.severity === severity) &&
      (!source || item.sources?.some((s) => s.source === source)) &&
      (!needle ||
        [item.subjectLabel, item.subjectKey, item.label, item.wants].some((value) =>
          String(value || '')
            .toLowerCase()
            .includes(needle),
        )),
  );
}
