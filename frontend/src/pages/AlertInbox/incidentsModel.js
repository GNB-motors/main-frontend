/**
 * The incident board — the pure part.
 *
 * An incident moves OPEN → ACKNOWLEDGED → MECHANIC_ASSIGNED → RESOLVED, and
 * each step is something a person did. The board never guesses a severity:
 * the incident service does not assign one, so an incident without one is
 * "unspecified", not "info" and never "low".
 */

export const INCIDENT_STATUSES = ['OPEN', 'ACKNOWLEDGED', 'MECHANIC_ASSIGNED', 'RESOLVED'];

export const STATUS_LABEL = {
  OPEN: 'Open',
  ACKNOWLEDGED: 'Acknowledged',
  MECHANIC_ASSIGNED: 'Mechanic assigned',
  RESOLVED: 'Resolved',
};

export const TYPE_LABEL = {
  BREAKDOWN: 'Breakdown',
  ACCIDENT: 'Accident',
  MEDICAL: 'Medical',
  THEFT: 'Theft',
};

/** The severity a row carries, or '' when the row carries none. */
export function incidentSeverity(row) {
  const raw = row?.severity;
  if (typeof raw === 'string' && raw.trim()) return raw.trim().toLowerCase();
  return '';
}

/** The distinct severities actually present in these rows. */
export function severityOptions(rows) {
  const set = new Set((rows || []).map(incidentSeverity).filter(Boolean));
  return [...set].sort();
}

/** Filter the board by status and severity. */
export function filterIncidents(rows, { status = '', severity = '' } = {}) {
  return (rows || []).filter((row) => {
    if (status && row?.status !== status) return false;
    if (!severity) return true;
    const severityOfRow = incidentSeverity(row);
    if (severity === 'unspecified') return !severityOfRow;
    return severityOfRow === severity;
  });
}

/** An incident closed in silence cannot be reviewed. The note is required. */
export function resolutionNoteError(note) {
  const text = String(note ?? '').trim();
  if (text.length < 2) {
    return 'Say what happened — an incident closed in silence cannot be reviewed.';
  }
  return null;
}

/** A person must be named before an incident can be assigned. */
export function assignmentNameError(name) {
  const text = String(name ?? '').trim();
  if (text.length < 2) return 'Who is going to the truck?';
  return null;
}

/** The confirm step before every open alert is marked as seen. */
export function ackAllConfirmText(openCount) {
  const n = Number.isFinite(openCount) ? openCount : 0;
  return `Mark all ${n} open alert${n === 1 ? '' : 's'} as seen?`;
}

/** "12 Mar, 4:30 PM" — null when the stamp is missing or unusable. */
export function incidentTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}
