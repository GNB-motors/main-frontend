import React from 'react';
import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * MetricNote — "how is this number worked out?"
 *
 * Two figures on the Fleet dashboard cost the most trust when unexplained:
 * Fleet Health shows a score and a letter grade with no visible definition,
 * and Est. Waste shows a rupee figure in critical red that an owner cannot
 * trace to a cause. A number you can't account for doesn't just fail on its
 * own — it makes the reader distrust every other number beside it.
 *
 * Deliberately a click-popover, not a hover tooltip: these are read on touch
 * devices too, and hover-only help is invisible there.
 */
const MetricNote = ({ label, children }) => (
  <Popover>
    {/* Rendered as the trigger element itself, matching the existing usage in
        Superadmin/DateRangeFilter — base-ui's Trigger already emits a button. */}
    <PopoverTrigger
      className="metric-note__trigger"
      aria-label={`How ${label} is calculated`}
    >
      <Info size={12} />
    </PopoverTrigger>
    <PopoverContent align="start" className="metric-note__content">
      <p className="cluster-eyebrow">{label}</p>
      <div className="text-dim text-xs leading-relaxed">{children}</div>
    </PopoverContent>
  </Popover>
);

export default MetricNote;
