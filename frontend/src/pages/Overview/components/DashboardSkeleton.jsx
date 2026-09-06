import { Skeleton } from '@/components/ui/skeleton';
import { Panel, SectionHeader } from './overview.primitives.jsx';
import {
  KpiRailSkeleton,
  FleetHealthSkeleton,
  FinancialImpactSkeleton,
  ActionCenterSkeleton,
  VehicleAttentionSkeleton,
  UtilizationSkeleton,
  DowntimeSkeleton,
  DowntimeExposureSkeleton,
  AnalyticsSectionSkeleton,
} from './OverviewSkeletons.jsx';

/**
 * First-paint stand-in for the whole dashboard body, before any fetch has
 * resolved. Mirrors OverviewPage's real section-by-section layout exactly
 * (same headers, same grid) so nothing jumps in size once data arrives —
 * each block below matches the panel it stands in for.
 */
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <KpiRailSkeleton />

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel eyebrow="Fleet Health" question="How healthy is my fleet?" className="h-full">
        <FleetHealthSkeleton />
      </Panel>
      <Panel
        eyebrow="Financial Impact"
        question="Where is my fleet losing money?"
        className="h-full"
      >
        <FinancialImpactSkeleton />
      </Panel>
    </div>

    <SectionHeader title="Operations" question="What requires attention right now?" />
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
      <div className="xl:col-span-5">
        <Panel
          eyebrow="Needs Attention"
          question="What requires immediate action?"
          className="h-full"
        >
          <ActionCenterSkeleton />
        </Panel>
      </div>
      <div className="xl:col-span-7">
        <Panel eyebrow="Vehicles Requiring Attention" question="Which vehicles need action?">
          <VehicleAttentionSkeleton />
        </Panel>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Panel eyebrow="Utilization" question="How efficiently are vehicles used?" className="h-full">
        <UtilizationSkeleton />
      </Panel>
      <Panel
        eyebrow="Downtime Risk"
        question="What risk is coming?"
        className="h-full"
        action={<DowntimeExposureSkeleton />}
      >
        <DowntimeSkeleton />
      </Panel>
    </div>

    <SectionHeader title="Live Tracking" question="Real-time positions" />
    <Skeleton className="h-[420px] w-full rounded-xl" />

    <AnalyticsSectionSkeleton />
  </div>
);

export default DashboardSkeleton;
