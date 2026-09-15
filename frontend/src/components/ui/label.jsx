import * as React from 'react';
import { Field } from '@base-ui/react/field';
import { cn } from '@/lib/utils';

const Label = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <Field.Label
      ref={ref}
      data-slot="label"
      className={cn(
        'text-xs font-medium leading-none text-[var(--ds-ink2)] peer-disabled:cursor-not-allowed peer-disabled:text-[var(--ds-ink3)]',
        className,
      )}
      {...props}
    />
  );
});
Label.displayName = 'Label';

export { Label };
