import {
  Fuel,
  ArrowUpFromLine,
  ArrowDownToLine,
  Factory,
  Warehouse,
  SquareParking,
  House,
  Wrench,
  UtensilsCrossed,
  BadgeIndianRupee,
  ShieldCheck,
  CircleHelp,
} from 'lucide-react';

/**
 * One look per place type — icon and colour — shared by map markers, list
 * cards, the legend and the answer chips, so a pump looks like a pump
 * everywhere. The colours avoid the status tones: green/amber/red stay
 * reserved for confirmed / needs an answer / risk. Labels live in
 * placeIntelligenceModel so they stay testable without React.
 */
const TYPE_STYLE = {
  FUEL_PUMP: { Icon: Fuel, color: '#d97706' },
  LOADING: { Icon: ArrowUpFromLine, color: '#2563eb' },
  UNLOADING: { Icon: ArrowDownToLine, color: '#7c3aed' },
  PLANT: { Icon: Factory, color: '#0f766e' },
  WAREHOUSE: { Icon: Warehouse, color: '#1e3a8a' },
  YARD: { Icon: Warehouse, color: '#334155' },
  PARKING: { Icon: SquareParking, color: '#475569' },
  VEHICLE_HABIT: { Icon: House, color: '#64748b' },
  WORKSHOP: { Icon: Wrench, color: '#be123c' },
  SERVICE: { Icon: Wrench, color: '#be123c' },
  DHABA: { Icon: UtensilsCrossed, color: '#15803d' },
  TOLL: { Icon: BadgeIndianRupee, color: '#0891b2' },
  CHECKPOST: { Icon: ShieldCheck, color: '#0e7490' },
  UNKNOWN: { Icon: CircleHelp, color: '#9ca3af' },
};

export default function typeStyle(type) {
  return TYPE_STYLE[type] || TYPE_STYLE.UNKNOWN;
}
