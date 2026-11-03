import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useApi } from '@/hooks/useApi';
import IntelligencePeriodPicker from './IntelligencePeriodPicker';
import IntelligenceFilters from './IntelligenceFilters';
import IntelligenceSummaryTiles from './IntelligenceSummaryTiles';
import IntelligenceDataState from './IntelligenceDataState';
import IntelligenceService from './IntelligenceService';
import { INTELLIGENCE_TABS, INSTANCE_TABS, resolveIntelligenceTab } from './intelligenceTabs';
import { periodDates, resolvePeriod } from './intelligenceModel';

const IssuesTab = lazy(() => import('./IssuesTab'));
const ReportCardsTab = lazy(() => import('./ReportCardsTab'));
const RunsTab = lazy(() => import('./RunsTab'));
const InstancesTab = lazy(() => import('./InstancesTab'));
const MileageDefTab = lazy(() => import('./MileageDefTab'));
const PlacesTab = lazy(() => import('./PlacesTab'));

/** The shape of a tab while its code is still being fetched. */
const TAB_FALLBACK = (
  <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
    <Skeleton className="h-20 w-full rounded-[var(--rd-radius)]" />
    <Skeleton className="h-14 w-full rounded-[var(--rd-radius)]" />
  </div>
);

/**
 * Intelligence — what we worked out about the fleet, good and bad, with the
 * reason for every claim.
 *
 * The tab, the period and the filters all live in the URL, so a link to a
 * page is a link to that exact view and the Back button goes back through
 * it.
 */
export default function IntelligencePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const requested = searchParams.get('tab');
  const vehicle = searchParams.get('vehicle') ?? '';
  const driver = searchParams.get('driver') ?? '';
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
    <div className="mx-auto w-full max-w-[1280px] bg-[var(--rd-bg)] px-4 py-5">
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
          vehicle={vehicle}
          driver={driver}
          onChange={(next) => updateParams({ vehicle: next.vehicle, driver: next.driver })}
        />
      </div>

      {/* The summary endpoint not shipped yet (404) means nothing to show:
          no box at all, rather than a dashed "being built" panel above a
          second one in the tab. */}
      {summaryError?.status === 404 ? null : (
        <div className="mb-4">
          <IntelligenceDataState
            loading={summaryLoading}
            error={summaryError}
            held={summary?.held ? summary.why : null}
            what="The summary of this period"
            onRetry={refetchSummary}
          >
            <IntelligenceSummaryTiles tiles={summary?.tiles ?? []} />
          </IntelligenceDataState>
        </div>
      )}

      <Tabs value={active} onValueChange={(value) => updateParams({ tab: value })}>
        <TabsList className="flex-wrap">
          {INTELLIGENCE_TABS.map((tab) => (
            <Tooltip key={tab.id} delay={300}>
              <TooltipTrigger
                render={
                  <TabsTrigger value={tab.id} className="normal-case">
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

        <TabsContent value="issues">
          <Suspense fallback={TAB_FALLBACK}>
            <IssuesTab from={from} to={to} />
          </Suspense>
        </TabsContent>

        <TabsContent value="vehicles">
          <Suspense fallback={TAB_FALLBACK}>
            <ReportCardsTab subject="vehicle" from={from} to={to} />
          </Suspense>
        </TabsContent>

        <TabsContent value="drivers">
          <Suspense fallback={TAB_FALLBACK}>
            <ReportCardsTab subject="driver" from={from} to={to} />
          </Suspense>
        </TabsContent>

        <TabsContent value="runs">
          <Suspense fallback={TAB_FALLBACK}>
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
          <Suspense fallback={TAB_FALLBACK}>
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
