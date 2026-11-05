/**
 * The rules of the Intelligence page, with no React and no network.
 *
 * The period, the grouping of issues, the buckets of report cards and the km
 * split of a trip are all decided here. Keeping them out of the components
 * means each rule can be tested on its own, and a component only draws what
 * the model decided — it never invents a number or a reason.
 */
import { toISTDateString } from '@/utils/dateUtils';
import { formatIst } from '@/utils/redesign/format';

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** The periods the owner can pick. `from`/`to` in the URL carry the choice. */
export const PERIOD_PRESETS = [
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'month', label: 'This month' },
  { id: 'custom', label: 'Custom' },
];

/**
 * The kinds of open issue, grouped by what they are about.
 *
 * The groups are the filter chips of the Issues tab. They are a presentation
 * choice, not a judgement: the tone and the advice of every issue come from
 * the API.
 */
export const ISSUE_GROUPS = [
  {
    id: 'gps',
    label: 'GPS',
    kinds: ['GPS_FROZEN', 'GPS_JUMPS', 'GPS_SILENT_MIDROAD'],
    info: {
      text: 'We compare each truck with your other trucks on the same road. If others keep reporting where this one goes silent or freezes, the problem is likely this truck’s GPS unit.',
    },
  },
  {
    id: 'fuel_sensor',
    label: 'Fuel sensor',
    kinds: ['FUEL_SENSOR_NOISY', 'FUEL_SENSOR_CALIBRATION'],
  },
  { id: 'def_sensor', label: 'DEF sensor', kinds: ['DEF_SENSOR'] },
  { id: 'account', label: 'Account', kinds: ['ACCOUNT_DISCONNECTED', 'ACCOUNT_EXPIRING'] },
  { id: 'engine_lamp', label: 'Engine lamps', kinds: ['WARNING_LAMP'] },
  { id: 'battery_coolant', label: 'Battery & coolant', kinds: ['BATTERY', 'COOLANT'] },
  { id: 'service', label: 'Service due', kinds: ['SERVICE_DUE'] },
  { id: 'no_data', label: 'No data', kinds: ['NO_DATA'] },
];

/**
 * The columns of the report-card tabs.
 *
 * A FAIR card is not good and not slipping, so it gets its own column — and
 * that column only appears when there is a card to put in it.
 */
export const REPORT_CARD_BUCKETS = [
  { id: 'excellent', label: 'Excellent', grades: ['EXCELLENT'], tone: 'good' },
  { id: 'good', label: 'Good', grades: ['GOOD'], tone: 'info' },
  { id: 'fair', label: 'Fair', grades: ['FAIR'], tone: 'info' },
  { id: 'falling', label: 'Falling off', grades: ['FALLING'], tone: 'watch' },
  { id: 'ungraded', label: 'Insufficient data', grades: ['NOT_ENOUGH_DATA'], tone: 'info' },
];

/** The honest empty sentence for each kind of instance (spec F4.7). */
export const INSTANCE_EMPTY_COPY = {
  idle: 'No long idling in this period.',
  overspeed: 'No truck went over the limit for long in this period.',
  detour: 'No detours: every run stayed on its usual road.',
  fuel_unexplained: 'Every litre is explained by driving in this period.',
  cruise: 'Not enough highway driving to judge cruise.',
  gear: 'Gear data is only available for trucks that report it (Ashok Leyland iALERT).',
};

