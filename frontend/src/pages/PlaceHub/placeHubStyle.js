import { Hexagon, Flame } from 'lucide-react';
import typeStyle from './intelligence/placeTypes.js';

/**
 * Icon + colour per place type. Reuses Place Intelligence's palette so a pump
 * looks like a pump on both pages; adds the two kinds only Place Hub shows.
 */
const EXTRA = {
  ZONE: { Icon: Hexagon, color: '#6366f1' },
  HOTSPOT: { Icon: Flame, color: '#c62828' },
};

export function styleOfType(type) {
  return EXTRA[type] || typeStyle(type);
}

export const PROVENANCE_COLOR = {
  'own-manual': '#c62828',
  'own-learned': '#e5484d',
  network: '#7c3aed',
};

export const IDLE_COLOR = {
  excess: '#e5484d',
  mixed: '#f2a413',
  legit: '#25855a',
};

export function idleTone(excessShare) {
  if (excessShare >= 0.6) return 'excess';
  if (excessShare >= 0.25) return 'mixed';
  return 'legit';
}

export const DRAIN_COLOR = '#d97706';
export const STOP_COLOR = '#c2410c';
export const RISK_COLOR = '#c62828';

/** Map data (OSM / Google) in four buckets; villages are left to the base map. */
export const POI_COLOR = {
  PLANT: '#8d6e63',
  INDUSTRIAL: '#7e57c2',
  LOGISTICS: '#1e88e5',
  ROADSIDE: '#9e9e9e',
};
export const POI_LABEL = {
  PLANT: 'Plant / mine',
  INDUSTRIAL: 'Industrial area',
  LOGISTICS: 'Siding / port / market',
  ROADSIDE: 'Pump / dhaba / toll',
};
const POI_BUCKET = {
  CEMENT_PLANT: 'PLANT',
  STEEL_PLANT: 'PLANT',
  POWER_PLANT: 'PLANT',
  FACTORY: 'PLANT',
  MINE_QUARRY: 'PLANT',
  INDUSTRIAL_AREA: 'INDUSTRIAL',
  WAREHOUSE: 'LOGISTICS',
  RAIL_GOODS: 'LOGISTICS',
  PORT: 'LOGISTICS',
  MARKET: 'LOGISTICS',
  FUEL_STATION: 'ROADSIDE',
  TRUCK_STOP: 'ROADSIDE',
  WORKSHOP: 'ROADSIDE',
  WEIGHBRIDGE: 'ROADSIDE',
  TOLL: 'ROADSIDE',
};
export const poiBucket = (category) => POI_BUCKET[category] || null;
export const DRAFT_COLOR = '#2563eb';
export const CONTEXT_COLOR = '#64748b';
