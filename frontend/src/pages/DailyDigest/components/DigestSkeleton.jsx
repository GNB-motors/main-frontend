import { Skeleton } from '@/components/ui/skeleton';

export default function DigestSkeleton({ variant = 'list', label = 'Loading section' }) {
  return (
    <div
      className={`fo-skeleton fo-skeleton--${variant}`}
      role="status"
      aria-label={label}
      aria-busy="true"
    >
      <div aria-hidden="true">
        {variant === 'metric' ? (
          <>
            <Skeleton className="h-9 w-20" />
            <Skeleton className="mt-3 h-3 w-3/4" />
          </>
        ) : variant === 'chart' ? (
          <>
            <Skeleton className="mb-5 h-7 w-28" />
            <div className="fo-skeleton-chart">
              {[45, 70, 55, 85, 65, 95, 75].map((height, i) => (
                <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${height}%` }} />
              ))}
            </div>
            <Skeleton className="mt-4 h-3 w-3/4" />
          </>
        ) : variant === 'map' ? (
          <div className="fo-skeleton-map">
            <Skeleton className="size-12 rounded-xl" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
        ) : (
          <div className="fo-skeleton-rows">
            {Array.from({ length: 3 }, (_, i) => (
              <div className="fo-skeleton-row" key={i}>
                <Skeleton className="size-9 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-4/5" />
                </div>
                <Skeleton className="h-5 w-10" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
