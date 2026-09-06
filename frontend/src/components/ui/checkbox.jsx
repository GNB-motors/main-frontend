import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

function Checkbox({ className, ...props }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer size-4 shrink-0 rounded-[4px] border border-[var(--ds-line2)] bg-card shadow-xs transition-colors',
        'hover:border-[var(--ds-ink3)]',
        'data-[checked]:border-[var(--orange)] data-[checked]:bg-[var(--orange)] data-[checked]:text-white',
        'data-[disabled]:cursor-not-allowed data-[disabled]:border-[var(--ds-line)] data-[disabled]:bg-[var(--ds-sunk)] data-[disabled]:opacity-100',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
