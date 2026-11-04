/**
 * The owner's daily report — the pure part.
 *
 * Every section resolves to exactly one of ok | empty | error, and the reader
 * can always tell which. `empty` means the query ran and found nothing: it is
 * never a zero. A number the server did not measure is "—" with the reason
 * beside it.
 *
 * Nothing here prints a developer code: every key the eight sections can
 * return has a label, every money amount is written the way an owner reads it,
 * and every timestamp is a date a person can read.
 */

/** What an unknown reads as. Never a zero. */
export const DASH = '—';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const IST = 'Asia/Kolkata';

/** The reason a section is empty, in one line. */
export function sectionReason(section) {
  const notes = Array.isArray(section?.notes) ? section.notes.filter(Boolean) : [];
  if (notes.length) return notes.join(' · ');
  if (section?.error) return String(section.error);
  return 'The query ran and found nothing for this day.';
}

/** The state of a section, defaulting to the honest one (empty). */
export function sectionState(section) {
  const state = section?.state;
  return state === 'ok' || state === 'empty' || state === 'error' ? state : 'empty';
}

/** The section's title, falling back to its id. */
export function sectionTitle(section) {
  return section?.title || section?.id || 'Section';
}

/** The "how we know" footer the server writes for every section. */
export function sectionFooter(section) {
  return section?.footer?.text || '';
}

/** "dieselBillInr" → "diesel bill inr". */
export function humanKey(key) {
  return String(key || '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
}

/** "diesel bill inr" → "Diesel bill inr". */
function sentenceCase(text) {
  const s = String(text || '').trim();
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Every label the eight sections can print. A key that is not here still gets
 * a readable label (camelCase → sentence case), but the map is the contract:
 * a key in here is never shown raw.
 */
export const METRIC_LABELS = {
  // 1. Fleet now
  moving: 'Moving',
  atPlant: 'At plant',
  parked: 'Parked',
  engineOnIdleVerified: 'Engine on, idle verified',
  engineStateUnknown: 'Engine state unknown',
  dark: 'Dark (no signal)',
  // 2. Yesterday's work / Today so far
  trips: 'Trips',
  km: 'Distance covered',
  onTimeArrivals: 'On-time arrivals',
  promisedArrivals: 'Promised arrivals',
  avgTurnaroundHours: 'Average turnaround',
  plantsMeasured: 'Plants measured',
  // 3. Money out
  dieselBillLitres: 'Diesel billed (litres)',
  dieselBillInr: 'Diesel billed',
  dieselSensorLitres: 'Diesel from sensor (litres)',
  dieselGapPct: 'Diesel gap',
  tollInr: 'Tolls',
  tollUnknownCount: 'Tolls, count unknown',
  tollCount: 'Toll crossings',
  expensePendingCount: 'Expenses waiting',
  expensePendingInr: 'Expenses waiting',
  expenseApprovedCount: 'Expenses approved',
  expenseApprovedInr: 'Expenses approved',
  expenseRejectedCount: 'Expenses rejected',
  advanceCount: 'Advances',
  advanceInr: 'Advances',
  // 4. Money in
  freightInr: 'Freight',
  freightTripCount: 'Freight trips',
  freightUnknownCount: 'Freight rows, count unknown',
  costPerKm: 'Cost per km',
  marginPerTrip: 'Margin per trip',
  // 5. People
  driversOnDuty: 'Drivers on duty',
  atWheelHours: 'Hours at the wheel',
  restCompliant: 'Rest compliant',
  scoreChanges: 'Score changes',
  topByImprovement: 'Best improvement',
  bottomByImprovement: 'Biggest drop',
  // 6. Exceptions
  total: 'Total exceptions',
  // 7. Trend
  tripsPrev7Avg: 'Trips, last 7-day average',
  kmPrev7Avg: 'km, last 7-day average',
  tripsVsPrev7Pct: 'Trips vs last 7-day average',
  kmVsPrev7Pct: 'km vs last 7-day average',
  tripsSameWeekdayAvg: 'Trips, same weekday average',
  kmSameWeekdayAvg: 'km, same weekday average',
  daysWithData: 'Days with data',
  // 8. Data health
  trucks: 'Trucks',
  trucksNoData: 'Trucks with no data',
  trucksDark: 'Trucks dark',
  vendorFeeds: 'Vendor feeds',
  vendorFeedsFailing: 'Vendor feeds failing',
  kmWithAppNavigation: 'km with app navigation',
  // The exception kinds
  sos: 'SOS',
  moneyTheft: 'Possible fuel theft',
  idling: 'Idling',
  stuckAtPlant: 'Stuck at a plant',
  etaSlipping: 'ETA slipping',
  papersWaiting: 'Papers waiting',
  documentsExpiring: 'Documents expiring',
  broadcastNotAcknowledged: 'Broadcasts not acknowledged',
  // The row labels
  registrationNumber: 'Registration',
  minutes: 'Minutes',
  engineState: 'Engine state',
  verdict: 'Verdict',
  billedL: 'Billed (L)',
  burnedL: 'Burned (L)',
  corridor: 'Corridor',
  extraKm: 'Extra km',
  status: 'Status',
  docType: 'Document',
  expiryDate: 'Expires',
  condition: 'Condition',
  subject: 'Subject',
  severity: 'Severity',
  type: 'Type',
  incidentNumber: 'Incident',
  at: 'When',
  stationaryMinutes: 'Stationary (min)',
  consecutiveFailedPulls: 'Failed pulls',
  lastFailureReason: 'Last failure',
  failingFeeds: 'Failing feeds',
};

/** The label of a key: the map first, then a readable fallback. */
export function labelFor(key) {
  const k = String(key || '');
  if (!k) return '';
  if (METRIC_LABELS[k]) return METRIC_LABELS[k];
  return sentenceCase(humanKey(k));
}

/** Codes a person should never read raw. */
const CODE_LABELS = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
  SOS: 'SOS',
  OPEN: 'Open',
  RESOLVED: 'Resolved',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETE: 'Complete',
  CONFIRMED: 'Confirmed',
  ACTIVE: 'Active',
  PARKED: 'Parked',
  IDLE: 'Idle',
  MOVING: 'Moving',
  OFFLINE: 'Offline',
  UNKNOWN: 'Unknown',
  ENGINE_ON: 'Engine on',
  ENGINE_OFF: 'Engine off',
  THEFT_SUSPECTED: 'Theft suspected',
  UNRECONCILED: 'Unreconciled',
  UNEXPLAINED_GAIN: 'Unexplained gain',
};

/** "THEFT_SUSPECTED" → "Theft suspected". A plate number is left alone. */
export function humanCode(value) {
  const s = String(value ?? '');
  if (!s) return s;
  if (CODE_LABELS[s]) return CODE_LABELS[s];
  if (/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(s)) return sentenceCase(humanKey(s));
  return s;
}

/** ₹17,635.8 → ₹17,636 (no paise once the amount is ₹100 or more). */
export function formatMoney(value) {
  if (value == null || value === '') return DASH;
  const n = Number(value);
  if (!Number.isFinite(n)) return DASH;
  if (Math.abs(n) >= 100) return `₹${Math.round(n).toLocaleString('en-IN')}`;
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** A date a person can read: "4 Nov, 06:19" (today's year) or "4 Nov 2025". */
export function formatMoment(value, { withTime = true } = {}) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value ?? '');
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST,
    day: 'numeric',
    month: 'short',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  const year = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: IST, year: 'numeric' }).format(date),
  );
  const currentYear = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: IST, year: 'numeric' }).format(new Date()),
  );
  const day = `${get('day')} ${get('month')}`;
  const stamp = year === currentYear ? day : `${day} ${year}`;
  return withTime ? `${stamp}, ${get('hour')}:${get('minute')}` : stamp;
}

