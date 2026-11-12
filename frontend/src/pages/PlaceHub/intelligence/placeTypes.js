import { placeTypeIcon } from '../../../utils/placeTypeIcon.js';

/**
 * One look per place type — icon and colour — shared by map markers, list
 * cards, the legend and the answer chips, so a pump looks like a pump
 * everywhere. The colours avoid the status tones: green/amber/red stay
 * reserved for confirmed / needs an answer / risk. Labels live in
 * model/siteVocabulary.js so they stay testable without React.
 */
const TYPE_STYLE = {
  FUEL_PUMP: { color: '#d97706' },
  LOADING: { color: '#2563eb' },
  UNLOADING: { color: '#7c3aed' },
  PLANT: { color: '#0f766e' },
  WAREHOUSE: { color: '#1e3a8a' },
  YARD: { color: '#334155' },
  PARKING: { color: '#475569' },
  VEHICLE_HABIT: { color: '#64748b' },
  WORKSHOP: { color: '#be123c' },
  SERVICE: { color: '#be123c' },
  DHABA: { color: '#15803d' },
  TOLL: { color: '#0891b2' },
  CHECKPOST: { color: '#0e7490' },
  UNKNOWN: { color: '#9ca3af' },
};

export default function typeStyle(type) {
  return { ...(TYPE_STYLE[type] || TYPE_STYLE.UNKNOWN), Icon: placeTypeIcon(type) };
}
