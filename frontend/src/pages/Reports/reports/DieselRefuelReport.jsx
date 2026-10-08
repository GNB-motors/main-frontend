import React, { useState } from 'react';
import { Search } from 'lucide-react';
import PageShell from '../../../components/ui/PageShell';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import LiveRefuelTab from '../../Mileage/components/LiveRefuelTab';
import RefuelDetailDrawer from '../../Mileage/components/RefuelDetailDrawer';
import '../../Mileage/MileagePage.css';

/**
 * Reports → Diesel Report: the /mileage hub's refuel stream with fuelType
 * fixed to DIESEL (corrected litres, glitch chip, server bill check), instead
 * of the old RefuelLogsPage and its legacy GET /api/fuel-logs.
 */
export default function DieselRefuelReport() {
  const { canAccess } = useFeatureFlags();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [drawerDetail, setDrawerDetail] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <PageShell
      title="Diesel Report"
      subtitle="Diesel bills and tank-sensor refills, with corrected litres."
      actions={
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
          }}
          className="flex items-center gap-2"
        >
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              aria-label="Search plate, driver, phone, pump"
              placeholder="Search plate, driver, phone, pump..."
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
      }
    >
      <LiveRefuelTab
        searchQuery={search}
        fuelType="DIESEL"
        onOpenDrawer={setDrawerDetail}
        refreshKey={refreshKey}
      />
      <RefuelDetailDrawer
        detail={drawerDetail}
        onClose={() => setDrawerDetail(null)}
        canEdit={canAccess('vehicleActivity')}
        onChanged={() => {
          setDrawerDetail(null);
          setRefreshKey((k) => k + 1);
        }}
      />
    </PageShell>
  );
}
