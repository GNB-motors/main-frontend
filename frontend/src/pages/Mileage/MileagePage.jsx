import ManufacturerFilter from '../../components/filters/ManufacturerFilter';
import useManufacturerFilter from '../../hooks/useManufacturerFilter';
import React, { Suspense, lazy, useDeferredValue, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Camera, PenLine, Search, X } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import { Skeleton } from '../../components/ui/skeleton.jsx';
import HubDateBar from './components/HubDateBar';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session.js';
import LiveRefuelTab from './components/LiveRefuelTab';
import MileageKpiBar from './components/MileageKpiBar';
import RefuelDetailDrawer from './components/RefuelDetailDrawer';
import MileageCyclesDrawer from './components/MileageCyclesDrawer';
import AddBillPhotoDialog from './AddBillPhotoDialog';
import { hubRangeFromParams } from './mileageDates';
import './MileagePage.css';

// The pre-hub pages, mounted as hub views rather than re-implemented.
const FuelComparisonPage = lazy(() => import('../FuelComparison/FuelComparisonPage.jsx'));
const ModelComparisonPage = lazy(() => import('../MileageTracking/ModelComparisonPage.jsx'));

// The tabs that are not open are loaded when they are opened, so the page the
// owner lands on carries neither their code nor their data.
const ReconciliationTab = lazy(() => import('./components/ReconciliationTab'));
const CompletedCyclesSubtab = lazy(() => import('./components/CompletedCyclesSubtab'));
const PumpLedgerView = lazy(() => import('./components/PumpLedgerView'));
const ByTruckMileageView = lazy(() => import('./components/ByTruckMileageView'));
const FillToFillView = lazy(() => import('./components/FillToFillView'));
const ExpectedFuelView = lazy(() => import('./components/ExpectedFuelView'));
const FleetRollupView = lazy(() => import('./components/FleetRollupView'));

/**
 * Which hub surfaces a viewer gets: each view follows the gate of the
 * endpoint it reads, so it is never shown just to 404/403. Most fuel reads are
 * OWNER/MANAGER only; the fill list is open to any signed-in user.
 */
function hubAccess(canAccess, role) {
  const manages = ['OWNER', 'MANAGER'].includes(role);
  const integrity = canAccess('fuelIntegrity') && manages; // records, pump-ledger
  const ecu = canAccess('fuelComparison') && manages; // /api/extension comparisons
  const mileage = canAccess('vehicleActivity'); // model-comparison
  return {
    tabs: {
      live: true,
      reconciliation: integrity || ecu,
      performance: mileage,
    },
    views: {
      reconciliation: [integrity && 'tank', integrity && 'pumps', ecu && 'ecu'].filter(Boolean),
      performance: [
        'vehicles',
        'fleet',
        'cycles',
        'models',
        canAccess('fuelModel') && manages && 'expected',
      ].filter(Boolean),
    },
    fleetMileage: mileage,
    fuelCycles: canAccess('autoTrips') && manages, // /api/reports/fuel-cycles
    editBills: mileage && manages, // PUT/DELETE /api/mileage/fuel-log/:id
  };
}

// URL keys stay as they were so old links and redirects keep landing here.
const TABS = [
  { key: 'live', label: 'Diesel fills', hint: 'bills + tank' },
  { key: 'reconciliation', label: 'Bill check', hint: 'is the bill right?' },
  { key: 'performance', label: 'Mileage', hint: 'km per litre' },
];

const SUBVIEWS = {
  live: {
    param: 'subtab',
    options: [
      {
        key: 'stream',
        label: 'Every fill',
        note: 'Each time diesel went into a truck: from the bill, the tank sensor or both.',
      },
      {
        key: 'completed',
        label: 'Full tank to full tank',
        note: 'Distance and diesel between two full-tank fills. Mileage comes from these.',
      },
    ],
  },
  reconciliation: {
    param: 'view',
    options: [
      { key: 'tank', label: 'Bill vs tank', note: 'Did the diesel on the bill reach the tank?' },
      {
        key: 'pumps',
        label: 'Pumps',
        note: 'Which pumps give less diesel than they bill, over many fills.',
      },
      {
        key: 'ecu',
        label: 'Bill vs engine',
        note: 'Diesel billed against what the engine burned between two fills.',
      },
    ],
  },
  performance: {
    param: 'view',
    options: [
      {
        key: 'vehicles',
        label: 'By truck',
        note: 'km per litre and DEF for every truck in these dates.',
      },
      {
        key: 'fleet',
        label: 'Fleet',
        note: 'One km/L for the whole fleet, checked against the engine.',
      },
      {
        key: 'cycles',
        label: 'Fill to fill (reconciled)',
        note: 'Cycles checked against your oil report.',
      },
      { key: 'models', label: 'By model', note: 'Which truck model gives the best mileage.' },
      {
        key: 'expected',
        label: 'Used vs should use',
        note: 'Diesel used each day against what that driving should have needed.',
      },
    ],
  },
};

