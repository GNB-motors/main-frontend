import { Skeleton } from '../../../components/ui/skeleton.jsx';

/** Match the pair list and comparison panel while code or data loads. */
export default function DuplicatesSkeleton() {
  return (
    <div role="status" aria-label="Loading possible duplicate places" aria-busy="true">
      <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
        <div className="rounded-xl border border-[var(--ds-line)] p-4 flex flex-col gap-4">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-[var(--ds-line)] pt-4">
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--ds-line)] p-4 flex flex-col gap-4">
          <Skeleton className="h-5 w-3/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-3">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}