/** "2026-11-04" → "4 Nov" (or "4 Nov 2025" for another year). */
export function formatDayLabel(day) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(day || ''));
  if (!m) return String(day || '');
  const year = Number(m[1]);
  const month = MONTHS[Number(m[2]) - 1] || m[2];
  const currentYear = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: IST, year: 'numeric' }).format(new Date()),
  );
  return year === currentYear ? `${Number(m[3])} ${month}` : `${Number(m[3])} ${month} ${year}`;
}

/** Today, in the fleet's own timezone. */
export function isToday(day) {
  if (!day) return false;
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return String(day) === today;
}

/** One measured value, written the way the page writes every other number. */
export function formatValue(key, value) {
  if (value == null) return DASH;
  if (Array.isArray(value)) {
    if (!value.length) return DASH;
    return value
      .map((item) =>
        item && typeof item === 'object'
          ? Object.values(item)
              .filter((v) => v != null && typeof v !== 'object')
              .join(' ')
          : String(item),
      )
      .join(', ');
  }
  if (value instanceof Date) {
    return formatMoment(value, { withTime: String(key || '') !== 'expiryDate' });
  }
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return formatMoment(value);
  }
  if (typeof value !== 'number') return humanCode(value);
  const k = String(key || '');
  if (k.endsWith('Inr')) return formatMoney(value);
  if (k.endsWith('Pct')) {
    const one = Math.round(value * 10) / 10;
    return `${one > 0 ? '+' : ''}${one.toFixed(1)}%`;
  }
  if (k.endsWith('Km')) return `${value} km`;
  if (KM_KEYS.has(k)) return `${value.toLocaleString('en-IN')} km`;
  if (k.endsWith('Minutes') || k.endsWith('Min')) return `${value} min`;
  if (k.endsWith('Hours')) return `${value} h`;
  if (k.endsWith('Litres') || k.endsWith('L')) return `${Math.round(value * 10) / 10} L`;
  return value.toLocaleString('en-IN');
}