/** The shape of the hub while the page's own permissions are still loading. */
const HubSkeleton = () => (
  <div className="mhub" aria-busy="true" aria-label="Loading the hub">
    <div className="mhub-kpis">
      {[0, 1, 2].map((tile) => (
        <div className="mhub-kpi" key={tile}>
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
    <Skeleton className="mhub-tab-skel" />
    <Skeleton className="mhub-body-skel" />
  </div>
);

/** The shape of a tab whose code is still on its way. */
const TabSkeleton = () => (
  <div aria-busy="true" aria-label="Loading this section">
    <Skeleton className="mhub-body-skel" />
  </div>
);

export default function MileagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canAccess, ready } = useFeatureFlags();
  const access = hubAccess(canAccess, getUserRole());

  const requestedTab = searchParams.get('tab') || 'live';
  const activeTab = access.tabs[requestedTab] ? requestedTab : 'live';

  // The fleet km/L figure needs the model comparison: it is the slowest read
  // on this page, so it is read when the performance tab is open instead of on
  // the way in. Until then the tile says where the number lives.
  const canShowFleetKmL = Boolean(access.fleetMileage && access.tabs.performance);
  const showFleetKmL = canShowFleetKmL && activeTab === 'performance';
  const showFleetKmLHint = canShowFleetKmL && !showFleetKmL;

  const subview = SUBVIEWS[activeTab];
  const allowedSubviews = subview.options.filter(
    (o) => !access.views[activeTab] || access.views[activeTab].includes(o.key),
  );
  const requestedSubview = searchParams.get(subview.param);
  const active =
    allowedSubviews.find((o) => o.key === requestedSubview) || allowedSubviews[0] || null;
  const activeSubview = active?.key;

  // One range and one search for every tab; both live in the URL.
  const { manufacturer, setManufacturer } = useManufacturerFilter();
  const { preset, range: dateRange } = hubRangeFromParams(searchParams);
  const range = { ...dateRange, manufacturer };
  const search = searchParams.get('search') || '';
  const deferredSearch = useDeferredValue(search);

  const [drawerDetail, setDrawerDetail] = useState(null);
  useEffect(() => setDrawerDetail(null), [manufacturer]);
  // The truck whose fill-to-fill cycles the drawer is showing.
  const [cyclesTruck, setCyclesTruck] = useState(null);
  // Bumped after a bill is edited or deleted so the list and tiles refetch.
  const [refreshKey, setRefreshKey] = useState(0);
  // The photo bill dialog (F11). The by-hand form is still there.
  const [billPhotoOpen, setBillPhotoOpen] = useState(false);

  const updateParams = (patch, { replace = false } = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace });
  };

  const openPerformanceTab = () => updateParams({ tab: 'performance', subtab: null, view: null });

  const choosePreset = (key) => updateParams({ dates: key, from: null, to: null });
  const changeRange = (patch) => {
    const next = { ...range, ...patch };
    if (!next.from || !next.to || next.from > next.to) return;
    updateParams({ dates: null, from: next.from, to: next.to });
  };

  // Only the fill list's search reaches past the truck number.
  const searchHint =
    activeSubview === 'stream'
      ? 'Truck, driver, phone or pump'
      : activeSubview === 'pumps'
        ? 'Pump or highway'
        : 'Truck number';

  return (
    <>
      <PageShell
        title="Diesel & Mileage"
        subtitle="Every diesel fill, whether its bill is right, and how far each truck goes on a litre."
        actions={
          <div className="mhub-top-actions">
            <label className="mhub-search">
              <Search size={15} className="mhub-search-icon" aria-hidden />
              <input
                type="search"
                aria-label={searchHint}
                placeholder={searchHint}
                value={search}
                onChange={(e) => updateParams({ search: e.target.value }, { replace: true })}
              />
              {search ? (
                <button
                  type="button"
                  className="mhub-search-clear"
                  onClick={() => updateParams({ search: '' }, { replace: true })}
                  aria-label="Clear search"
                >
                  <X size={13} aria-hidden />
                </button>
              ) : null}
            </label>
            {ready && access.fleetMileage ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBillPhotoOpen(true)}
                  className="pshell-btn pshell-btn--primary mhub-add-btn"
                >
                  <Camera size={15} aria-hidden /> Add bill photo
                </button>
                {/* The by-hand form stays reachable: a route is never deleted. */}
                <Link
                  to="/mileage-tracking/new"
                  className="pshell-btn mhub-add-btn mhub-by-hand-btn"
                >
                  <PenLine size={15} aria-hidden /> Enter by hand
                </Link>
              </div>
            ) : null}
          </div>
        }
        filters={
          <div className="manufacturer-scope-row">
            <HubDateBar
              preset={preset}
              range={range}
              onPreset={choosePreset}
              onRange={changeRange}
            />
            <ManufacturerFilter
              value={manufacturer}
              onChange={(value) => {
                setDrawerDetail(null);
                setManufacturer(value);
              }}
            />
          </div>
        }
      >
        {ready ? (
          <div className="mhub" key={manufacturer}>
            <MileageKpiBar
              range={range}
              showFleetKmL={showFleetKmL}
              showFleetKmLHint={showFleetKmLHint}
              onOpenPerformance={openPerformanceTab}
              refreshKey={refreshKey}
            />

            <div className="mhub-tabs" role="tablist" aria-label="Section">
              {TABS.filter((t) => access.tabs[t.key]).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === t.key}
                  className="mhub-tab"
                  title={t.hint}
                  onClick={() => updateParams({ tab: t.key, subtab: null, view: null })}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mhub-subrow">
              {allowedSubviews.length > 1 && (
                <div className="mhub-views" role="tablist" aria-label="View">
                  {allowedSubviews.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      role="tab"
                      aria-selected={activeSubview === o.key}
                      className="mhub-view"
                      onClick={() => updateParams({ [subview.param]: o.key })}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {active && <p className="mhub-note">{active.note}</p>}
            </div>

            {activeTab === 'live' && activeSubview === 'stream' && (
              <LiveRefuelTab
                range={range}
                searchQuery={deferredSearch}
                onOpenDrawer={setDrawerDetail}
                refreshKey={refreshKey}
              />
            )}
            <Suspense fallback={<TabSkeleton />}>
              {activeTab === 'live' && activeSubview === 'completed' && (
                <CompletedCyclesSubtab
                  range={range}
                  searchQuery={deferredSearch}
                  fuelCyclesAllowed={access.fuelCycles}
                />
              )}
              {activeTab === 'reconciliation' && activeSubview === 'tank' && (
                <ReconciliationTab
                  range={range}
                  searchQuery={deferredSearch}
                  onOpenDrawer={setDrawerDetail}
                />
              )}
              {activeTab === 'reconciliation' && activeSubview === 'pumps' && (
                <PumpLedgerView range={range} searchQuery={deferredSearch} />
              )}
              {activeTab === 'performance' && activeSubview === 'vehicles' && (
                <ByTruckMileageView
                  range={range}
                  searchQuery={deferredSearch}
                  onOpenCycles={setCyclesTruck}
                />
              )}
              {activeTab === 'performance' && activeSubview === 'fleet' && (
                <FleetRollupView range={range} />
              )}
              {activeTab === 'performance' && activeSubview === 'cycles' && (
                <FillToFillView
                  range={range}
                  searchQuery={deferredSearch}
                  onOpenCycles={setCyclesTruck}
                />
              )}
              {activeTab === 'performance' && activeSubview === 'expected' && (
                <ExpectedFuelView range={range} />
              )}
              {activeTab === 'reconciliation' && activeSubview === 'ecu' && (
                <FuelComparisonPage embedded range={range} />
              )}
              {activeTab === 'performance' && activeSubview === 'models' && (
                <ModelComparisonPage embedded range={range} />
              )}
            </Suspense>
          </div>
        ) : (
          <HubSkeleton />
        )}

        <RefuelDetailDrawer
          detail={drawerDetail}
          onClose={() => setDrawerDetail(null)}
          canEdit={access.editBills}
          onChanged={() => {
            setDrawerDetail(null);
            setRefreshKey((k) => k + 1);
          }}
        />

        <MileageCyclesDrawer
          truck={cyclesTruck}
          range={range}
          onClose={() => setCyclesTruck(null)}
        />

        <AddBillPhotoDialog
          open={billPhotoOpen}
          onOpenChange={setBillPhotoOpen}
          onConfirmed={() => setRefreshKey((key) => key + 1)}
        />
      </PageShell>
    </>
  );
}
