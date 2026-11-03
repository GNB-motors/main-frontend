import { useMemo, useState } from 'react';
import useApi from '../../hooks/useApi';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import { useLivePositions } from '../../hooks/useLivePositions';
import { useFleetLink } from '../../contexts/fleetLinkContext';
import { fleetViewService } from '../../services/fleetViewService';
import { AutoTripService } from '../../services/AutoTripService';
import { getVehicleList, invalidateVehicleList } from '../../services/vehicleListService';
import { istDayString } from '../../utils/dateUtils';
import useFleetVehicles from '../LiveTracking/useFleetVehicles';
import FleetOperationsOverview from './FleetOperationsOverview';
import ReleaseDigest from './ReleaseDigest';
import { buildFuelTrend, shiftDay } from './fleetOverviewModel';
import './FleetOverview.css';

const EMPTY_META = {};

export default function DailyDigestPage() {
  useFullPageLayout();
  const [date, setDate] = useState(() => istDayString(new Date()));
  const report = useApi(
    async (signal) => ({
      payload: await fleetViewService.getDigest({ date, signal }),
      readAt: Date.now(),
    }),
    [date],
    { scopeKey: date },
  );
  const live = useLivePositions();
  const accounts = useFleetLink();
  const inventory = useApi((signal) => getVehicleList({ signal }), []);
  // One response supplies the exact live KPI total and a bounded route preview.
  const trips = useApi(
    (signal) => AutoTripService.list({ status: 'OPEN', limit: 50 }, { signal }),
    [],
  );
  const fuel = useApi(
    (signal) =>
      fleetViewService.getMileage({
        groupBy: 'cycle',
        from: shiftDay(date, -6),
        to: date,
        signal,
      }),
    [date],
    { scopeKey: date },
  );
  const fuelTrend = useMemo(() => buildFuelTrend(fuel.data, date), [fuel.data, date]);
  const fleet = useFleetVehicles({
    rawPositions: live.positions,
    vehiclesMeta: EMPTY_META,
    filter: 'all',
    searchQuery: '',
    selectedId: null,
  });

  const refresh = (legacyRefresh) => {
    if (report.error?.status !== 404) report.refetch();
    legacyRefresh?.();
    invalidateVehicleList();
    inventory.refetch();
    trips.refetch();
    fuel.refetch();
    live.refresh();
    accounts.refresh?.();
  };
  const props = {
    date,
    onDateChange: setDate,
    report,
    live,
    fleet,
    inventory,
    trips,
    fuel,
    fuelTrend,
    accounts,
  };

  if (report.error?.status === 404 && date === istDayString(new Date())) {
    return (
      <ReleaseDigest
        renderOverview={(legacy) => (
          <FleetOperationsOverview
            {...props}
            legacy={legacy}
            onRefresh={() => refresh(legacy.refresh)}
          />
        )}
      />
    );
  }
  return <FleetOperationsOverview {...props} onRefresh={() => refresh()} />;
}
