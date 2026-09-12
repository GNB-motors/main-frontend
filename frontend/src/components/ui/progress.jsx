import * as React from 'react';
import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { cn } from '@/lib/utils';

const TONES = {
  default: 'bg-primary',
  ok: 'bg-[var(--ds-ok)]',
  warn: 'bg-[var(--ds-warn)]',
  crit: 'bg-[var(--ds-crit)]',
};

function Progress({ className, value, max = 100, tone = 'default', ...props }) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-[var(--ds-sunk)] shadow-[inset_0_0_0_1px_var(--ds-line)]',
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          'h-full w-full flex-1 rounded-full transition-all',
          TONES[tone] ?? TONES.default,
        )}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
