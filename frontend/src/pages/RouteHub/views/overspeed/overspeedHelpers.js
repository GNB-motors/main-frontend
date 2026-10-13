export const WINDOWS = [
  { value: 6, label: 'Last 6 hours' },
  { value: 12, label: 'Last 12 hours' },
  { value: 24, label: 'Last 24 hours' },
];

export const minsOf = (sec) => Math.round((sec || 0) / 60);
/** Peak this far above the limit draws red; anything less, amber. */
export const SEVERE_OVER_KMH = 15;
export const hasCoords = (e) => e.startLat != null && e.startLng != null;
export const esc = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
