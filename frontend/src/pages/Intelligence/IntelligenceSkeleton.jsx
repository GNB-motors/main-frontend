import { Skeleton } from '@/components/ui/skeleton';

/** Match the surface being loaded instead of replacing it with full-width bars. */
export default function IntelligenceSkeleton({ variant = 'list', count = 3 }) {
  const metrics = variant === 'metrics';
  const cards = metrics || variant === 'cards';
  return (
    <div
      role="status"
      aria-label={`Loading ${variant === 'table' ? 'table' : 'cards'}`}
      aria-busy="true"
    >
      {variant === 'table' ? (
        <div className="intelligence-table-skeleton" aria-hidden="true">
          <div className="intelligence-skeleton-toolbar">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="intelligence-skeleton-table-scroll">
            <div className="intelligence-skeleton-table">
              <div className="intelligence-skeleton-table-head">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-4 w-20" />
                ))}
              </div>
              {Array.from({ length: 6 }, (_, row) => (
                <div className="intelligence-skeleton-table-row" key={row}>
                  {Array.from({ length: 6 }, (_, col) => (
                    <Skeleton key={col} className={`h-4 ${col === 3 ? 'w-28' : 'w-20'}`} />
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="intelligence-skeleton-footer">
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      ) : (
        <div
          className={`intelligence-skeleton-grid ${metrics ? 'intelligence-skeleton-grid--metrics' : cards ? 'intelligence-skeleton-grid--cards' : ''}`}
          aria-hidden="true"
          style={{ '--skeleton-columns': metrics && count !== 3 ? 4 : count }}
        >
          {Array.from({ length: count }, (_, i) => (
            <div className="intelligence-skeleton-card" key={i}>
              <div className="intelligence-skeleton-card-head">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="size-7 rounded-lg" />
              </div>
              {metrics ? (
                <>
                  <Skeleton className="mt-4 h-8 w-24" />
                  <Skeleton className="mt-3 h-3 w-36 max-w-full" />
                </>
              ) : (
                <>
                  {Array.from({ length: cards ? 3 : 2 }, (_, row) => (
                    <div className="intelligence-skeleton-card-row" key={row}>
                      <Skeleton className="size-9 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="mt-2 h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
