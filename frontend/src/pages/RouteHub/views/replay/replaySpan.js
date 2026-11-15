/**
 * How long the replay covers. Past two days, hours stop being readable, so the
 * span reads in days and hours ("6 d 18 h"); below that, in hours and minutes.
 */
export default function spanText(minutes) {
  if (minutes == null || !Number.isFinite(minutes)) return '—';
  const mins = Math.max(0, Math.round(minutes));
  if (mins >= 48 * 60) {
    const days = Math.floor(mins / 1440);
    const hours = Math.floor((mins % 1440) / 60);
    return `${days} d ${hours} h`;
  }
  return `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} m`;
}
