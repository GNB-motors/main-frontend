import React from 'react';
import { Info } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import ExplanationLines from './ExplanationLines';

/**
 * ⓘ next to a verdict: rows show the plain-word result; how it was worked out
 * waits here. `explanation` is { title, text, lines: [[label, value]] } from
 * mileageRows. Renders nothing when there is nothing to explain.
 */
export default function InfoTip({ explanation, label = 'How is this worked out?' }) {
  if (!explanation) return null;
  // Rows can be clickable; opening or reading the ⓘ (its popup portals, but
  // React events still bubble through it) must not also open the row.
  return (
    <span role="presentation" className="inline-flex" onClick={(e) => e.stopPropagation()}>
      <Popover>
        <PopoverTrigger className="mhub-info" aria-label={label} title={label}>
          <Info size={14} aria-hidden />
        </PopoverTrigger>
        <PopoverContent className="w-80" side="bottom" align="start">
          <PopoverHeader>
            <PopoverTitle className="font-semibold text-[var(--ds-ink)]">
              {explanation.title}
            </PopoverTitle>
            <PopoverDescription className="text-[13px] text-[var(--ds-ink2)]">
              {explanation.text}
            </PopoverDescription>
          </PopoverHeader>
          {explanation.lines?.length > 0 && <ExplanationLines lines={explanation.lines} />}
        </PopoverContent>
      </Popover>
    </span>
  );
}
