import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import IntelligenceSkeleton from './IntelligenceSkeleton';
import { useApi } from '@/hooks/useApi';
import { useFullPageLayout } from '@/hooks/usePageLayout';
import IntelligencePeriodPicker from './IntelligencePeriodPicker';
import IntelligenceFilters from './IntelligenceFilters';
import IntelligenceSummaryTiles from './IntelligenceSummaryTiles';
import IntelligenceOverview from './IntelligenceOverview';
import IntelligenceDataState from './IntelligenceDataState';
import IntelligenceService from './IntelligenceService';
import { INTELLIGENCE_TABS, INSTANCE_TABS, resolveIntelligenceTab } from './intelligenceTabs';
import { periodDates, resolvePeriod } from './intelligenceModel';
import './IntelligencePage.css';

const IssuesTab = lazy(() => import('./IssuesTab'));
const ReportCardsTab = lazy(() => import('./ReportCardsTab'));
const RunsTab = lazy(() => import('./RunsTab'));
const InstancesTab = lazy(() => import('./InstancesTab'));
const MileageDefTab = lazy(() => import('./MileageDefTab'));
const PlacesTab = lazy(() => import('./PlacesTab'));

/** The shape of a tab while its code is still being fetched. */
const TAB_FALLBACK = <IntelligenceSkeleton variant="table" />;

/**
 * Intelligence — what we worked out about the fleet, good and bad, with the
 * reason for every claim.
 *
 * The tab, the period and the filters all live in the URL, so a link to a
 * page is a link to that exact view and the Back button goes back through
 * it.
 */
