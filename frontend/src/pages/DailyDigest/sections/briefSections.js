import { Clock, TrendingDown, Droplet } from 'lucide-react';
import { formatLitres, formatNum } from '../../../utils/formatters';

// Excess idling is the zone-aware slice of "Idling cost" and fuel over
// expected overlaps "Low-mileage loss", so these cards stand apart from the
// ₹ impact card and are never added to its total.
export const BRIEF_SECTION = {
  excessIdling: {
    c: '#C56200',
    icon: Clock,
    col: 'Idling',
    detail: (v) => (v.durationMin ? `${formatNum(v.durationMin)} min` : '—'),
    sub: 'idling outside known loading and customer zones',
    clean: 'No vehicle idled outside known loading or customer zones today.',
  },
  fuelOverModel: {
    c: '#9333EA',
    icon: Droplet,
    col: 'Over model',
    detail: (v) => (v.excessL ? formatLitres(v.excessL) : '—'),
    sub: 'burnt above each vehicle’s learned fuel model',
    clean: 'Every vehicle burnt within its fuel model today.',
  },
};

export const BRIEF_FALLBACK = {
  c: '#C2323A',
  icon: TrendingDown,
  col: 'Detail',
  detail: () => '—',
  sub: 'lost today',
  clean: 'Nothing to report today.',
};
