import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'animate-[gnb-shimmer_1.4s_ease-in-out_infinite] rounded-[4px] bg-[linear-gradient(90deg,var(--ds-sunk)_25%,var(--ds-line)_37%,var(--ds-sunk)_63%)] [background-size:400%_100%]',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