export default function IntelligencePage() {
  useFullPageLayout();
  const [searchParams, setSearchParams] = useSearchParams();

  const requested = searchParams.get('tab');
  const vehicle = searchParams.get('vehicle') ?? '';
  const driver = searchParams.get('driver') ?? '';
  const kind = searchParams.get('kind') ?? '';
  const period = resolvePeriod({ from: searchParams.get('from'), to: searchParams.get('to') });
  const { from, to } = period;

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  const {
    data: summary,
    loading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useApi((signal) => IntelligenceService.getSummary({ from, to, signal }), [from, to]);

  const { data: issues } = useApi(
    (signal) => IntelligenceService.getIssues({ from, to, signal }),
    [from, to],
  );

  const actCount = issues?.counts?.act ?? null;
  const active = resolveIntelligenceTab(requested, actCount);

  return (
    <div className="intelligence-page min-w-0 w-full bg-[var(--rd-bg)] px-4 py-6 sm:px-8">
      <header className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-[20px] font-semibold text-[var(--rd-ink)]">Intelligence</h1>
          <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">
            What your trucks and drivers did, explained.
          </p>
        </div>

        <IntelligencePeriodPicker
          period={period}
          onPreset={(presetId) => {
            const dates = periodDates(presetId);
            updateParams({ from: dates.from, to: dates.to });
          }}
          onCustom={(range) => updateParams({ from: range.from, to: range.to })}
        />
      </header>

      <div className="mb-4">
        <IntelligenceFilters
          showVehicle={!['drivers', 'runs', 'places'].includes(active)}
          showDriver={active === 'drivers' || Object.hasOwn(INSTANCE_TABS, active)}
          vehicle={vehicle}
          driver={driver}
          onChange={(next) => updateParams({ vehicle: next.vehicle, driver: next.driver })}
        />
      </div>

      {['runs', 'places'].includes(active) ? (
        <p className="intelligence-scope-note">
          This tab covers the whole fleet. Truck and driver filters apply on their supported tabs.
        </p>
      ) : null}
      {/* The summary endpoint not shipped yet (404) means nothing to show:
          no box at all, rather than a dashed "being built" panel above a
          second one in the tab. */}
      {summaryError?.status === 404 ? null : (
        <div className="mb-4">
          <IntelligenceDataState
            loading={summaryLoading}
            loadingVariant="metrics"
            loadingCount={summary?.tiles?.length || 4}
            error={summaryError}
            held={summary?.held ? summary.why : null}
            what="The summary of this period"
            onRetry={refetchSummary}
          >
            <IntelligenceOverview summary={summary} issues={issues} />
            {summary?.tiles?.length ? (
              <details className="intelligence-insight-details">
                <summary>Period insights and explanations</summary>
                <IntelligenceSummaryTiles tiles={summary.tiles} />
              </details>
            ) : null}
          </IntelligenceDataState>
        </div>
      )}

      <Tabs value={active} onValueChange={(value) => updateParams({ tab: value })}>
        <div className="intelligence-tabs-scroll">
          <TabsList className="intelligence-tabs-list" aria-label="Intelligence views">
            {INTELLIGENCE_TABS.map((tab) => (
              <Tooltip key={tab.id} delay={300}>
                <TooltipTrigger
                  render={
                    <TabsTrigger value={tab.id} className="intelligence-tab normal-case">
                      <span className="inline-flex items-center gap-1.5">
                        <tab.icon size={14} aria-hidden="true" />
                        {tab.label}
                        {tab.id === 'issues' && actCount ? (
                          <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--rd-act)] px-1 text-[10px] font-bold text-white">
                            {actCount}
                          </span>
                        ) : null}
                      </span>
                    </TabsTrigger>
                  }
                />
                <TooltipContent side="top">{tab.hint}</TooltipContent>
              </Tooltip>
            ))}
          </TabsList>
        </div>

        <TabsContent value="issues">
          <Suspense fallback={<IntelligenceSkeleton />}>
            <IssuesTab
              key={`${from}:${to}:${vehicle}:${kind}`}
              from={from}
              to={to}
              vehicle={vehicle}
              kind={kind}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="vehicles">
          <Suspense fallback={<IntelligenceSkeleton variant="cards" />}>
            <ReportCardsTab
              key={`vehicles:${from}:${to}:${vehicle}`}
              subject="vehicle"
              from={from}
              to={to}
              vehicle={vehicle}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="drivers">
          <Suspense fallback={<IntelligenceSkeleton variant="cards" />}>
            <ReportCardsTab
              key={`drivers:${from}:${to}:${driver}`}
              subject="driver"
              from={from}
              to={to}
              driver={driver}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="runs">
          <Suspense fallback={<IntelligenceSkeleton variant="metrics" count={3} />}>
            <RunsTab from={from} to={to} />
          </Suspense>
        </TabsContent>

        <TabsContent value="idling">
          <Suspense fallback={TAB_FALLBACK}>
            <InstancesTab
              key={`idling-${from}-${to}-${vehicle}-${driver}`}
              kind={INSTANCE_TABS.idling}
              from={from}
              to={to}
              vehicle={vehicle}
              driver={driver}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="cruise">
          <Suspense fallback={TAB_FALLBACK}>
            <InstancesTab
              key={`cruise-${from}-${to}-${vehicle}-${driver}`}
              kind={INSTANCE_TABS.cruise}
              from={from}
              to={to}
              vehicle={vehicle}
              driver={driver}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="overspeed">
          <Suspense fallback={TAB_FALLBACK}>
            <InstancesTab
              key={`overspeed-${from}-${to}-${vehicle}-${driver}`}
              kind={INSTANCE_TABS.overspeed}
              from={from}
              to={to}
              vehicle={vehicle}
              driver={driver}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="fuel">
          <Suspense fallback={TAB_FALLBACK}>
            <InstancesTab
              key={`fuel-${from}-${to}-${vehicle}-${driver}`}
              kind={INSTANCE_TABS.fuel}
              from={from}
              to={to}
              vehicle={vehicle}
              driver={driver}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="detours">
          <Suspense fallback={TAB_FALLBACK}>
            <InstancesTab
              key={`detours-${from}-${to}-${vehicle}-${driver}`}
              kind={INSTANCE_TABS.detours}
              from={from}
              to={to}
              vehicle={vehicle}
              driver={driver}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="mileage">
          <Suspense fallback={<IntelligenceSkeleton variant="cards" count={2} />}>
            <MileageDefTab from={from} to={to} vehicle={vehicle} />
          </Suspense>
        </TabsContent>

        <TabsContent value="places">
          <Suspense fallback={TAB_FALLBACK}>
            <PlacesTab from={from} to={to} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
