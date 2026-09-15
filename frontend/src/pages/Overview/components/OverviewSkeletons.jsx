import { Skeleton } from '@/components/ui/skeleton';
import { Panel } from './overview.primitives.jsx';

/**
 * Shape-matched loading placeholders for the Overview dashboard.
 *
 * Every skeleton mirrors the real component's layout (not a generic blank
 * box) so the page never jumps in size once data arrives, and a refreshing
 * panel reads as "this card, loading" rather than "something broke".
 *
 * These are CONTENT-ONLY (no <Panel> wrapper) — each real panel component
 * renders its own <Panel eyebrow=.../> and swaps in the matching skeleton as
 * its body while loading, so the eyebrow/question/action header stays put
 * and only the data-shaped part appears to load. DashboardSkeleton composes
 * the same pieces with their own <Panel> wrapper for the full first-paint page.
 */

/** One `.ov-kpi` tile: icon+label row, big value, sub row. */
export function KpiTileSkeleton({ primary = false }) {
  return (
    <div className={`ov-kpi ${primary ? 'ov-kpi--primary' : ''}`}>
      <Skeleton className="h-3 w-16 rounded" />
      <Skeleton className="mt-1.5 h-7 w-14 rounded" />
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}

/** The 6-tile executive summary rail. */
export function KpiRailSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <KpiTileSkeleton primary />
      {[...Array(5)].map((_, i) => (
        <KpiTileSkeleton key={i} />
      ))}
    </div>
  );
}

/** Fleet Health: score ring + headline + a handful of component bars. */
export function FleetHealthSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-5">
        <Skeleton className="h-[132px] w-[132px] shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-3 w-full max-w-[220px] rounded" />
        </div>
      </div>
      <div
        className="flex flex-col gap-2.5 border-t pt-4"
        style={{ borderColor: 'var(--hairline)' }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-20 shrink-0 rounded" />
            <Skeleton className="h-1.5 flex-1 rounded-full" />
            <Skeleton className="h-3 w-8 shrink-0 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Financial Impact: headline totals + stacked bar + ranked cost rows. */
export function FinancialImpactSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 w-24 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
      </div>
      <Skeleton className="ov-stack h-3 w-full rounded-full" />
      <div className="flex flex-col">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-t py-2.5 first:border-t-0"
            style={{ borderColor: 'var(--hairline)' }}
          >
            <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-sm" />
            <Skeleton className="h-3 flex-1 max-w-[110px] rounded" />
            <Skeleton className="h-3 w-8 shrink-0 rounded" />
            <Skeleton className="h-3 w-16 shrink-0 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Utilization: loaded/empty track + target/actual/variance/waste metrics. */
export function UtilizationSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <Skeleton className="h-6 w-full rounded-full" />
        <div className="mt-2 flex justify-between">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
      <div
        className="grid grid-cols-4 gap-3 border-t pt-4"
        style={{ borderColor: 'var(--hairline)' }}
      >
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <Skeleton className="h-2.5 w-10 rounded" />
            <Skeleton className="h-5 w-12 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Downtime Risk: 3 distribution cells + a risk table. */
export function DowntimeSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="ov-inset flex flex-col items-center gap-1.5 py-3">
            <Skeleton className="h-7 w-8 rounded" />
            <Skeleton className="h-2.5 w-12 rounded" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded" />
        ))}
      </div>
    </div>
  );
}

/** Downtime Risk's own "exposure" header stat, shown in the Panel action slot. */
export function DowntimeExposureSkeleton() {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <Skeleton className="h-5 w-14 rounded" />
      <Skeleton className="h-2.5 w-14 rounded" />
    </div>
  );
}

/** Action Center: a short list of "needs attention" rows. */
export function ActionCenterSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="ov-action">
          <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3.5 w-32 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Vehicles Requiring Attention: a table's worth of rows. */
export function VehicleAttentionSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-1.5">
          <Skeleton className="h-3.5 w-20 shrink-0 rounded" />
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
          <Skeleton className="h-3 flex-1 max-w-[100px] rounded" />
          <Skeleton className="ml-auto h-3 w-10 shrink-0 rounded" />
          <Skeleton className="h-3 w-14 shrink-0 rounded" />
        </div>
      ))}
    </div>
  );
}

/** Secondary analytics band: fuel KPIs, two charts, financial overview, drivers. */
export function AnalyticsSectionSkeleton() {
  return (
    <>
      <div className="ov-section">
        <Skeleton className="h-4 w-20 rounded" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Panel key={i}>
            <Skeleton className="h-7 w-20 rounded" />
            <Skeleton className="mt-2 h-3 w-24 rounded" />
          </Panel>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Panel key={i}>
            <div className="flex flex-col items-center gap-2 py-2">
              <Skeleton className="h-9 w-16 rounded" />
              <Skeleton className="h-3 w-24 rounded" />
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
