import * as React from 'react';
import { cn } from '@/lib/utils';

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-24 w-full rounded-[var(--ds-radius-sm)] border border-input bg-card px-2.5 py-2 text-sm shadow-[var(--ds-shadow)] transition-colors',
        'placeholder:text-[var(--ds-disabled-ink)]',
        'hover:border-[var(--ds-ink3)]',
        'focus-visible:border-[var(--ds-focus)] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/60',
        'disabled:cursor-not-allowed disabled:border-[var(--ds-line)] disabled:bg-[var(--ds-sunk)] disabled:text-[var(--ds-ink3)] disabled:opacity-100',
        'aria-invalid:border-[var(--ds-crit)] aria-invalid:bg-[var(--ds-crit-tint)] aria-invalid:ring-[var(--ds-crit)]/25',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export { Textarea };
