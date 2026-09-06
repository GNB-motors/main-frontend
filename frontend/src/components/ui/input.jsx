import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-9 w-full rounded-[var(--ds-radius-sm)] border border-input bg-card px-2.5 py-1 text-sm shadow-[var(--ds-shadow)] transition-colors',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
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
Input.displayName = 'Input';

export { Input };
