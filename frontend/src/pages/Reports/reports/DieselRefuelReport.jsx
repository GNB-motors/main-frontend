import React, { useDeferredValue, useState } from 'react';
import { Search, X } from 'lucide-react';
import PageShell from '../../../components/ui/PageShell';
import HubDateBar from '../../Mileage/components/HubDateBar';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../../utils/session.js';
import LiveRefuelTab from '../../Mileage/components/LiveRefuelTab';
import RefuelDetailDrawer from '../../Mileage/components/RefuelDetailDrawer';
import { DEFAULT_PRESET, presetRange } from '../../Mileage/mileageRows';
import '../../Mileage/MileagePage.css';

/**
 * Reports → Diesel Report: the Diesel & Mileage hub's fill list with fuelType
 * fixed to DIESEL, instead of the old RefuelLogsPage and its legacy
 * GET /api/fuel-logs.
 */
export default function DieselRefuelReport() {
  const { canAccess } = useFeatureFlags();
  const manages = ['OWNER', 'MANAGER'].includes(getUserRole());
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [preset, setPreset] = useState(DEFAULT_PRESET);
  const [range, setRange] = useState(() => presetRange(DEFAULT_PRESET));
  const [drawerDetail, setDrawerDetail] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <PageShell
      title="Diesel Report"
      subtitle="Every diesel fill: the bill, what reached the tank, and whether they match."
      actions={
        <div className="mhub-top-actions">
          <label className="mhub-search">
            <Search size={15} className="mhub-search-icon" aria-hidden />
            <input
              type="search"
              aria-label="Truck number, driver, phone or pump"
              placeholder="Truck number, driver, phone or pump"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search ? (
              <button
                type="button"
                className="mhub-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X size={13} aria-hidden />
              </button>
            ) : null}
          </label>
        </div>
      }
      filters={
        <HubDateBar
          preset={preset}
          range={range}
          onPreset={(key) => {
            setPreset(key);
            setRange(presetRange(key));
          }}
          onRange={(next) => {
            setPreset(null);
            setRange(next);
          }}
        />
      }
    >
      <LiveRefuelTab
        range={range}
        searchQuery={deferredSearch}
        fuelType="DIESEL"
        onOpenDrawer={setDrawerDetail}
        refreshKey={refreshKey}
      />
      <RefuelDetailDrawer
        detail={drawerDetail}
        onClose={() => setDrawerDetail(null)}
        canEdit={canAccess('vehicleActivity') && manages}
        onChanged={() => {
          setDrawerDetail(null);
          setRefreshKey((k) => k + 1);
        }}
      />
    </PageShell>
  );
}
