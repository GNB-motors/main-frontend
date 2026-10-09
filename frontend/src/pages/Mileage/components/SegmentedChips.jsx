import React from 'react';

/**
 * One choice out of a few, as a pill group: the chosen pill is raised.
 * options: [{ key, label, count? }]; a null count is not shown.
 */
export default function SegmentedChips({ options, value, onChange, ariaLabel }) {
  return (
    <div className="mhub-seg" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          className={`mhub-seg-chip${value === o.key ? ' mhub-seg-chip--active' : ''}`}
          onClick={() => onChange(o.key)}
        >
          {o.label}
          {o.count != null && <span className="mhub-seg-count num">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}
