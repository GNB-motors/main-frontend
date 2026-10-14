/**
 * Presentation helpers for live vehicle positions, shared by the full Live
 * Tracking page and the dashboard's embedded mini-map so the two views can
 * never disagree about colours, state labels or timestamps.
 */

export const STATE_META = {
  ACTIVE: { color: '#10B981', label: 'Active' },
  PARKED: { color: '#F59E0B', label: 'Parked' },
  OFFLINE: { color: '#94A3B8', label: 'Offline' },
};

export const getStateMeta = (state) => STATE_META[state] || STATE_META.OFFLINE;

/** Status configuration for tabs, indicators and cards */
export const STATUS_CONFIG = {
  All: { label: 'All', color: '#0F172A', barColor: '#0F172A' },
  Moving: { label: 'Moving', color: '#0C9F41', barColor: '#0C9F41' },
  Stopped: { label: 'Stopped', color: '#9333EA', barColor: '#9333EA' },
  Idling: { label: 'Idling', color: '#F97316', barColor: '#F97316' },
  Offline: { label: 'Offline', color: '#9CA3AF', barColor: '#9CA3AF' },
  Breakdown: { label: 'Breakdown', color: '#EF4444', barColor: '#EF4444' },
  Faulty: { label: 'Faulty', color: '#84CC16', barColor: '#84CC16' },
  Geofence: { label: 'Geofence', color: '#3B82F6', barColor: '#3B82F6' },
};

/* =========================================================================
   NOVA EDGE PRO EXTENSIONS & CONSTANTS
   ========================================================================= */

export const NOVA_STATUS = {
  moving: { label: 'Moving', trip: 'In transit', c: '#187A32', tint: 'rgba(37,186,76,.12)' },
  idling: { label: 'Idling', trip: 'Halted', c: '#C56200', tint: 'rgba(240,170,72,.16)' },
  stopped: { label: 'Stopped', trip: 'At stop', c: '#6A43D8', tint: 'rgba(106,67,216,.12)' },
  offline: { label: 'Offline', trip: 'Pending', c: '#5D5D5E', tint: 'rgba(93,93,94,.12)' },
};
