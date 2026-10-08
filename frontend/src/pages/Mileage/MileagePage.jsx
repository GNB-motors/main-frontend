import React, { Suspense, lazy, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Fuel, GitCompare, TrendingUp, Search, Plus } from 'lucide-react';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import LiveRefuelTab from './components/LiveRefuelTab';
import ReconciliationTab from './components/ReconciliationTab';
import CompletedCyclesSubtab from './components/CompletedCyclesSubtab';
import MileageKpiBar from './components/MileageKpiBar';
import RefuelDetailDrawer from './components/RefuelDetailDrawer';
import './MileagePage.css';

// The pre-hub pages, mounted as hub views rather than re-implemented.
const FuelComparisonPage = lazy(() => import('../FuelComparison/FuelComparisonPage.jsx'));
const MileageTrackingPage = lazy(() => import('../MileageTracking/MileageTrackingPage.jsx'));
const ModelComparisonPage = lazy(() => import('../MileageTracking/ModelComparisonPage.jsx'));

/**
 * Which hub surfaces an org gets. The hub replaced three sidebar entries with
 * different flags, so each view keeps its old gate — and the backend gate of
 * the endpoint it reads (fuel-comparison/records ⇒ fuelIntegrity,
 * mileage/fleet-overview + model-comparison ⇒ vehicleActivity).
 */
function hubAccess(canAccess) {
  const tank = canAccess('fuelIntegrity');
  const ecu = canAccess('fuelComparison');
  const mileage = canAccess('vehicleActivity');
  return {
    tabs: {
      live: true,
      reconciliation: tank || ecu,
      performance: mileage,
    },
    reconciliationViews: [tank && 'tank', ecu && 'ecu'].filter(Boolean),
    fleetMileage: mileage,
  };
}

const TABS = [
  { key: 'live', label: 'Refuels', badge: 'Bills + sensor', icon: Fuel },
  { key: 'reconciliation', label: 'Reconciliation', badge: 'Audit', icon: GitCompare },
  { key: 'performance', label: 'Vehicle & Model Mileage', badge: 'Analytics', icon: TrendingUp },
];

const SUBVIEWS = {
  live: {
    param: 'subtab',
    options: [
      { key: 'stream', label: 'Refuel stream' },
      { key: 'completed', label: 'Completed refuel cycles' },
    ],
  },
  reconciliation: {
    param: 'view',
    options: [
      { key: 'tank', label: 'Bill vs tank rise (per fill)' },
      { key: 'ecu', label: 'Bill vs ECU fuel used (per refuel window)' },
    ],
  },
  performance: {
    param: 'view',
    options: [
      { key: 'vehicles', label: 'By vehicle' },
      { key: 'models', label: 'By model' },
    ],
  },
};

const EmbeddedFallback = () => (
  <div className="mileage-panel py-12 text-center text-xs text-slate-400 font-mono">Loading…</div>
);

export default function MileagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canAccess, ready } = useFeatureFlags();
  const access = hubAccess(canAccess);

  const requestedTab = searchParams.get('tab') || 'live';
  const activeTab = access.tabs[requestedTab] ? requestedTab : 'live';

  const subview = SUBVIEWS[activeTab];
  const allowedSubviews = subview.options.filter(
    (o) => activeTab !== 'reconciliation' || access.reconciliationViews.includes(o.key),
  );
  const requestedSubview = searchParams.get(subview.param);
  const activeSubview = allowedSubviews.some((o) => o.key === requestedSubview)
    ? requestedSubview
    : allowedSubviews[0]?.key;

  // The tabs read the submitted search (URL), never the half-typed input.
  const search = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState(search);
  const [syncedSearch, setSyncedSearch] = useState(search);
  if (syncedSearch !== search) {
    setSyncedSearch(search);
    setSearchInput(search);
  }

  const [drawerDetail, setDrawerDetail] = useState(null);

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput.trim() });
  };

  // Embedded pages bring their own search box.
  const usesHubSearch =
    activeTab === 'live' || (activeTab === 'reconciliation' && activeSubview === 'tank');

  // Only the refuel stream's search reaches beyond the plate.
  const searchHint =
    activeSubview === 'stream'
      ? 'Search vehicle, station, or driver...'
      : 'Search vehicle plate...';

  return (
    <div className="mileage-hub">
      <div className="mileage-header">
        <div className="mileage-title-block">
          <h1>Mileage & Refuel Command Center</h1>
          <p>Fuel bills, tank-sensor refills and refuel-to-refuel mileage in one place.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {usesHubSearch && (
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  aria-label={searchHint}
                  placeholder={searchHint}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 w-64 outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition cursor-pointer"
              >
                Search
              </button>
            </form>
          )}
          {ready && access.fleetMileage && (
            <Link
              to="/mileage-tracking/new"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Log fuel
            </Link>
          )}
        </div>
      </div>

      {ready && (
        <>
          <MileageKpiBar showFleetMileage={access.fleetMileage} />

          <div className="mileage-tab-nav">
            {TABS.filter((t) => access.tabs[t.key]).map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => updateParams({ tab: tab.key, subtab: null, view: null })}
                  className={`mileage-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <span className="mileage-tab-badge">{tab.badge}</span>
                </button>
              );
            })}
          </div>

          {allowedSubviews.length > 1 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {allowedSubviews.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => updateParams({ [subview.param]: o.key })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeSubview === o.key
                      ? 'bg-slate-900 text-white dark:bg-indigo-600'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'live' && activeSubview === 'stream' && (
            <LiveRefuelTab searchQuery={search} onOpenDrawer={setDrawerDetail} />
          )}

          {activeTab === 'live' && activeSubview === 'completed' && (
            <CompletedCyclesSubtab searchQuery={search} />
          )}

          {activeTab === 'reconciliation' && activeSubview === 'tank' && (
            <ReconciliationTab searchQuery={search} onOpenDrawer={setDrawerDetail} />
          )}

          <div className="mileage-embedded">
            <Suspense fallback={<EmbeddedFallback />}>
              {activeTab === 'reconciliation' && activeSubview === 'ecu' && (
                <FuelComparisonPage embedded />
              )}
              {activeTab === 'performance' && activeSubview === 'vehicles' && (
                <MileageTrackingPage embedded />
              )}
              {activeTab === 'performance' && activeSubview === 'models' && (
                <ModelComparisonPage embedded />
              )}
            </Suspense>
          </div>
        </>
      )}

      <RefuelDetailDrawer detail={drawerDetail} onClose={() => setDrawerDetail(null)} />
    </div>
  );
}
