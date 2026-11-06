import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import IntelligenceSkeleton from './IntelligenceSkeleton';
import { useApi } from '@/hooks/useApi';
import { useFullPageLayout } from '@/hooks/usePageLayout';
import IntelligencePeriodPicker from './IntelligencePeriodPicker';
import IntelligenceFilters from './IntelligenceFilters';
import IntelligenceOverview from './IntelligenceOverview';
import IntelligenceSummaryTiles from './IntelligenceSummaryTiles';
import IntelligenceService from './IntelligenceService';
import {
  INSTANCE_TABS,
  INTELLIGENCE_SECTIONS,
  resolveIntelligenceTab,
  sectionOfTab,
  tabById,
} from './intelligenceTabs';
import { periodDates, periodRangeLabel, resolvePeriod } from './intelligenceModel';
import './IntelligencePage.css';
import './IntelligenceDesign.css';

const IssuesTab = lazy(() => import('./IssuesTab'));
const ReportCardsTab = lazy(() => import('./ReportCardsTab'));
const RunsTab = lazy(() => import('./RunsTab'));
const InstancesTab = lazy(() => import('./InstancesTab'));
const MileageDefTab = lazy(() => import('./MileageDefTab'));
const PlacesTab = lazy(() => import('./PlacesTab'));
const IdlingTab = lazy(() => import('./IdlingTab'));
const FuelRiskTab = lazy(() => import('./FuelRiskTab'));
const OverspeedTab = lazy(() => import('./OverspeedTab'));
const DetoursTab = lazy(() => import('./DetoursTab'));

/** The shape of a tab while its code is still being fetched. */
const TAB_FALLBACK = <IntelligenceSkeleton variant="table" />;

/** The tabs that always cover the whole fleet. */
const FLEET_ONLY_TABS = ['runs', 'places'];

function TabContent({ active, from, to, vehicle, driver, kind }) {
  if (active === 'issues') {
    return (
      <Suspense fallback={<IntelligenceSkeleton />}>
        <IssuesTab
          key={`${from}:${to}:${vehicle}:${kind}`}
          from={from}
          to={to}
          vehicle={vehicle}
          kind={kind}
        />
      </Suspense>
    );
  }
  if (active === 'vehicles' || active === 'drivers') {
    const subject = active === 'vehicles' ? 'vehicle' : 'driver';
    return (
      <Suspense fallback={TAB_FALLBACK}>
        <ReportCardsTab
          key={`${active}:${from}:${to}:${vehicle}:${driver}`}
          subject={subject}
          from={from}
          to={to}
          vehicle={vehicle}
          driver={driver}
        />
      </Suspense>
    );
  }
  if (active === 'runs') {
    return (
      <Suspense fallback={<IntelligenceSkeleton variant="metrics" count={3} />}>
        <RunsTab from={from} to={to} />
      </Suspense>
    );
  }
  if (active === 'mileage') {
    return (
      <Suspense fallback={<IntelligenceSkeleton variant="cards" count={2} />}>
        <MileageDefTab from={from} to={to} vehicle={vehicle} />
      </Suspense>
    );
  }
  if (active === 'places') {
    return (
      <Suspense fallback={TAB_FALLBACK}>
        <PlacesTab from={from} to={to} />
      </Suspense>
    );
  }
  if (active === 'idling') {
    return (
      <Suspense fallback={TAB_FALLBACK}>
        <IdlingTab
          key={`idling-${from}-${to}-${vehicle}-${driver}`}
          from={from}
          to={to}
          vehicle={vehicle}
          driver={driver}
        />
      </Suspense>
    );
  }
  if (active === 'fuel') {
    return (
      <Suspense fallback={TAB_FALLBACK}>
        <FuelRiskTab
          key={`fuel-${from}-${to}-${vehicle}-${driver}`}
          from={from}
          to={to}
          vehicle={vehicle}
          driver={driver}
        />
      </Suspense>
    );
  }
  if (active === 'overspeed') {
    return (
      <Suspense fallback={TAB_FALLBACK}>
        <OverspeedTab
          key={`overspeed-${from}-${to}-${vehicle}-${driver}`}
          from={from}
          to={to}
          vehicle={vehicle}
          driver={driver}
        />
      </Suspense>
    );
  }
  if (active === 'detours') {
    return (
      <Suspense fallback={TAB_FALLBACK}>
        <DetoursTab
          key={`detours-${from}-${to}-${vehicle}-${driver}`}
          from={from}
          to={to}
          vehicle={vehicle}
          driver={driver}
        />
      </Suspense>
    );
  }
  if (Object.hasOwn(INSTANCE_TABS, active)) {
    return (
      <Suspense fallback={TAB_FALLBACK}>
        <InstancesTab
          key={`${active}-${from}-${to}-${vehicle}-${driver}`}
          kind={INSTANCE_TABS[active]}
          from={from}
          to={to}
          vehicle={vehicle}
          driver={driver}
        />
      </Suspense>
    );
  }
  return null;
}

