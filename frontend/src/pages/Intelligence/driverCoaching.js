/**
 * The one way from an observation to the coaching conversation.
 *
 * Performance → Drivers is the coaching home. A link to it carries the driver
 * and the window the owner was looking at — and only what the screen really
 * knows: a driver id or a date that is not known is left out, never invented.
 */
import { toISTDateString } from '@/utils/dateUtils';
import { periodRangeLabel } from './intelligenceModel';

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** The day a date belongs to, as YYYY-MM-DD. '' when the day is not known. */
export function coachingDay(value) {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  if (!text) return '';
  if (YMD.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return '';
  return toISTDateString(parsed) ?? '';
}

/**
 * The coaching link for what the owner is looking at.
 *
 * The order is fixed — tab, driver, window — so every screen builds the same
 * address. A piece that is not known is simply absent: the coaching home then
 * opens on the driver and the days that were really selected, and on nothing
 * else.
 */
export function driverCoachingUrl({ driverId = '', driverName = '', from = '', to = '' } = {}) {
  const parts = ['tab=drivers'];
  const id = String(driverId ?? '').trim();
  const name = String(driverName ?? '').trim();
  const start = coachingDay(from);
  const end = coachingDay(to);
  if (id) parts.push(`driverId=${encodeURIComponent(id)}`);
  if (name) parts.push(`driverName=${encodeURIComponent(name)}`);
  if (start) parts.push(`from=${start}`);
  if (end) parts.push(`to=${end}`);
  return `/performance?${parts.join('&')}`;
}

/** The window in words, to sit next to the link: "27 Oct – 2 Nov". */
export function coachingWindowLabel(from, to) {
  return periodRangeLabel(coachingDay(from), coachingDay(to));
}

/** The one driver every row names, when the rows name exactly one. */
export function sharedDriverName(items = []) {
  const names = new Set(items.map((row) => String(row?.driverName ?? '').trim()).filter(Boolean));
  return names.size === 1 ? [...names][0] : '';
}
