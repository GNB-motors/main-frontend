/**
 * Support tickets — pure helpers shared by the org Support Portal and the
 * super-admin inbox. Limits mirror the backend (supportTicket.constants.js and
 * middlewares/upload.js); the server re-checks every one of them.
 */
import {
  formatInIST,
  istDayEndISO,
  istDayStartISO,
  istDayString,
  shiftDay,
} from '../utils/dateUtils';

export const SUPPORT_STATUSES = ['OPEN', 'AWAITING_CUSTOMER', 'SOLVED'];
export const SUPPORT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const SUPPORT_CATEGORIES = [
  'FUEL',
  'TRIPS',
  'VEHICLES',
  'DRIVERS',
  'ERP_BILLING',
  'REPORTS',
  'ACCOUNT_ACCESS',
  'DATA_ISSUE',
  'OTHER',
];

// Mirrors PURGE_AFTER_DAYS on the backend: a solved ticket's conversation is
// deleted this many days after it is solved.
export const PURGE_AFTER_DAYS = 7;

export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
];

// Tones are passed explicitly: vocabulary TONES is keyed by value across every
// group, and HIGH / OPEN mean different things elsewhere in the product.
const STATUS_TONE = { OPEN: 'inert', AWAITING_CUSTOMER: 'caution', SOLVED: 'ok' };
const PRIORITY_TONE = { LOW: 'inert', MEDIUM: 'inert', HIGH: 'caution', URGENT: 'critical' };

export const statusTone = (status) => STATUS_TONE[status] || 'inert';
export const priorityTone = (priority) => PRIORITY_TONE[priority] || 'inert';

export const RANGE_PRESETS = [
  { key: 'all', label: 'All time', days: null },
  { key: '7d', label: 'Last 7 days', days: 7 },
  { key: '30d', label: 'Last 30 days', days: 30 },
  { key: '90d', label: 'Last 90 days', days: 90 },
  { key: '365d', label: 'Last 12 months', days: 365 },
];

/** { from, to } ISO bounds for a preset key, inclusive of today; {} for "all time". */
export function rangeFor(key, today = istDayString()) {
  const preset = RANGE_PRESETS.find((p) => p.key === key);
  if (!preset?.days) return {};
  return {
    from: istDayStartISO(shiftDay(today, -(preset.days - 1))),
    to: istDayEndISO(today),
  };
}

/** Drop empty values so the API never sees `status=` (unknown/blank params are a 400). */
export function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  );
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Stable identity for a picked File (React key and de-duplication). */
export const selectedFileKey = (file) => `${file.name}:${file.size}:${file.lastModified}`;

/**
 * Merge newly picked files into the current selection. Returns the files that
 * fit and one message per rejected file, so the picker can say exactly why.
 */
export function mergeFiles(current, incoming) {
  const errors = [];
  const seen = new Set(current.map(selectedFileKey));
  const next = [...current];
  for (const file of incoming) {
    if (seen.has(selectedFileKey(file))) continue;
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      errors.push(`${file.name}: only images and PDFs can be attached`);
    } else if (file.size > MAX_FILE_BYTES) {
      errors.push(`${file.name}: larger than 10 MB`);
    } else if (next.length >= MAX_FILES) {
      errors.push(`${file.name}: at most ${MAX_FILES} files per message`);
    } else {
      next.push(file);
      seen.add(selectedFileKey(file));
    }
  }
  return { files: next, errors };
}

function appendFiles(form, files) {
  files.forEach((file) => form.append('files', file));
  return form;
}

export function buildTicketForm(values, files, context = {}) {
  const form = new FormData();
  form.append('subject', values.subject.trim());
  form.append('description', values.description.trim());
  form.append('category', values.category);
  form.append('priority', values.priority);
  if (values.vehicleId) form.append('vehicleId', values.vehicleId);
  if (context.pageUrl) form.append('pageUrl', context.pageUrl.slice(0, 500));
  if (context.userAgent) form.append('userAgent', context.userAgent.slice(0, 500));
  return appendFiles(form, files);
}

export function buildReplyForm(body, files, extra = {}) {
  const form = new FormData();
  form.append('body', body.trim());
  Object.entries(extra).forEach(([key, value]) => {
    if (value) form.append(key, value);
  });
  return appendFiles(form, files);
}

export const followUpSubject = (ticket) =>
  `Follow-up to ${ticket.ticketNumber}: ${ticket.subject}`.slice(0, 150);

/**
 * Where a ticket stands against the purge: nothing pending, scheduled (solved,
 * in its grace period), or already purged (read-only shell).
 */
export function purgeState(ticket) {
  if (!ticket) return { kind: 'none' };
  if (ticket.purgedAt) {
    return { kind: 'purged', solvedAt: ticket.solvedAt, purgedAt: ticket.purgedAt };
  }
  if (ticket.status === 'SOLVED' && ticket.purgeAt) {
    return { kind: 'scheduled', purgeAt: ticket.purgeAt };
  }
  return { kind: 'none' };
}

export const formatDay = (iso) => formatInIST(iso, 'D MMM YYYY') ?? '—';
export const formatWhen = (iso) => formatInIST(iso, 'D MMM YYYY, h:mm a') ?? '—';

/** "just now", "5m ago", "3h ago", "2d ago", then a date. */
export function relativeTime(iso, now = Date.now()) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const minutes = Math.floor((now - t) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDay(iso);
}