/** Calendar arithmetic on a YYYY-MM-DD, in UTC so no timezone can shift the day. */
export function shiftYmd(ymd, days = 0) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function isYmd(value) {
  if (typeof value !== 'string' || !YMD.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDay(ymd, withYear) {
  const [y, m, d] = ymd.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`;
}

/** "27 Oct – 2 Nov", with the year when the range leaves this year. */
export function periodRangeLabel(from, to, now = new Date()) {
  if (!isYmd(from) || !isYmd(to)) return '';
  if (from === to) return shortDay(from, true);
  const thisYear = toISTDateString(now) ?? '';
  const showYear = from.slice(0, 4) !== to.slice(0, 4) || to.slice(0, 4) !== thisYear.slice(0, 4);
  return `${shortDay(from, showYear)} – ${shortDay(to, showYear)}`;
}

/** The window a preset covers, in IST calendar days ending today. */
function presetWindow(presetId, today) {
  if (presetId === '30d') return { from: shiftYmd(today, -29), to: today };
  if (presetId === 'month') return { from: `${today.slice(0, 7)}-01`, to: today };
  if (presetId === '7d') return { from: shiftYmd(today, -6), to: today };
  return null;
}

/**
 * The period of the page, read from the URL.
 *
 * The URL only ever carries `from` and `to` (contract §0: a date-only `from`
 * is IST midnight, a date-only `to` is the end of that IST day). Which
 * preset is on is worked out from those two dates, so a shared link and the
 * Back button both land on the same days.
 */
export function resolvePeriod(params = {}, now = new Date()) {
  const today = toISTDateString(now) ?? toISTDateString(new Date());
  const from = params.from;
  const to = params.to;

  if (isYmd(from) && isYmd(to) && from <= to) {
    const preset = PERIOD_PRESETS.find((p) => {
      const window = presetWindow(p.id, today);
      return window && window.from === from && window.to === to;
    });
    return {
      preset: preset ? preset.id : 'custom',
      from,
      to,
      label: preset ? preset.label : periodRangeLabel(from, to, now),
    };
  }

  const fallback = presetWindow('7d', today);
  return { preset: '7d', from: fallback.from, to: fallback.to, label: 'Last 7 days' };
}

/** The dates of a preset, for the URL. */
export function periodDates(presetId, now = new Date()) {
  const today = toISTDateString(now) ?? toISTDateString(new Date());
  const window = presetWindow(presetId, today);
  return window ?? { from: today, to: today };
}

/** The account kinds: an account problem affects many trucks at once. */
export function isAccountIssue(issue) {
  return ISSUE_GROUPS.find((group) => group.id === 'account')?.kinds.includes(issue?.kind) ?? false;
}

const TONE_ORDER = { act: 0, watch: 1, info: 2, good: 3 };

/**
 * The issues of the period, in the order the owner should read them:
 * an account that stopped sending data first (it takes many trucks down with
 * it), then by tone, then by when it was last seen.
 */
export function sortIssues(items = []) {
  return [...items].sort((a, b) => {
    const account = Number(isAccountIssue(b)) - Number(isAccountIssue(a));
    if (account !== 0) return account;
    const tone = (TONE_ORDER[a?.severity] ?? 9) - (TONE_ORDER[b?.severity] ?? 9);
    if (tone !== 0) return tone;
    return String(b?.lastSeenAt ?? '').localeCompare(String(a?.lastSeenAt ?? ''));
  });
}

/** The first number-and-words a pattern finds in an issue's detail, or null. */
function fromDetail(issue, pattern) {
  const match = String(issue?.detail ?? '').match(pattern);
  return match ? match[1].trim() : null;
}

function minutesText(value) {
  const min = Number(value);
  if (!Number.isFinite(min)) return null;
  const total = Math.max(0, Math.round(min));
  const days = Math.floor(total / 1440);
  const hours = Math.floor((total % 1440) / 60);
  const mins = total % 60;
  if (days > 0) return hours > 0 ? `${days} d ${hours} h` : `${days} d`;
  if (hours > 0) return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
  return `${mins} min`;
}

const times = (issue) =>
  Number.isFinite(Number(issue?.occurrences)) ? String(issue.occurrences) : null;

/**
 * How each kind of issue reads as one group.
 *
 * `label` names the group ("No data · 8 trucks"). `columns` are the
 * kind-specific numbers of its table: they are read from the issue's own
 * fields first and from the words of its detail second, and a column that
 * cannot be read shows a dash — the full detail is always one click away
 * in the row. A kind not listed here still groups, with the detail as its
 * only column.
 */
export const ISSUE_KIND_META = {
  ACCOUNT_DISCONNECTED: { label: 'Account stopped sending data', noun: 'account' },
  ACCOUNT_EXPIRING: { label: 'Account link expiring', noun: 'account' },
  NO_DATA: {
    label: 'No data',
    // The issue is re-checked every night, so its last sighting is the last
    // check, not the last reading.
    lastLabel: 'Last checked',
    columns: [
      {
        key: 'silent',
        label: 'Silent for',
        numeric: true,
        read: (issue) => fromDetail(issue, /No reading for ([^,.;—]+)/i),
      },
    ],
    // The longest-silent truck first.
    order: (a, b) => String(a?.firstSeenAt ?? '').localeCompare(String(b?.firstSeenAt ?? '')),
  },
  GPS_FROZEN: {
    label: 'GPS freezes',
    columns: [
      { key: 'times', label: 'Freezes', numeric: true, read: times },
      {
        key: 'speed',
        label: 'Speed while frozen',
        numeric: true,
        read: (issue) => {
          const v = fromDetail(issue, /up to (\d+(?:\.\d+)?) ?km\/h/i);
          return v ? `${v} km/h` : null;
        },
      },
    ],
  },
  GPS_JUMPS: {
    label: 'GPS jumps',
    columns: [
      { key: 'times', label: 'Jumps', numeric: true, read: times },
      {
        key: 'fastest',
        label: 'Fastest implied',
        numeric: true,
        read: (issue) => {
          const v = fromDetail(issue, /fastest implied (\d+(?:\.\d+)?) ?km\/h/i);
          return v ? `${Number(v).toLocaleString('en-IN')} km/h` : null;
        },
      },
    ],
  },
  GPS_SILENT_MIDROAD: {
    label: 'Tracker silent on the road',
    columns: [
      { key: 'times', label: 'Gaps', numeric: true, read: times },
      {
        key: 'silent',
        label: 'Silent for',
        numeric: true,
        read: (issue) => minutesText(fromDetail(issue, /silent for (\d+(?:\.\d+)?) ?min/i)),
      },
    ],
  },
  WARNING_LAMP: {
    label: 'Warning lamp stayed on',
    columns: [
      {
        key: 'lamp',
        label: 'Lamp',
        read: (issue) => {
          const v = fromDetail(issue, /The (.+?) lamp/i);
          return v ? v.charAt(0).toUpperCase() + v.slice(1) : null;
        },
      },
      {
        key: 'on',
        label: 'On for',
        numeric: true,
        read: (issue) => minutesText(fromDetail(issue, /over (\d+(?:\.\d+)?) ?min/i)),
      },
      { key: 'times', label: 'Readings', numeric: true, read: times },
    ],
  },
  DEF_SENSOR: { label: 'DEF gauge stuck' },
  FUEL_SENSOR_NOISY: { label: 'Fuel sensor reads noisy' },
  FUEL_SENSOR_CALIBRATION: { label: 'Fuel sensor needs calibration' },
  BATTERY: { label: 'Battery' },
  COOLANT: { label: 'Coolant' },
  SERVICE_DUE: { label: 'Service due' },
};

/** The number of days in a "4 days" / "27 days" phrase, for a range line. */
function daysIn(text) {
  const match = String(text ?? '').match(/^(\d+)\s*day/i);
  return match ? Number(match[1]) : null;
}

/**
 * The open issues as one group per kind, in the order the owner should read
 * them: what needs the owner first, an account problem before a truck
 * problem, then the biggest group.
 *
 * The advice of a kind is the same sentence for every truck, so a group
 * carries it once. When the trucks of a group were given different advice,
 * the group says so and every row keeps its own.
 */
export function groupIssuesByKind(items = []) {
  const byKind = new Map();
  items.forEach((issue) => {
    const kind = issue?.kind ?? 'OTHER';
    if (!byKind.has(kind)) byKind.set(kind, []);
    byKind.get(kind).push(issue);
  });

  const groups = [...byKind.entries()].map(([kind, list]) => {
    const meta = ISSUE_KIND_META[kind] ?? {};
    const sorted = meta.order ? [...list].sort(meta.order) : sortIssues(list);
    const severity = sorted.reduce(
      (worst, issue) =>
        (TONE_ORDER[issue?.severity] ?? 9) < (TONE_ORDER[worst] ?? 9) ? issue.severity : worst,
      sorted[0]?.severity ?? 'info',
    );
    const advices = new Set(sorted.map((issue) => issue?.advice).filter(Boolean));
    const subjects = new Set(
      sorted.map((issue) => issue?.registrationNumber || issue?.accountName || issue?.id),
    );
    const noun = meta.noun ?? 'truck';
    const days = sorted.map((issue) => daysIn(meta.columns?.[0]?.read?.(issue)));
    const knownDays = days.filter((d) => d !== null);
    let range = null;
    if (kind === 'NO_DATA' && knownDays.length) {
      const min = Math.min(...knownDays);
      const max = Math.max(...knownDays);
      range = min === max ? `silent for ${min} days` : `silent for ${min}–${max} days`;
    }
    return {
      kind,
      label: meta.label ?? sorted[0]?.title ?? kind,
      columns: meta.columns ?? null,
      firstLabel: meta.firstLabel ?? null,
      lastLabel: meta.lastLabel ?? null,
      severity,
      mixedSeverity: new Set(sorted.map((issue) => issue?.severity)).size > 1,
      items: sorted,
      count: subjects.size,
      countLabel: `${subjects.size} ${noun}${subjects.size === 1 ? '' : 's'}`,
      range,
      advice: advices.size === 1 ? [...advices][0] : null,
      action: sorted[0]?.action ?? null,
      sharedAction:
        sorted.length > 0 &&
        sorted.every(
          (issue) =>
            issue?.action?.kind === sorted[0]?.action?.kind &&
            (issue?.action?.to ?? null) === (sorted[0]?.action?.to ?? null),
        ),
      isAccount: isAccountIssue(sorted[0]),
    };
  });

  return groups.sort((a, b) => {
    const tone = (TONE_ORDER[a.severity] ?? 9) - (TONE_ORDER[b.severity] ?? 9);
    if (tone !== 0) return tone;
    const account = Number(b.isAccount) - Number(a.isAccount);
    if (account !== 0) return account;
    return b.items.length - a.items.length || a.label.localeCompare(b.label);
  });
}

/**
 * "2026-10-27 → 2026-11-03" becomes "27 Oct → 3 Nov": a raw calendar date
 * inside an API sentence is read as a date, never shown as a code.
 */
export function humanizeDates(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/\b(\d{4})-(\d{2})-(\d{2})(T[\d:.]+(?:Z|[+-]\d{2}:?\d{2})?)?/g, (whole, y, m, d, time) => {
    if (time) return formatIst(whole, { withDate: true });
    const month = MONTHS[Number(m) - 1];
    if (!month) return whole;
    return `${Number(d)} ${month}`;
  });
}

/**
 * "FUEL_PUMP" → "Fuel pump". An unknown category is no category at all:
 * nothing is printed rather than the word "UNKNOWN".
 */
export function placeCategoryLabel(category) {
  if (!category || typeof category !== 'string') return null;
  if (/^(unknown|other|none)$/i.test(category)) return null;
  const words = category.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : null;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_MS = 330 * 60 * 1000;

function istDayKey(value) {
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? null : Math.floor((t + IST_MS) / DAY_MS);
}

function isIstMidnight(value) {
  const t = new Date(value).getTime();
  return !Number.isNaN(t) && (t + IST_MS) % DAY_MS === 0;
}

function istStamp(value) {
  return isIstMidnight(value) ? formatIst(value, { withDate: true }).split(',')[0] : formatIst(value, { withDate: true });
}

/**
 * When a moment happened, as a window when it has an end:
 * "29 Oct, 6:10 am – 6:35 am" on one day, "28 Oct → 4 Nov, 5:41 pm" across
 * days. A window that starts at IST midnight is a day, not "12:00 am".
 */
export function whenText(startAt, endAt = null) {
  if (!startAt) return '—';
  const start = istStamp(startAt);
  if (!endAt) return start;
  const startDay = istDayKey(startAt);
  const endDay = istDayKey(endAt);
  if (startDay !== null && startDay === endDay && !isIstMidnight(startAt)) {
    return `${start} – ${formatIst(endAt, { withDate: false })}`;
  }
  return `${start} → ${istStamp(endAt)}`;
}

/**
 * True when every sentence says the same thing with only its numbers
 * changed ("87.0 L left the tank…", "104.8 L left the tank…"): such a
 * column repeats one sentence N times and is better said once.
 */
export function isTemplatedText(texts = []) {
  const shapes = new Set(
    texts.filter(Boolean).map((text) => String(text).replace(/[\d.,]+/g, '#')),
  );
  return texts.length > 1 && shapes.size === 1;
}

/** The issues of one group, in reading order. */
export function issuesInGroup(items = [], groupId) {
  const group = ISSUE_GROUPS.find((entry) => entry.id === groupId);
  if (!group) return [];
  return sortIssues(items.filter((issue) => group.kinds.includes(issue?.kind)));
}

/** The issues a filter chip asks for. */
export function issuesWithFilter(items = [], filter = 'all') {
  if (filter === 'act') return sortIssues(items.filter((issue) => issue?.severity === 'act'));
  if (filter === 'watch') return sortIssues(items.filter((issue) => issue?.severity === 'watch'));
  if (filter === 'all') return sortIssues(items);
  return issuesInGroup(items, filter);
}

/** The count each filter chip shows. */
export function issueCounts(items = []) {
  const counts = { all: items.length, act: 0, watch: 0, groups: {} };
  ISSUE_GROUPS.forEach((group) => {
    counts.groups[group.id] = 0;
  });
  items.forEach((issue) => {
    if (issue?.severity === 'act') counts.act += 1;
    if (issue?.severity === 'watch') counts.watch += 1;
    const group = ISSUE_GROUPS.find((entry) => entry.kinds.includes(issue?.kind));
    if (group) counts.groups[group.id] += 1;
  });
  return counts;
}

/** The report cards of each column, and the cards that fell out of a filter. */
export function bucketReportCards(items = [], { query = '', grade = 'all', make = 'all' } = {}) {
  const needle = String(query ?? '')
    .trim()
    .toLowerCase();
  const filtered = items.filter((card) => {
    if (grade !== 'all' && card?.grade !== grade) return false;
    if (make !== 'all' && String(card?.make ?? '') !== make) return false;
    if (!needle) return true;
    const haystack = [card?.name, card?.id, card?.make, card?.headline]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(needle);
  });

  const buckets = REPORT_CARD_BUCKETS.map((bucket) => ({
    ...bucket,
    cards: filtered.filter((card) => bucket.grades.includes(card?.grade)),
  }));
  return { buckets, total: filtered.length };
}

/** The makes in the cards, for the make filter. */
export function reportCardMakes(items = []) {
  const makes = new Set();
  items.forEach((card) => {
    if (card?.make) makes.add(String(card.make));
  });
  return [...makes].sort();
}

/**
 * The drivers of the active assignments, for the driver filter.
 *
 * The assignment carries the driver either as a bare id or as a small object.
 * When there is no name to show, the id is shown: a made-up name would be a
 * claim nobody can check.
 */
export function driverOptions(assignments = []) {
  const byId = new Map();
  assignments.forEach((assignment) => {
    const ref = assignment?.driverId;
    const id = typeof ref === 'string' ? ref : ref?._id;
    if (!id || byId.has(id)) return;
    const first = typeof ref === 'object' ? ref?.firstName : null;
    const last = typeof ref === 'object' ? ref?.lastName : null;
    const name = [first, last].filter(Boolean).join(' ').trim();
    byId.set(id, { id, name: name || String(id) });
  });
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** A Mongo id, not a name. */
export const OBJECT_ID = /^[0-9a-f]{24}$/i;

/**
 * The drivers list as a map of id → name.
 *
 * The list is the one place a driver's real name lives; the report cards
 * sometimes carry the id instead.
 */
export function driverNameMap(drivers = []) {
  const byId = new Map();
  drivers.forEach((driver) => {
    const id = driver?._id ?? driver?.id;
    if (!id) return;
    const name =
      [driver?.firstName, driver?.lastName].filter(Boolean).join(' ').trim() ||
      String(driver?.name ?? '').trim();
    if (name) byId.set(String(id), name);
  });
  return byId;
}

/**
 * The name of the driver a card is about.
 *
 * A card that carries an id instead of a name is looked up in the drivers
 * list. A driver who is not in that list is "Unnamed driver" — never a bare
 * id, which is not a name anyone can read.
 */
export function resolveDriverName(card, driversById, { ready = true } = {}) {
  const raw = String(card?.name ?? '').trim();
  const id = String(card?.id ?? '').trim();
  const isId = !raw || raw === id || OBJECT_ID.test(raw);
  if (!isId) return raw;
  const known = driversById?.get(id) || driversById?.get(raw);
  if (known) return known;
  return ready ? 'Unnamed driver' : '—';
}

/**
 * A basis line that leaks an internal model name ("DriverVehicleAssignment
 * intervals") is not something the owner can act on, so it is not shown.
 */
export function isInternalBasis(text) {
  if (!text) return false;
  return /[a-z][A-Z][A-Za-z]{6,}/.test(String(text));
}

/** The IST midnight of a YYYY-MM-DD, as an instant. */
export function istDayStart(ymd) {
  return new Date(`${ymd}T00:00:00+05:30`);
}

/** The last moment of the IST day of a YYYY-MM-DD. */
export function istDayEnd(ymd) {
  return new Date(`${ymd}T23:59:59.999+05:30`);
}

/**
 * What a trip was, from the leg the API sends.
 *
 * A run from one plant straight to another is a normal run: plants work like
 * warehouses, so it is never counted as empty.
 */
export function classifyTrip(trip) {
  const leg = String(trip?.leg ?? '').toUpperCase();
  if (leg === 'REPOSITION') return 'reposition';
  if (leg === 'LADEN') return 'loaded';
  if (leg === 'RETURN') return 'empty';
  const flags = Array.isArray(trip?.flags) ? trip.flags : [];
  if (flags.includes('PICKUP_TO_PICKUP')) return 'reposition';
  if (trip?.drop) return 'loaded';
  return 'empty';
}

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

/**
 * The km of one trip, split by leg.
 *
 * `km.laden` is the trip out (plant → customer, or plant → plant for a
 * reposition) and `km.return` is the way back to the plant, which is empty
 * running whenever it happens.
 */
export function tripKmParts(trip) {
  const km = trip?.km ?? {};
  const laden = num(km.laden);
  const back = num(km.return);
  const kind = classifyTrip(trip);
  if (kind === 'reposition') return { loadedKm: 0, emptyKm: back, repositionKm: laden };
  if (kind === 'empty') return { loadedKm: 0, emptyKm: back, repositionKm: 0 };
  return { loadedKm: laden, emptyKm: back, repositionKm: 0 };
}

/**
 * The per-truck km of the period: the top trucks by distance, each split into
 * loaded, empty and plant-to-plant km.
 */
export function runBarsByTruck(trips = [], { limit = 20 } = {}) {
  const byTruck = new Map();
  trips.forEach((trip) => {
    const registration = trip?.registrationNumber;
    if (!registration) return;
    const parts = tripKmParts(trip);
    const row = byTruck.get(registration) ?? {
      registrationNumber: registration,
      loadedKm: 0,
      emptyKm: 0,
      repositionKm: 0,
      totalKm: 0,
    };
    row.loadedKm += parts.loadedKm;
    row.emptyKm += parts.emptyKm;
    row.repositionKm += parts.repositionKm;
    row.totalKm += parts.loadedKm + parts.emptyKm + parts.repositionKm;
    byTruck.set(registration, row);
  });

  return [...byTruck.values()]
    .sort(
      (a, b) => b.totalKm - a.totalKm || a.registrationNumber.localeCompare(b.registrationNumber),
    )
    .slice(0, limit);
}

/**
 * The busiest places: how many visits each place had, how many trucks came,
 * and how long they usually stay.
 *
 * The visit counts are the API's own; the trucks and the usual time are
 * worked out from the visits that were loaded, so they are only as complete
 * as that page of history.
 */
export function summarisePlacesByPlace(countsByPlace = [], items = []) {
  const visits = new Map();
  items.forEach((item) => {
    const place = item?.place;
    if (!place?.id && !place?.name) return;
    const key = place.id || place.name;
    const row = visits.get(key) ?? { trucks: new Set(), dwells: [] };
    if (item?.registrationNumber) row.trucks.add(item.registrationNumber);
    if (Number.isFinite(Number(item?.dwellMin))) row.dwells.push(Number(item.dwellMin));
    visits.set(key, row);
  });

  return countsByPlace.map((entry) => {
    const place = entry?.place;
    const key = place?.id || place?.name;
    const row = visits.get(key);
    const dwells = (row?.dwells ?? []).slice().sort((a, b) => a - b);
    const middle = dwells.length ? dwells[Math.floor(dwells.length / 2)] : null;
    return {
      place,
      visits: entry?.visits ?? 0,
      trucks: row?.trucks?.size ?? null,
      usualMin: middle,
    };
  });
}
