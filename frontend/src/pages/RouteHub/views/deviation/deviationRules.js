export const STATUS_FILTERS = [
  { key: 'all', label: 'All statuses' },
  { key: 'open', label: 'Please review', ic: 'alert', c: '#C56200' },
  { key: 'reviewed', label: 'Reviewed', ic: 'check', c: '#187A32' },
];

export const isOpen = (d) => String(d.status || '').toUpperCase() === 'OPEN';

export const normalisePlate = (s) =>
  String(s || '')
    .replace(/[-\s]/g, '')
    .toLowerCase();

// Roundabout / Circuitous Detour Detector:
// Flags whenever actual path diverged significantly (>= 12 km extra distance or >= 10 km off corridor)
export const isCircuitousDetour = (d) =>
  Boolean((d.extraKmEstimate && d.extraKmEstimate >= 12) || (d.maxOffKm && d.maxOffKm >= 10));
