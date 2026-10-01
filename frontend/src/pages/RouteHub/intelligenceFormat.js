/**
 * IST hour-of-week formatting for the Route Hub Intelligence tab (ROAD_INTELLIGENCE plan Task P5.6).
 * Monday 00:00 IST = 0 … Sunday 23:00 IST = 167, matching the backend's hour bins (maths 0.7, R6: bins are IST).
 */
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function istHourOfWeek(d = new Date()) {
  const t = new Date(d.getTime() + 330 * 60 * 1000);
  return ((t.getUTCDay() + 6) % 7) * 24 + t.getUTCHours();
}

export function howLabel(how) {
  const dow = DOW[Math.floor(how / 24)];
  return `${dow} ${String(how % 24).padStart(2, '0')}:00 IST`;
}