/** The keys whose value is a distance. */
const KM_KEYS = new Set(['km', 'kmPrev7Avg', 'kmSameWeekdayAvg', 'kmWithAppNavigation']);

/** The percentage values that only mean something once the day is over. */
const PENDING_PCT_KEYS = new Set(['tripsVsPrev7Pct', 'kmVsPrev7Pct']);

/** The numbers of one section, ready to render. */
export function numberPairs(numbers, { isPendingDay = false } = {}) {
  if (!numbers || typeof numbers !== 'object') return [];
  return Object.entries(numbers)
    .filter(([key]) => key !== 'kinds')
    .map(([key, value]) => {
      const pending = isPendingDay && PENDING_PCT_KEYS.has(key);
      return {
        key,
        label: labelFor(key),
        value: pending ? DASH : formatValue(key, value),
        note: pending ? 'Day not over yet' : '',
        unknown: pending || value == null,
      };
    });
}

const LABEL_KEYS = [
  'label',
  'name',
  'kind',
  'registrationNumber',
  'title',
  'subject',
  'condition',
  'docType',
  'type',
];

/** The rows of one section, flattened to label + note pairs. */
export function rowPairs(rows) {
  if (!rows) return [];
  if (Array.isArray(rows)) {
    return rows
      .slice(0, 8)
      .filter((row) => !(row && typeof row === 'object' && 'drill' in row))
      .map((row, i) => {
        if (!row || typeof row !== 'object') return { key: `row-${i}`, label: String(row), note: '' };
        const entries = Object.entries(row).filter(
          ([k, v]) => v != null && typeof v !== 'object' && k !== 'drill' && k !== 'params',
        );
        const labelEntry =
          entries.find(([k]) => LABEL_KEYS.includes(k)) || entries[0] || ['label', ''];
        const note = entries
          .filter(([k]) => k !== labelEntry[0])
          .map(([k, v]) => `${labelFor(k)}: ${formatValue(k, v)}`)
          .join(' · ');
        return {
          key: `${labelEntry[0]}-${i}`,
          label: formatValue(labelEntry[0], labelEntry[1]),
          note,
        };
      });
  }
  if (typeof rows === 'object') {
    if (rows.drill) return [];
    return Object.entries(rows)
      .slice(0, 8)
      .map(([key, value]) => ({
        key,
        label: labelFor(key),
        note: Array.isArray(value) ? `${value.length} row(s)` : formatValue(key, value),
      }));
  }
  return [];
}

/** The exception kinds worth showing: counted, not "not built yet", biggest first. */
export function exceptionRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .filter((row) => Number.isFinite(Number(row.count)) && Number(row.count) > 0)
    .filter((row) => String(row.note || '').trim().toLowerCase() !== 'not built yet')
    .sort((a, b) => Number(b.count) - Number(a.count))
    .map((row) => ({
      key: row.kind || 'exception',
      label: labelFor(row.kind),
      count: Number(row.count),
      note: '',
    }));
}

/** The drill a section points at, if it has one. */
export function drillTarget(section) {
  const rows = section?.rows;
  if (!rows || typeof rows !== 'object' || Array.isArray(rows)) return null;
  return typeof rows.drill === 'string' && rows.drill ? rows.drill : null;
}

/** Where a drill target goes. An unknown target has no link. */
export function drillRoute(drill) {
  const target = String(drill || '').trim().toLowerCase();
  if (!target) return null;
  const root = target.split('.')[0];
  if (root === 'fleet') return '/live-tracking';
  if (root === 'autotrip') return '/auto-trips';
  if (root === 'trend') return '/intelligence';
  if (root === 'exceptions' || root === 'alert' || root === 'alerts') return '/alert-inbox';
  if (root === 'money' || root === 'fuel') return '/mileage';
  return null;
}

/** The "how we know" text, with its timestamps written for a person. */
export function formatFooterText(text) {
  if (!text) return '';
  return String(text)
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?/g, (m) => formatMoment(m))
    .replace(/^\s*How we know:\s*/i, '')
    .trim();
}

/** The morning brief's sections, ready to render. */
export function briefSections(brief) {
  const sections = Array.isArray(brief?.sections) ? brief.sections : [];
  return sections.map((section) => ({
    key: section?.key || 'section',
    label: section?.label || labelFor(section?.key || 'section'),
    status: section?.status === 'empty' ? 'empty' : 'ok',
    rupees: section?.rupees == null ? null : Number(section.rupees),
    suggestedAction: section?.suggestedAction || '',
    vehicles: Array.isArray(section?.vehicles)
      ? section.vehicles.map((v) => ({
          registrationNumber: v?.registrationNumber || '—',
          rupees: v?.rupees == null ? null : Number(v.rupees),
          durationMin: v?.durationMin == null ? null : Number(v.durationMin),
          excessL: v?.excessL == null ? null : Number(v.excessL),
        })).sort((a, b) => (b.rupees ?? -1) - (a.rupees ?? -1))
      : [],
  }));
}
