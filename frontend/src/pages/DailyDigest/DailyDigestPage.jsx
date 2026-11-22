import { useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import { useLivePositions } from '../../hooks/useLivePositions';
import { useFleetLink } from '../../contexts/fleetLinkContext';
import { fleetViewService } from '../../services/fleetViewService';
import { istDayString } from '../../utils/dateUtils';
import useFleetVehicles from '../LiveTracking/useFleetVehicles';
import FleetOperationsOverview from './FleetOperationsOverview';
import ReleaseDigest from './ReleaseDigest';
import useOwnerReport from './useOwnerReport';
import { buildFuelTrend } from './fleetOverviewModel';
import digestRouteMemory from './digestRouteMemory';
import apiMemo from '../../utils/apiMemo';
import './FleetOverview.css';

const EMPTY_META = {};
const NOOP = () => undefined;
/** What the page reads as the digest on a server known to lack the route: the 404 it would get. */
const MISSING_REPORT = Object.freeze({
  data: null,
  loading: false,
  error: Object.freeze({ status: 404 }),
  refetch: NOOP,
});

export default function DailyDigestPage() {
  useFullPageLayout();
  const [params, setParams] = useSearchParams();
  const today = istDayString(new Date());
  const requestedDate = params.get('date');
  const parsed = new Date(`${requestedDate}T12:00:00+05:30`);
  const date =
    requestedDate &&
    Number.isFinite(+parsed) &&
    istDayString(parsed) === requestedDate &&
    requestedDate <= today
      ? requestedDate
      : today;
  const setDate = (nextDate) => {
    const next = new URLSearchParams(params);
    next.set('date', nextDate);
    setParams(next);
  };

  // True only while Refresh re-runs the fetchers: each fetcher reads it
  // synchronously when it builds its request, so a click asks the server to
  // rebuild and an ordinary visit is served from its short cache.
  const freshRef = useRef(false);
  const fresh = () => freshRef.current || undefined;

  // A server without /fleet-view/digest answers 404. Once seen, skip asking
  // (and the wait for the 404) and go straight to the release digest.
  const routeMissing = digestRouteMemory.knownMissing();

  // A revisit inside the cache window (5 min today, 30 min a past day) asks
  // the server nothing: every read below is answered from this tab's memory.
  const cacheMs = apiMemo.ttlFor(date, today);
  const fullKey = `digest:${date}:full`;
  const quickKey = `digest:${date}:quick`;
  // Fresh only: an expired answer comes back marked `stale` and must not skip
  // the quick read.
  const fullHit = apiMemo.get(fullKey, cacheMs);
  const fullCached = fullHit !== undefined && !(fullHit && fullHit.stale === true);

  // The digest arrives in two parts: the quick read (every card but the
  // day's km) draws the page first, the full read follows with the km. The
  // server shares the sources both need, so this is not double work.
  const readDigest = (quick) => async (signal) => {
    const key = quick ? quickKey : fullKey;
    try {
      if (fresh()) {
        // A rebuild must not be answered with "you already have it".
        return {
          payload: await fleetViewService.getDigest({ date, quick, fresh: fresh(), signal }),
          readAt: Date.now(),
        };
      }
      // The server's tag rides along: a server whose copy is still the one we
      // hold answers 304 and we keep our copy — no rebuild, no body.
      return await apiMemo.revalidate(key, async (etag) => {
        const res = await fleetViewService.getDigestConditional({ date, quick, etag, signal });
        if (res.status === 304) return { notModified: true };
        return { data: { payload: res.data, readAt: Date.now() }, etag: res.etag };
      });
    } catch (err) {
      if (err?.status === 404) digestRouteMemory.remember();
      throw err;
    }
  };
  const quickReport = useApi(readDigest(true), [date], {
    scopeKey: date,
    // The full answer already covers the quick one.
    enabled: !routeMissing && !fullCached,
    cacheKey: quickKey,
    cacheMs,
  });
  const fullReport = useApi(readDigest(false), [date], {
    scopeKey: date,
    enabled: !routeMissing,
    cacheKey: fullKey,
    cacheMs,
  });
  // The quick part is drawn while the full one is still on its way; a full
  // read that failed keeps the quick answer on screen under its error.
  const report = routeMissing
    ? MISSING_REPORT
    : fullReport.data || fullReport.error?.status === 404 || !quickReport.data
      ? fullReport
      : { ...fullReport, data: quickReport.data };

  const owner = useOwnerReport(date, fresh, cacheMs);
  const live = useLivePositions();
  const accounts = useFleetLink();
  const fuel = useApi(
    (signal) =>
      fleetViewService.getDailyFuel({
        day: date,
        fresh: fresh(),
        signal,
      }),
    [date],
    { scopeKey: date, cacheKey: `fuelTrend:${date}`, cacheMs },
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
    freshRef.current = true;
    try {
      if (report.error?.status !== 404) {
        quickReport.refetch();
        fullReport.refetch();
      }
      owner.brief$.refetch();
      owner.report$.refetch();
      fuel.refetch();
    } finally {
      freshRef.current = false;
    }
    legacyRefresh?.();
    live.refresh();
    accounts.refresh?.();
  };
  const props = {
    date,
    onDateChange: setDate,
    report,
    owner,
    live,
    fleet,
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
