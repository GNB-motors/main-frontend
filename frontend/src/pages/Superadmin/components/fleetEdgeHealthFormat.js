/**
 * Pure formatting/mapping helpers for the FleetEdge health audit page.
 * Kept out of the component so they can be unit-tested (see the .test.js).
 */

/** Human "how long ago" from an age in seconds. Null/NaN → em dash. */
export function formatAge(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return '—';
  if (seconds < 60) return `${Math.floor(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    const rem = mins % 60;
    return rem ? `${hrs} hr ${rem} min` : `${hrs} hr`;
  }
  return `${Math.floor(hrs / 24)} d`;
}

const CONNECTION = {
  CONNECTED: { tone: 'ok', text: 'Connected' },
  DUE: { tone: 'caution', text: 'Refreshing' },
  NEEDS_REAUTH: { tone: 'critical', text: 'Re-auth needed' },
  NOT_LINKED: { tone: 'inert', text: 'Not linked' },
};

/** Connection/token status → { tone, text } for a status chip. */
export function connectionChip(status) {
  return CONNECTION[status] || { tone: 'inert', text: status || '—' };
}

const FLOW = {
  FLOWING: { tone: 'ok', text: 'Flowing' },
  STALE: { tone: 'caution', text: 'Stale' },
  NO_DATA: { tone: 'critical', text: 'No data' },
};

/** Backend data-flow status → { tone, text } for a status chip. */
export function flowChip(status) {
  return FLOW[status] || { tone: 'inert', text: status || '—' };
}
