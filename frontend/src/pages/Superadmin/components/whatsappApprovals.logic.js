/**
 * Pure derivation for the WhatsApp fuel-approval screens.
 *
 * Kept out of the components so the review rules — the part a reviewer trusts
 * — can be unit-tested without mounting a page or stubbing an API.
 *
 * Every rule reads only fields the drafts endpoint already returns. Nothing
 * here asks the backend for anything new.
 */

export const STATUS_META = {
  READY: { label: 'Ready', c: '#187A32', tint: 'rgba(37,186,76,.12)' },
  REVIEW: { label: 'Needs review', c: '#C56200', tint: 'rgba(240,170,72,.16)' },
  PUBLISHED: { label: 'Published', c: '#2F58EE', tint: 'rgba(47,88,238,.10)' },
  REJECTED: { label: 'Rejected', c: '#C2323A', tint: 'rgba(229,104,107,.14)' },
  CLEARED: { label: 'Cleared', c: '#5D5D5E', tint: 'rgba(93,93,94,.12)' },
};

export const TABS = [
  { key: 'READY', label: 'Pending' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CLEARED', label: 'Cleared' },
  { key: 'ALL', label: 'All' },
];

/* ── formatting ─────────────────────────────────────────────────────────── */

export const num2 = (n) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const km = (n) =>
  n == null || Number.isNaN(Number(n))
    ? '—'
    : Number(n).toLocaleString('en-IN', { maximumFractionDigits: 1 });

export const money = (n) => (n == null ? '—' : `₹${num2(n)}`);

export const dateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const shortDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

/* ── field access ───────────────────────────────────────────────────────── */

export const vehicleOf = (d) => d?.vehicleId?.registrationNumber || d?.vehicleReg || '—';

export const submitterOf = (d) =>
  [d?.userId?.firstName, d?.userId?.lastName].filter(Boolean).join(' ') || d?.phoneE164 || '—';

export const orgOf = (d) => d?.orgId?.companyName || '—';

export const confidenceOf = (d) => {
  const c = d?.fuelOcr?.data?.confidence;
  return typeof c === 'number' ? Math.round(c) : null;
};

/**
 * The odometer the photo itself reads, when a photo was processed.
 *
 * Separate from `odometerReading` on purpose: the stored value is what got
 * saved, this is what the picture says, and the whole point of the 10× check
 * below is that the two can disagree.
 */
export const photoOdometerOf = (d) => {
  const n = numOrNaN(d?.odometerOcr?.data?.reading);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Whole days between the bill and the moment it reached us. */
export const lagDaysOf = (d) => {
  if (!d?.billDatetime || !d?.createdAt) return null;
  const ms = new Date(d.createdAt).getTime() - new Date(d.billDatetime).getTime();
  return ms > 0 ? Math.floor(ms / 86400000) : 0;
};

/**
 * Number, but a missing value stays missing.
 *
 * `Number(null)` is 0 and `Number('')` is 0, so a bill with no rate would read
 * as a rate of zero and fail the maths check instead of reporting that it
 * cannot be checked. Every numeric read below goes through here.
 */
const numOrNaN = (v) => (v == null || v === '' ? NaN : Number(v));

const plateEq = (a, b) =>
  !!a &&
  !!b &&
  String(a)
    .replace(/[^A-Z0-9]/gi, '')
    .toUpperCase() ===
    String(b)
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase();

/* ── the checks ─────────────────────────────────────────────────────────── */

/**
 * Every rule a reviewer would run by eye, as data.
 *
 * `ok: null` means "cannot be judged" — the bill carried no rate, no plate, no
 * odometer photo. That is deliberately NOT a failure: a missing input is the
 * sender's gap, and counting it against the bill would flag most of the queue
 * and train reviewers to ignore the flags.
 *
 * `acked` is the reviewer's own session decision; it turns a warning into a
 * pass without pretending the underlying data changed.
 */
export function checkList(draft, acked = new Set()) {
  if (!draft) return [];
  const out = [];
  const litres = numOrNaN(draft.litres);
  const rate = numOrNaN(draft.rate);
  const amount = numOrNaN(draft.amount);

  // 1. Bill maths
  if (Number.isFinite(litres) && Number.isFinite(rate) && Number.isFinite(amount)) {
    const calc = Math.round(litres * rate * 100) / 100;
    const ok = Math.abs(calc - amount) < 1;
    out.push({
      id: 'math',
      ok,
      title: ok ? 'Bill maths adds up' : 'Bill maths does not add up',
      detail: `${num2(litres)} L × ₹${rate} = ₹${num2(calc)}, bill says ₹${num2(amount)}.`,
      value: ok ? 'Exact' : `₹${num2(Math.abs(calc - amount))} off`,
    });
  } else {
    out.push({
      id: 'math',
      ok: null,
      title: 'Bill maths not checked',
      detail: 'Litres, rate or amount is missing, so the total cannot be verified.',
      value: 'No data',
    });
  }

  // 2. Plate on the bill vs the vehicle the draft is attached to
  const veh = draft.vehicleId?.registrationNumber || draft.vehicleReg;
  if (draft.plateText && veh) {
    const ok = plateEq(draft.plateText, veh);
    out.push({
      id: 'plate',
      ok,
      title: ok ? 'Plate on bill matches vehicle' : 'Plate on bill does not match',
      detail: `Bill reads ${draft.plateText}; draft is filed against ${veh}.`,
      value: ok ? 'Match' : 'Mismatch',
    });
  } else {
    out.push({
      id: 'plate',
      ok: null,
      title: 'Plate not read from bill',
      detail: 'No plate text was extracted, so it cannot be matched to the vehicle.',
      value: 'No data',
    });
  }

  // 3. How clearly the photo was read
  const conf = confidenceOf(draft);
  if (conf == null) {
    out.push({
      id: 'conf',
      ok: null,
      title: 'No OCR confidence reported',
      detail: 'The extractor returned no confidence score for this bill.',
      value: 'No data',
    });
  } else {
    out.push({
      id: 'conf',
      ok: conf >= 90,
      title: conf >= 90 ? 'Photo read clearly' : 'Photo was hard to read',
      detail: `OCR confidence ${conf}% across the extracted fields.`,
      value: `${conf}%`,
    });
  }

  // 4. Odometer. The 10x trap: a dropped decimal turns 10,418.3 into 104,183.
  const stored = numOrNaN(draft.odometerReading);
  const photo = photoOdometerOf(draft);
  if (!Number.isFinite(stored)) {
    out.push({
      id: 'odo',
      ok: null,
      title: 'No odometer captured',
      detail: 'This bill was submitted without an odometer reading.',
      value: 'No data',
    });
  } else if (photo && Math.abs(stored / photo - 10) < 0.2) {
    out.push({
      id: 'odo',
      ok: acked.has('odo'),
      warn: true,
      ackable: true,
      title: 'Odometer reading looks 10× too high',
      detail: `Saved as ${km(stored)} km, but the photo reads ${km(photo)} km — the decimal point was likely dropped.`,
      value: acked.has('odo') ? 'Reviewed' : '10×',
    });
  } else if (photo && Math.abs(stored - photo) > 1) {
    out.push({
      id: 'odo',
      ok: acked.has('odo'),
      warn: true,
      ackable: true,
      title: 'Odometer does not match the photo',
      detail: `Saved as ${km(stored)} km; the photo reads ${km(photo)} km.`,
      value: acked.has('odo') ? 'Reviewed' : 'Differs',
    });
  } else {
    out.push({
      id: 'odo',
      ok: true,
      title: 'Odometer looks right',
      detail: `${km(stored)} km${draft.odometerSource ? ` · from ${String(draft.odometerSource).toLowerCase()}` : ''}.`,
      value: 'OK',
    });
  }

  // 5. How late the bill reached us
  const lag = lagDaysOf(draft);
  if (lag == null) {
    out.push({
      id: 'lag',
      ok: null,
      title: 'Submission delay not known',
      detail: 'The bill carries no date, so the delay cannot be measured.',
      value: 'No data',
    });
  } else if (lag > 3) {
    out.push({
      id: 'lag',
      ok: acked.has('lag'),
      warn: true,
      ackable: true,
      title: `Submitted ${lag} days after fuelling`,
      detail: `Bill dated ${dateTime(draft.billDatetime)}; received ${dateTime(draft.createdAt)}.`,
      value: acked.has('lag') ? 'Reviewed' : `${lag} d`,
    });
  } else {
    out.push({
      id: 'lag',
      ok: true,
      title:
        lag === 0 ? 'Submitted the same day' : `Submitted after ${lag} day${lag === 1 ? '' : 's'}`,
      detail: `Received ${dateTime(draft.createdAt)}.`,
      value: lag === 0 ? 'Same day' : `${lag} d`,
    });
  }

  return out;
}

/** Checks that actually failed. `null` (unjudgeable) is not a failure. */
export const openCount = (draft, acked) =>
  checkList(draft, acked).filter((c) => c.ok === false).length;

/** READY with an open check reads as "needs review", which is its own pill. */
export const displayStatus = (draft, acked) =>
  draft?.status === 'READY' && openCount(draft, acked) ? 'REVIEW' : draft?.status;

export const isPending = (draft) => draft?.status === 'READY';

/* ── list rollups ───────────────────────────────────────────────────────── */

export function listStats(items = [], counts = {}) {
  const pending = items.filter(isPending);
  const clean = pending.filter((d) => !openCount(d));
  return {
    pendingCount: pending.length,
    flaggedCount: pending.length - clean.length,
    cleanCount: clean.length,
    pendingValue: pending.reduce((s, d) => s + (Number(d.amount) || 0), 0),
    pendingLitres: pending.reduce((s, d) => s + (Number(d.litres) || 0), 0),
    publishedCount: counts.PUBLISHED ?? items.filter((d) => d.status === 'PUBLISHED').length,
  };
}

export function searchFilter(items = [], query = '') {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((d) =>
    [vehicleOf(d), orgOf(d), submitterOf(d), d.stationName, d.plateText]
      .filter(Boolean)
      .some((s) => String(s).toLowerCase().includes(q)),
  );
}

/** CSV of exactly what the table is showing, in the column order it shows. */
export function toCsv(rows = []) {
  const head =
    'vehicle,submitted_by,organisation,litres,amount,rate_per_l,odometer,status,bill_date,received,station';
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [head]
    .concat(
      rows.map((d) =>
        [
          d.vehicleId?.registrationNumber || d.vehicleReg || '',
          submitterOf(d),
          orgOf(d),
          d.litres ?? '',
          d.amount ?? '',
          d.rate ?? '',
          d.odometerReading ?? '',
          displayStatus(d),
          esc(dateTime(d.billDatetime)),
          esc(dateTime(d.createdAt)),
          esc(d.stationName || ''),
        ].join(','),
      ),
    )
    .join('\n');
}
