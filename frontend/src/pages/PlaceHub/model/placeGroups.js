import { typeLabel } from '../intelligence/model/siteType.js';

const GROUP_OF_TYPE = {
  WAREHOUSE: 'warehouse',
  YARD: 'warehouse',
  ZONE: 'zone',
  LOADING: 'trade',
  UNLOADING: 'trade',
  PLANT: 'trade',
  FUEL_PUMP: 'road',
  DHABA: 'road',
  TOLL: 'road',
  CHECKPOST: 'road',
  PARKING: 'road',
  WORKSHOP: 'road',
  SERVICE: 'road',
};

export const PLACE_GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'warehouse', label: 'Warehouses' },
  { id: 'zone', label: 'Zones' },
  { id: 'trade', label: 'Load & unload' },
  { id: 'road', label: 'On the road' },
  { id: 'other', label: 'Other' },
  { id: 'risk', label: 'Fuel risk' },
  { id: 'review', label: 'To review' },
  { id: 'low', label: 'Low evidence' },
  { id: 'rejected', label: 'Not a place' },
];

/**
 * Groups that sit outside "All places": suggestions, suggestions with too little
 * evidence to answer yet, and places said not to exist.
 */
export const SET_ASIDE = new Set(['review', 'low', 'rejected']);

export function groupOfType(type) {
  return GROUP_OF_TYPE[type] || 'other';
}

export function placeTypeLabel(type) {
  if (type === 'ZONE') return 'Geofence zone';
  if (type === 'HOTSPOT') return 'Fuel risk hotspot';
  return typeLabel(type);
}
