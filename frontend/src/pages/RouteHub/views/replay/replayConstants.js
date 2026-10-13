export const EVC = {
  start: '#187A32',
  stop: '#6A43D8',
  os: '#F0AA48',
  dev: '#C2323A',
  end: '#1E1E20',
};
/** Where the truck was over the limit, painted on the road it drove. */
export const OVERSPEED_STRETCH = '#C2323A';
/** The audit's defaults when the replay is opened without its own limit. */
export const DEFAULT_LIMIT_KMH = 60;
export const DEFAULT_DUR_MIN = 3;
export const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: '7d', label: '7 days' },
];
export const SPEEDS = [1, 2, 4, 8];
export const PERSPECTIVES = [
  { value: 'flat', label: '2D classic' },
  { value: 'iso', label: '3D isometric' },
  { value: 'follow', label: '3D follow-cam' },
];
/** Wall-clock seconds the whole trip takes to play back at 1×. */
export const PLAYBACK_BASE_SEC = 60;
