import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFullPageLayout } from '@/hooks/usePageLayout';
import IntelligenceFilters from '../Intelligence/IntelligenceFilters';
import IntelligencePeriodPicker from '../Intelligence/IntelligencePeriodPicker';
import IntelligenceSkeleton from '../Intelligence/IntelligenceSkeleton';
import { tabById } from '../Intelligence/intelligenceTabs';
import { periodDates, periodRangeLabel, resolvePeriod } from '../Intelligence/intelligenceModel';
import '../Intelligence/reportCardsReference.css';
import '../Intelligence/IntelligencePage.css';
import '../Intelligence/IntelligenceDesign.css';

const IdlingTab = lazy(() => import('../Intelligence/IdlingTab'));
const FuelRiskTab = lazy(() => import('../Intelligence/FuelRiskTab'));
const MileageDefTab = lazy(() => import('../Intelligence/MileageDefTab'));

/** Which tab component each Fuel Management page shows, and whether it filters by driver. */
const PAGES = {
  idling: { Tab: IdlingTab, driver: true },
  fuel: { Tab: FuelRiskTab, driver: true },
  mileage: { Tab: MileageDefTab, driver: false },
};

/**
 * One former Intelligence tab (Idling, Fuel checks, Mileage & DEF) as its own
 * page under Fuel Management. The truck, driver and dates stay in the URL
 * with the same names as before, so every old link keeps its filters.
 */
export default function FuelInsightPage({ tab }) {
  useFullPageLayout();
  const [searchParams, setSearchParams] = useSearchParams();
  const vehicle = searchParams.get('vehicle') ?? '';
  const driver = searchParams.get('driver') ?? '';
  const period = resolvePeriod({ from: searchParams.get('from'), to: searchParams.get('to') });
  const { from, to } = period;
  const meta = tabById(tab);
  const page = PAGES[tab];

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  return (
    <div className="intelligence-page min-w-0 w-full">
      <header className="intel-header">
        <div className="min-w-0">
          <h1 className="intel-title">{meta?.label}</h1>
          <p className="intel-subtitle">
            {meta?.hint}
            <span className="intel-subtitle-period">{periodRangeLabel(from, to)}</span>
          </p>
        </div>
        <div className="intel-header-controls">
          <IntelligenceFilters
            showVehicle
            showDriver={page.driver}
            vehicle={vehicle}
            driver={driver}
            onChange={(next) =>
              updateParams({ vehicle: next.vehicle, driver: page.driver ? next.driver : null })
            }
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
      <div role="tabpanel" aria-label={meta?.label} className="intel-panel">
        <Suspense fallback={<IntelligenceSkeleton variant="cards" count={2} />}>
          <page.Tab
            key={`${tab}-${from}-${to}-${vehicle}-${driver}`}
            from={from}
            to={to}
            vehicle={vehicle}
            driver={page.driver ? driver : undefined}
          />
        </Suspense>
      </div>
    </div>
  );
}
