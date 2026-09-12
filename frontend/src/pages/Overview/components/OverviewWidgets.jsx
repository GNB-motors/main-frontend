import { useMemo } from 'react';
import { MetricTile } from '../../../components/ui/metric-tile';
import { Skeleton } from '../../../components/ui/skeleton';
import useApi from '../../../hooks/useApi';
import { OverviewWidgetsService } from '../overviewWidgetsService';
import {
  mapFleetNowTile,
  mapNeedsTodayTile,
  mapIdlingWasteTile,
  mapFuelSpendTile,
  COST_PER_KM_TILE,
} from '../overviewWidgetsLogic';

const THIRTY_DAYS_MS = 30 * 24 * 3600 * 1000;

/**
 * OverviewWidgets — the five GNB Dashboard artboard tiles (Workstream H step 4)
 * rendered on the MetricTile honest-state chassis. Every tile derives its
 * state from a real endpoint response via overviewWidgetsLogic; none of them
 * fabricates a number. Cost per km is statically not-set-up because no
 * endpoint serves it.
 *
 * The page itself is route-level lazy, so this group costs no eager JS.
 */
const OverviewWidgets = ({ selectedDays = 30 }) => {
  // The aggregate tiles (idling, fuel) follow the page's range switcher. They
  // used to pin their own 30-day window, which read as "no data" whenever the
  // fleet's most recent records fell outside it while the panels below — on the
  // page's own range — showed spend for the same fleet. Two contradictory
  // answers on one screen; the window was wrong, not the data.
  const windowParams = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - selectedDays * 24 * 3600 * 1000);
    const startDate = from.toISOString();
    const endDate = to.toISOString();
    return { idling: { startDate, endDate }, fuel: { from: startDate, to: endDate } };
  }, [selectedDays]);

  const fleet = useApi((signal) => OverviewWidgetsService.getFleetPositions({ signal }), []);
  const needs = useApi((signal) => OverviewWidgetsService.getNeedsToday({ signal }), []);
  const idling = useApi(
    (signal) => OverviewWidgetsService.getIdlingSummary(windowParams.idling, { signal }),
    [windowParams],
  );
  const fuel = useApi(
    (signal) => OverviewWidgetsService.getFuelSpendSummary(windowParams.fuel, { signal }),
    [windowParams],
  );

  // First paint of a tile: skeleton. After that the mapper owns the state —
  // a refetch failure maps to `error` (or the 403/404 states), never a blank.
  const renderTile = (result, mapper) =>
    result.loading && !result.data && !result.error ? (
      <Skeleton className="h-44 w-full rounded-xl" />
    ) : (
      <MetricTile {...mapper({ data: result.data, error: result.error })} />
    );

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {renderTile(fleet, mapFleetNowTile)}
      {renderTile(needs, mapNeedsTodayTile)}
      {renderTile(idling, mapIdlingWasteTile)}
      {renderTile(fuel, mapFuelSpendTile)}
      <MetricTile {...COST_PER_KM_TILE} />
    </div>
  );
};

export default OverviewWidgets;
