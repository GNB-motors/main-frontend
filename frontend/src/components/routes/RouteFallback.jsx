import { Skeleton } from '@/components/ui/skeleton';

/**
 * RouteFallback — the placeholder a lazy route shows while its chunk loads.
 *
 * A route that renders nothing leaves the content area blank, which reads as
 * a broken page. This is a stable, page-shaped placeholder: the shell (title
 * block + content block) is already on screen, so nothing jumps when the real
 * page arrives. It says what is happening, in plain words.
 */
export default function RouteFallback({ label = 'Loading this page…' }) {
  return (
    <div
      className="cluster-page"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="route-fallback"
    >
      <div className="flex w-full flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-[12px]" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-3 w-80" />
          </div>
        </div>
        <Skeleton className="h-9 w-full max-w-md" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((row) => (
            <Skeleton key={row} className="h-11 w-full" />
          ))}
        </div>
        <p className="m-0 text-[13px]" style={{ color: 'var(--ds-ink2)' }}>
          {label}
        </p>
      </div>
    </div>
  );
}
