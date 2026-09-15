/* eslint-disable react-refresh/only-export-components -- companion exports alongside the component */
import { Button as ButtonPrimitive } from '@base-ui/react/button';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[9px] border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:translate-y-px disabled:pointer-events-none aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground [a]:hover:bg-primary/80 hover:bg-[var(--orange-hover)] active:bg-[var(--orange-active)] disabled:border-[var(--ds-line)] disabled:bg-[var(--ds-sunk)] disabled:text-[var(--ds-ink3)]',
        outline:
          'border-[var(--ds-line2)] bg-card font-medium text-[var(--ds-ink)] hover:border-[var(--ds-ink3)] hover:bg-[var(--ds-sunk)] active:bg-[var(--ds-line)] aria-expanded:bg-[var(--ds-sunk)] aria-expanded:text-[var(--ds-ink)] disabled:border-dashed disabled:bg-transparent disabled:text-[var(--ds-ink3)]',
        secondary:
          'bg-[var(--ds-sunk)] font-medium text-[var(--ds-ink2)] hover:bg-[var(--ds-line)] hover:text-[var(--ds-ink)] aria-expanded:bg-[var(--ds-sunk)] aria-expanded:text-[var(--ds-ink)] disabled:bg-transparent disabled:text-[var(--ds-ink3)]',
        ghost:
          'font-medium text-[var(--ds-ink2)] hover:bg-[var(--ds-sunk)] hover:text-[var(--ds-ink)] active:bg-[var(--ds-line)] aria-expanded:bg-[var(--ds-sunk)] aria-expanded:text-[var(--ds-ink)] disabled:bg-transparent disabled:text-[var(--ds-disabled-ink)]',
        destructive:
          'bg-[var(--ds-crit-solid)] text-white hover:bg-[var(--ds-crit-solid-hover)] active:bg-[var(--ds-crit-solid-active)] focus-visible:border-[var(--ds-crit)] disabled:border-[var(--ds-line)] disabled:bg-[var(--ds-sunk)] disabled:text-[var(--ds-ink3)]',
        link: 'font-semibold text-[var(--erp)] underline-offset-4 hover:text-[var(--erp-ink)] hover:underline disabled:bg-transparent disabled:text-[var(--ds-disabled-ink)] disabled:no-underline',
      },
      size: {
        default:
          'h-9.5 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
        xs: "h-6 gap-1 rounded-[min(var(--ds-radius-sm),6px)] px-2 text-xs in-data-[slot=button-group]:rounded-[9px] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 rounded-[min(var(--ds-radius-sm),8px)] px-3 text-[0.8rem] in-data-[slot=button-group]:rounded-[9px] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-10 gap-1.5 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
        icon: 'size-8',
        'icon-xs':
          "size-6 rounded-[min(var(--ds-radius-sm),6px)] in-data-[slot=button-group]:rounded-[9px] [&_svg:not([class*='size-'])]:size-3",
        'icon-sm':
          'size-7 rounded-[min(var(--ds-radius-sm),8px)] in-data-[slot=button-group]:rounded-[9px]',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({ className, variant = 'default', size = 'default', ...props }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
