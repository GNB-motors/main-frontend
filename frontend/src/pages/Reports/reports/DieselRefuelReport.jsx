import ManufacturerFilter from '../../../components/filters/ManufacturerFilter';
import useManufacturerFilter from '../../../hooks/useManufacturerFilter';
import React, { useEffect, useState } from 'react';
import { AlertTriangle, Fuel, IndianRupee, ReceiptText } from 'lucide-react';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { getUserRole } from '../../../utils/session.js';
import { formatINR, formatNum } from '../../../utils/formatters';
import LiveRefuelTab from '../../Mileage/components/LiveRefuelTab';
import RefuelDetailDrawer from '../../Mileage/components/RefuelDetailDrawer';
import ReportFrame, { ReportClear, ReportDateRange, ReportSearch } from './ReportFrame';
import { VehiclePicker } from './ReportEntityPicker';
import { istDaysAgo, istToday } from './reportFilters';
import '../../Mileage/MileagePage.css';

// The last 30 IST days, today included — the hub's default window.
const defaultRange = () => ({ from: istDaysAgo(29), to: istToday() });

function feedKpis(meta) {
  if (!meta) return null;
  const verified = meta.verified || 0;
  const flagged = meta.flagged || 0;
  const unverified = meta.unverified || 0;
  const fills = verified + flagged + unverified + (meta.slipOnly || 0);
  return [
    {
      label: 'Fills',
      value: formatNum(fills),
      icon: Fuel,
      hint: `${formatNum(verified)} with a bill that matches the tank`,
    },
    { label: 'Fuel spend', value: formatINR(meta.totalSpendInr), icon: IndianRupee, tone: 'teal' },
    {
      label: 'Bills to check',
      value: formatNum(flagged),
      icon: AlertTriangle,
      tone: 'orange',
      hint: 'The bill and the tank reading disagree',
    },
    {
      label: 'Bills missing',
      value: formatNum(unverified),
      icon: ReceiptText,
      tone: 'red',
      hint: 'The tank rose but no bill was logged',
    },
  ];
}

/**
 * Reports → Diesel Report: the Diesel & Mileage hub's fill list with fuelType
 * fixed to DIESEL, instead of the old RefuelLogsPage and its legacy
 * GET /api/fuel-logs.
 */
export default function DieselRefuelReport() {
  const { canAccess } = useFeatureFlags();
  const manages = ['OWNER', 'MANAGER'].includes(getUserRole());
  const { manufacturer, setManufacturer } = useManufacturerFilter();
  const [range, setRange] = useState(defaultRange);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [vehicleId, setVehicleId] = useState('all');
  const [feedMeta, setFeedMeta] = useState(null);
  const [drawerDetail, setDrawerDetail] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    setFeedMeta(null);
    setDrawerDetail(null);
  }, [manufacturer]);

  const defaults = defaultRange();
  const activeFilters =
    (manufacturer ? 1 : 0) +
    (range.from !== defaults.from ? 1 : 0) +
    (range.to !== defaults.to ? 1 : 0) +
    (search ? 1 : 0) +
    (vehicleId !== 'all' ? 1 : 0);

  return (
    <ReportFrame
      layout="stacked"
      title="Diesel Report"
      subtitle="Every diesel fill: the bill, what reached the tank, and whether they match."
      filters={
        <>
          <ReportDateRange from={range.from} to={range.to} onChange={setRange} />
          <ManufacturerFilter value={manufacturer} onChange={setManufacturer} />
          <VehiclePicker value={vehicleId} onChange={setVehicleId} />
          <ReportSearch
            value={search}
            onChange={setSearch}
            placeholder="Search truck, driver or pump"
          />
          <ReportClear
            active={activeFilters > 0}
            onClear={() => {
              setRange(defaultRange());
              setSearch('');
              setManufacturer('');
              setVehicleId('all');
            }}
          />
        </>
      }
      kpis={feedKpis(feedMeta)}
    >
      <LiveRefuelTab
        key={manufacturer}
        range={{ ...range, manufacturer }}
        searchQuery={debouncedSearch}
        fuelType="DIESEL"
        vehicleId={vehicleId === 'all' ? null : vehicleId}
        onMeta={setFeedMeta}
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
    </ReportFrame>
  );
}
