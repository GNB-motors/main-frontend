import React from 'react';
import { AlertTriangle, Circle, Power } from 'lucide-react';

/* Single source of truth for the silence trio states used across the map,
   drawer, and job panels. Every state always ships a glyph + word. */
const TRIO = {
  nothing: {
    label: 'nothing',
    glyph: Circle,
    style: { '--lemu-status-color': 'var(--lemu-status-idle)', '--lemu-status-bg': 'var(--lemu-status-idle-bg)' },
    className: 'lemu-status-chip--nothing',
  },
  off: {
    label: 'switched off',
    glyph: Power,
    style: { '--lemu-status-color': 'var(--lemu-status-off)', '--lemu-status-bg': 'var(--lemu-status-idle-bg)' },
    className: 'lemu-status-chip--off',
  },
  degraded: {
    label: 'degraded',
    glyph: Circle,
    style: { '--lemu-status-color': 'var(--lemu-status-degraded)', '--lemu-status-bg': 'var(--lemu-status-degraded-bg)' },
    className: 'lemu-status-chip--degraded',
  },
  broken: {
    label: 'broken',
    glyph: AlertTriangle,
    style: { '--lemu-status-color': 'var(--lemu-status-broken)', '--lemu-status-bg': 'var(--lemu-status-broken-bg)' },
    className: 'lemu-status-chip--broken',
  },
};

const LemuStatusChip = ({ state, label, className = '' }) => {
  const config = TRIO[state] || TRIO.nothing;
  const Glyph = config.glyph;
  const displayLabel = label ?? config.label;

  return (
    <span
      className={`lemu-status-chip ${config.className} ${className}`}
      style={config.style}
      title={displayLabel}
    >
      <Glyph size={12} className="lemu-status-chip__glyph" />
      <span className="lemu-status-chip__label">{displayLabel}</span>
    </span>
  );
};

export default LemuStatusChip;
