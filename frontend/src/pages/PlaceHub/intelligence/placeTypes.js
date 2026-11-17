import { placeTypeIcon } from '../../../utils/placeTypeIcon.js';

/**
 * One look per place type — icon and colour — shared by map markers, list
 * cards, the legend and the answer chips, so a pump looks like a pump
 * everywhere. The colours avoid the status tones: green/amber/red stay
 * reserved for confirmed / needs an answer / risk. Labels live in
 * model/siteVocabulary.js so they stay testable without React.
 */
const TYPE_STYLE = {
  FUEL_PUMP: { color: '#0ea5e9' }, // sky blue — matches the pump map layer
  LOADING: { color: '#2563eb' }, // blue
  UNLOADING: { color: '#7c3aed' }, // violet
  PLANT: { color: '#1f3fbf' }, // royal blue — matches the plant map layer
  WAREHOUSE: { color: '#1e3a8a' }, // navy
  YARD: { color: '#334155' }, // slate
  PARKING: { color: '#0891b2' }, // cyan
  VEHICLE_HABIT: { color: '#64748b' }, // grey
  WORKSHOP: { color: '#be123c' }, // crimson
  SERVICE: { color: '#be123c' },
  DHABA: { color: '#d97706' }, // amber — matches the dhaba map layer
  TOLL: { color: '#6b7280' }, // grey — matches the toll map layer
  CHECKPOST: { color: '#0e7490' }, // dark cyan
  UNKNOWN: { color: '#9ca3af' },
};

export default function typeStyle(type) {
  return { ...(TYPE_STYLE[type] || TYPE_STYLE.UNKNOWN), Icon: placeTypeIcon(type) };
}
