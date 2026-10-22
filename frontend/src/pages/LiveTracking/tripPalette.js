// Distinct, accessible colors for breadcrumb-trip segments.
// The breadcrumb trail can show up to a few trips per vehicle; a fixed palette
// stays legible without depending on a heavy color-mixing library. Colors are
// chosen for contrast against both light and dark Google Maps base styles.
const TRIP_PALETTE = [
  '#187A32', // GNB green (active/moving)
  '#2563EB', // blue
  '#D97706', // amber
  '#9333EA', // purple
  '#DC2626', // red
  '#0891B2', // cyan
  '#65A30D', // lime
  '#DB2777', // pink
];

export function tripColor(index) {
  return TRIP_PALETTE[index % TRIP_PALETTE.length];
}

// Stable hash for trip ids so the same trip renders the same color across
// re-renders within the same trail. Keeps the legend swatch and the polyline
// in sync without requiring callers to thread a Map.
export function tripColorForId(tripId, fallbackIndex = 0) {
  if (tripId == null) return TRIP_PALETTE[fallbackIndex % TRIP_PALETTE.length];
  const key = String(tripId);
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return TRIP_PALETTE[h % TRIP_PALETTE.length];
}
