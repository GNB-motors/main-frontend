/* eslint-disable react-refresh/only-export-components -- companion exports alongside the component */
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--orange-tint)] text-[var(--accent-ink)] [a]:hover:bg-[var(--orange-tint)]',
        secondary:
          'bg-[var(--ds-neutral-tint)] text-[var(--ds-neutral-ink)] [a]:hover:bg-[var(--ds-neutral-tint)]',
        destructive:
          'bg-[var(--ds-crit-tint)] text-[var(--ds-crit-ink)] focus-visible:ring-destructive/20 [a]:hover:bg-[var(--ds-crit-tint)]',
        outline: 'border-[var(--ds-line2)] text-[var(--ds-ink2)] [a]:hover:bg-[var(--ds-sunk)]',
        ghost: 'text-[var(--ds-ink3)] hover:bg-[var(--ds-sunk)] hover:text-[var(--ds-ink2)]',
        link: 'text-[var(--erp)] underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({ className, variant = 'default', render, ...props }) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  });
}

export { Badge, badgeVariants };
