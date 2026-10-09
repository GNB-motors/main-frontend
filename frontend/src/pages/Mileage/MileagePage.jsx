import React, { Suspense, lazy, useDeferredValue, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, X } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import HubDateBar from './components/HubDateBar';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session.js';
import LiveRefuelTab from './components/LiveRefuelTab';
import ReconciliationTab from './components/ReconciliationTab';
import CompletedCyclesSubtab from './components/CompletedCyclesSubtab';
import MileageKpiBar from './components/MileageKpiBar';
import RefuelDetailDrawer from './components/RefuelDetailDrawer';
import PumpLedgerView from './components/PumpLedgerView';
import ExpectedFuelView from './components/ExpectedFuelView';
import TruckMileageView from './components/TruckMileageView';
import { hubRangeFromParams } from './mileageRows';
import './MileagePage.css';

// The pre-hub pages, mounted as hub views rather than re-implemented.
const FuelComparisonPage = lazy(() => import('../FuelComparison/FuelComparisonPage.jsx'));
const ModelComparisonPage = lazy(() => import('../MileageTracking/ModelComparisonPage.jsx'));

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
      performance: ['vehicles', 'models', canAccess('fuelModel') && manages && 'expected'].filter(
        Boolean,
      ),
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
      { key: 'vehicles', label: 'By truck', note: 'Average km per litre for each truck.' },
      { key: 'models', label: 'By model', note: 'Which truck model gives the best mileage.' },
      {
        key: 'expected',
        label: 'Used vs should use',
        note: 'Diesel used each day against what that driving should have needed.',
      },
    ],
  },
};

const EmbeddedFallback = () => <div className="mhub-note">Loading…</div>;

export default function MileagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canAccess, ready } = useFeatureFlags();
  const access = hubAccess(canAccess, getUserRole());

  const requestedTab = searchParams.get('tab') || 'live';
  const activeTab = access.tabs[requestedTab] ? requestedTab : 'live';

  const subview = SUBVIEWS[activeTab];
  const allowedSubviews = subview.options.filter(
    (o) => !access.views[activeTab] || access.views[activeTab].includes(o.key),
  );
  const requestedSubview = searchParams.get(subview.param);
  const active =
    allowedSubviews.find((o) => o.key === requestedSubview) || allowedSubviews[0] || null;
  const activeSubview = active?.key;

  // One range and one search for every tab; both live in the URL.
  const { preset, range } = hubRangeFromParams(searchParams);
  const search = searchParams.get('search') || '';
  const deferredSearch = useDeferredValue(search);

  const [drawerDetail, setDrawerDetail] = useState(null);
  // Bumped after a bill is edited or deleted so the list and tiles refetch.
  const [refreshKey, setRefreshKey] = useState(0);

  const updateParams = (patch, { replace = false } = {}) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    setSearchParams(next, { replace });
  };

  const choosePreset = (key) => updateParams({ dates: key, from: null, to: null });
  const changeRange = (patch) => {
    const next = { ...range, ...patch };
    if (!next.from || !next.to || next.from > next.to) return;
    updateParams({ dates: null, from: next.from, to: next.to });
  };

  // Only the fill list's search reaches past the truck number.
  const searchHint =
    activeSubview === 'stream'
      ? 'Truck number, driver, phone or pump'
      : activeSubview === 'pumps'
        ? 'Pump or highway'
        : 'Truck number';

  return (
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
            <Link
              to="/mileage-tracking/new"
              className="pshell-btn pshell-btn--primary mhub-add-btn"
            >
              <Plus size={15} aria-hidden /> Add diesel bill
            </Link>
          ) : null}
        </div>
      }
      filters={
        <HubDateBar preset={preset} range={range} onPreset={choosePreset} onRange={changeRange} />
      }
    >
      {ready && (
        <div className="mhub">
          <MileageKpiBar
            range={range}
            showFleetMileage={access.fleetMileage}
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
                onClick={() => updateParams({ tab: t.key, subtab: null, view: null })}
              >
                {t.label}
                <span className="mhub-tab-hint" aria-hidden>
                  {t.hint}
                </span>
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
            <TruckMileageView range={range} searchQuery={deferredSearch} />
          )}
          {activeTab === 'performance' && activeSubview === 'expected' && (
            <ExpectedFuelView range={range} />
          )}

          <Suspense fallback={<EmbeddedFallback />}>
            {activeTab === 'reconciliation' && activeSubview === 'ecu' && (
              <FuelComparisonPage embedded range={range} />
            )}
            {activeTab === 'performance' && activeSubview === 'models' && (
              <ModelComparisonPage embedded range={range} />
            )}
          </Suspense>
        </div>
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
    </PageShell>
  );
}
