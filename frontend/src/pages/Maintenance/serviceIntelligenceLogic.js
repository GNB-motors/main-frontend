/**
 * Pure logic and classifications for Service Intelligence (Priority, Criticality, Status & KPIs).
 * Deterministic and testable (rule 21).
 */

export const PRIORITY_LEVELS = {
  CRITICAL: {
    code: 'P0',
    key: 'CRITICAL',
    label: 'P0 Critical',
    subLabel: 'Vehicle Grounded / Safety Hazard',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fca5a5',
    dot: '#dc2626',
    rank: 0,
  },
  HIGH: {
    code: 'P1',
    key: 'HIGH',
    label: 'P1 High',
    subLabel: 'Severe Mechanical Fault',
    color: '#ea580c',
    bg: '#fff7ed',
    border: '#fdba74',
    dot: '#f97316',
    rank: 1,
  },
  MEDIUM: {
    code: 'P2',
    key: 'MEDIUM',
    label: 'P2 Medium',
    subLabel: 'Operational / Roadside Fix',
    color: '#d97706',
    bg: '#fefce8',
    border: '#fde047',
    dot: '#eab308',
    rank: 2,
  },
  LOW: {
    code: 'P3',
    key: 'LOW',
    label: 'P3 Routine',
    subLabel: 'Routine Maintenance',
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#86efac',
    dot: '#22c55e',
    rank: 3,
  },
};

// Regex patterns to detect issue criticality
const CRITICAL_REGEX =
  /\b(axle|broken axle|axle shaft|engine failure|engine overheat|engine seized|brake fail|brake failure|air brake|steering fail|steering jam|gearbox jammed|gearbox breakdown|transmission fail|transmission breakdown|chassis crack|differential|accident|fire|wheel bearing jam)\b/i;
const HIGH_REGEX =
  /\b(clutch|clutch plate|clutch slipping|radiator|coolant leak|coolant boil|suspension|leaf spring|alternator|starter motor|fuel pump|injector|propeller shaft|turbo|turbocharger|hub seal)\b/i;
const MEDIUM_REGEX =
  /\b(tyre|tire|puncture|flat tyre|tyre burst|battery|battery weak|headlight|fuse|wiring|ac|air filter|fan belt|horn|exhaust|silencer|minor leak|wiper motor)\b/i;

/**
 * Classify a maintenance or repair record into a priority category.
 * Considers explicit priority if present, then parses type and notes text.
 */
export function classifyIssuePriority(record) {
  if (!record) return PRIORITY_LEVELS.LOW;

  // 1. Explicit priority stored on record
  if (record.priority) {
    const p = String(record.priority).toUpperCase();
    if (p === 'CRITICAL' || p === 'P0') return PRIORITY_LEVELS.CRITICAL;
    if (p === 'HIGH' || p === 'P1') return PRIORITY_LEVELS.HIGH;
    if (p === 'MEDIUM' || p === 'P2') return PRIORITY_LEVELS.MEDIUM;
    if (p === 'LOW' || p === 'P3') return PRIORITY_LEVELS.LOW;
  }

  // 2. Parse text content from type, notes, and workshop
  const text = `${record.type || ''} ${record.notes || ''}`.trim();

  if (CRITICAL_REGEX.test(text)) {
    return PRIORITY_LEVELS.CRITICAL;
  }

  if (HIGH_REGEX.test(text)) {
    return PRIORITY_LEVELS.HIGH;
  }

  if (MEDIUM_REGEX.test(text)) {
    return PRIORITY_LEVELS.MEDIUM;
  }

  // 3. For SERVICE records with routine wording, default to LOW.
  // For REPAIR records without matched critical keywords, if cost > ₹10,000 treat as HIGH, else MEDIUM.
  if (record.recordType === 'REPAIR') {
    if (record.amount >= 15000) return PRIORITY_LEVELS.HIGH;
    if (record.amount >= 3000) return PRIORITY_LEVELS.MEDIUM;
    return PRIORITY_LEVELS.LOW;
  }

  return PRIORITY_LEVELS.LOW;
}

/**
 * Determine if an issue / repair record has been marked as resolved.
 */
export function isRecordResolved(record) {
  if (!record) return false;
  if (record.resolved === true) return true;
  if (record.status === 'RESOLVED' || record.status === 'COMPLETED') return true;
  const notes = String(record.notes || '');
  return /\[RESOLVED/i.test(notes) || /✓\s*RESOLVED/i.test(notes);
}

/**
 * Extract clean resolution notes and timestamp from a resolved record.
 */
export function getResolutionDetails(record) {
  if (!isRecordResolved(record)) return null;
  const notes = String(record.notes || '');
  const match = notes.match(/\[RESOLVED:?\s*([^\]]*)\]/i);
  return {
    resolutionNote: match
      ? match[1].trim()
      : record.resolutionNote || 'Marked as resolved by fleet manager',
    resolvedAt: record.resolvedAt || record.updatedAt || record.date,
  };
}

/**
 * Format currency in Indian format (₹45,000)
 */
export function formatCurrencyINR(amount) {
  if (amount == null || Number.isNaN(Number(amount))) return '₹0';
  return `₹${Math.round(Number(amount)).toLocaleString('en-IN')}`;
}
