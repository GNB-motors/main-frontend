import { Skeleton } from '../../../../components/ui/skeleton';

export function OverviewCardSkeleton({ className = '', chart = false, map = false }) {
  return (
    <section
      className={`vdo-card vdo-loading-card ${className}`}
      role="status"
      aria-label="Loading vehicle data"
      aria-busy="true"
    >
      <div className="vdo-loading-heading">
        <Skeleton style={{ width: '35%', height: 16 }} />
        <Skeleton style={{ width: '20%', height: 12 }} />
      </div>
      <Skeleton style={{ width: '55%', height: 14 }} />
      {chart ? (
        <div className="vdo-loading-bars" aria-hidden="true">
          {Array.from({ length: 30 }, (_, index) => (
            <Skeleton key={index} style={{ flex: 1, height: `${20 + ((index * 23) % 75)}%` }} />
          ))}
        </div>
      ) : map ? (
        <Skeleton style={{ width: '100%', minHeight: 260, flex: 1 }} />
      ) : (
        <>
          <Skeleton style={{ width: '65%', height: 32, marginTop: 8 }} />
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} style={{ width: '100%', height: 16, marginTop: 8 }} />
          ))}
        </>
      )}
      <span className="sr-only">Loading…</span>
    </section>
  );
}

export default function OverviewSkeleton() {
  return (
    <div className="vdo-overview">
      <div className="vdo-content">
        <div className="vdo-top-row">
          <OverviewCardSkeleton className="vdo-distance" chart />
          <OverviewCardSkeleton className="vdo-location" map />
        </div>
        <div className="vdo-card-grid">
          {[0, 1, 2, 3].map((index) => (
            <OverviewCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
