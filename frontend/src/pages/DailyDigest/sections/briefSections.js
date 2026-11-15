import { Clock, TrendingDown, Droplet } from 'lucide-react';
import { formatLitres, formatNum } from '../../../utils/formatters';

// Excess idling is the zone-aware slice of "Idling cost" and fuel over
// expected overlaps "Low-mileage loss", so these cards stand apart from the
// ₹ impact card and are never added to its total.
export const BRIEF_SECTION = {
  excessIdling: {
    c: '#C56200',
    icon: Clock,
    col: 'Engine running while stopped',
    detail: (v) => (v.durationMin ? `${formatNum(v.durationMin)} min` : '—'),
    sub: 'estimated diesel cost while stopped with the engine running',
    clean: 'No extra diesel cost from engines left running while stopped was flagged.',
  },
  fuelOverModel: {
    c: '#9333EA',
    icon: Droplet,
    col: 'Extra diesel',
    detail: (v) => (v.excessL ? formatLitres(v.excessL) : '—'),
    sub: 'estimated cost of diesel used above the expected amount',
    clean: 'No higher-than-expected diesel use was flagged.',
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