/**
 * Intelligence — what we worked out about the fleet, good and bad, with the
 * reason for every claim.
 *
 * The page answers "what needs me" first: five numbers, then the tabs in
 * five sections. The tab, the period and the filters all live in the URL,
 * so a link to a page is a link to that exact view and the Back button goes
 * back through it.
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

  const { data: summary } = useApi(
    (signal) => IntelligenceService.getSummary({ from, to, signal }),
    [from, to],
  );

  const { data: issues, loading: issuesLoading } = useApi(
    (signal) => IntelligenceService.getIssues({ from, to, signal }),
    [from, to],
  );

  const actCount = issues?.counts?.act ?? null;
  const active = resolveIntelligenceTab(requested, actCount);
  const section = sectionOfTab(active);
  const activeTab = tabById(active);
  const ActiveIcon = activeTab?.icon;
  const fleetOnly = FLEET_ONLY_TABS.includes(active);
  const openTab = (tab) => updateParams({ tab, kind: null });

  return (
    <div className="intelligence-page min-w-0 w-full">
      <header className="intel-header">
        <div className="min-w-0">
          <h1 className="intel-title">Intelligence</h1>
          <p className="intel-subtitle">
            What your trucks and drivers did, and what needs you
            <span className="intel-subtitle-period">{periodRangeLabel(from, to)}</span>
          </p>
          {summary?.tiles?.length && !summary?.held ? (
            <IntelligenceSummaryTiles tiles={summary.tiles} onOpenTab={openTab} />
          ) : null}
        </div>

        <div className="intel-header-controls">
          <IntelligenceFilters
            showVehicle={!['drivers', ...FLEET_ONLY_TABS].includes(active)}
            showDriver={active === 'drivers' || Object.hasOwn(INSTANCE_TABS, active)}
            vehicle={vehicle}
            driver={driver}
            onChange={(next) => updateParams({ vehicle: next.vehicle, driver: next.driver })}
          />
          <IntelligencePeriodPicker
            period={period}
            onPreset={(presetId) => {
              const dates = periodDates(presetId);
              updateParams({ from: dates.from, to: dates.to });
            }}
            onCustom={(range) => updateParams({ from: range.from, to: range.to })}
          />
        </div>
      </header>

      <IntelligenceOverview
        summary={summary?.held ? null : summary}
        issues={issues}
        issuesLoading={issuesLoading}
        from={from}
        to={to}
        vehicle={vehicle}
        onOpenTab={openTab}
      />

      <nav className="intel-sections" aria-label="Intelligence sections">
        <div role="tablist" aria-label="Intelligence sections" className="intel-section-list">
          {INTELLIGENCE_SECTIONS.map((entry) => {
            const selected = entry.id === section.id;
            return (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className="intel-section-tab"
                onClick={() => {
                  if (!selected) openTab(entry.tabs[0]);
                }}
              >
                {entry.label}
                {entry.id === 'issues' && actCount ? (
                  <span className="intel-section-count" aria-label={`${actCount} need you`}>
                    {actCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {section.tabs.length > 1 ? (
        <div className="intel-view-bar">
          <div role="tablist" aria-label={`${section.label} views`} className="intel-segmented">
            {section.tabs.map((id) => {
              const tab = tabById(id);
              return (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={id === active}
                  className="intel-segment"
                  onClick={() => openTab(id)}
                >
                  <tab.icon size={14} aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <header className="intel-panel-heading">
        <div className="intel-panel-heading-title">
          {ActiveIcon ? (
            <span className="intel-panel-heading-icon">
              <ActiveIcon size={17} aria-hidden="true" />
            </span>
          ) : null}
          <h2>{activeTab?.label}</h2>
          {fleetOnly ? <span className="intel-scope-badge">Whole fleet</span> : null}
        </div>
        <p>
          {activeTab?.hint}
          {fleetOnly ? ' Covers the whole fleet; the truck filter does not apply here.' : ''}
        </p>
      </header>
      <div role="tabpanel" aria-label={activeTab?.label} className="intel-panel">
        <TabContent
          active={active}
          from={from}
          to={to}
          vehicle={vehicle}
          driver={driver}
          kind={kind}
        />
      </div>
    </div>
  );
}
