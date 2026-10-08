import { Hexagon, Flame } from 'lucide-react';
import typeStyle from '../PlaceIntelligence/placeTypes.js';

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
export const DRAFT_COLOR = '#2563eb';
export const CONTEXT_COLOR = '#64748b';
