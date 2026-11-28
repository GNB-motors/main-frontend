import { formatDateTimeIST } from '../../utils/dateUtils';

const time = (value) => (value ? `${formatDateTimeIST(value)} IST` : 'No limit');
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function approvalWindow(a) {
  if (a.window) return `${time(a.window.from)} → ${time(a.window.to)}`;
  const r = a.recurrence;
  if (!r) return 'No validity recorded';
  return `${(r.weekdays || []).map((d) => weekdays[d]).join(', ')} · ${r.fromHour}:00–${r.toHour}:00 IST · ${time(r.validFrom)} → ${time(r.validTo)}`;
}

export function approvalValidity(a, now = Date.now()) {
  if (a.status !== 'ACTIVE') return a.status;
  const from = a.window?.from || a.recurrence?.validFrom;
  const to = a.window?.to || a.recurrence?.validTo;
  if (to && now >= new Date(to).getTime()) return 'EXPIRED';
  if (from && now < new Date(from).getTime()) return 'UPCOMING';
  if (a.recurrence) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
      })
        .formatToParts(now)
        .map((p) => [p.type, p.value]),
    );
    const hour = Number(parts.hour) + Number(parts.minute) / 60;
    const r = a.recurrence;
    if (
      !(r.weekdays || []).includes(weekdays.indexOf(parts.weekday)) ||
      hour < r.fromHour ||
      hour >= r.toHour
    )
      return 'OUTSIDE_WINDOW';
  }
  return 'ACTIVE';
}

export function approvalPlace(a) {
  const ps = a.placeSpec || {};
  if (a.placeName) return a.placeName;
  if (ps.kind === 'TYPE') return `Type: ${ps.type || 'Unspecified'}`;
  if (ps.kind === 'ANY_WORKSHOP') return 'Any workshop';
  if (ps.kind === 'ANY') return 'Any place';
  return ps.kind
    ? `${ps.kind === 'SITE' ? 'Site' : 'Region'} name unavailable`
    : 'Place unavailable';
}
