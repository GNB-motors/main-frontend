import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import useApi from '../../../hooks/useApi.js';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../../utils/session.js';
import { canEditSap } from '../../Sap/sapModel.js';
import { loadDeliveryRoutes } from '../../LiveTracking/useTrackRoutes.js';
import { drawableRoutes, routeFitPoints } from '../model/routes.js';
import { deliveryMapModel, visibleDeliveries } from '../model/deliveryMap.js';

/**
 * State for Place Hub → Routes → Delivery routes: one filtered load feeds the
 * list, the map and the counts, so the three never disagree. Selection lives
 * in the URL (`delivery=`) so a route can be linked and Back closes it.
 */
export default function useDeliveryRouteMap({ enabled, version, params, setParams, siteOf }) {
  const { isEnabled } = useFeatureFlags();
  const showSap = canEditSap(getUserRole()) && isEnabled('sapV2');
  const [search, setSearch] = useState('');
  const term = useDeferredValue(search.trim());
  const [review, setReview] = useState('');
  const [sapStatus, setSapStatus] = useState('');
  const [sort, setSort] = useState('trips');
  const [siteId, setSiteId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [revision, setRevision] = useState(0);
  const q = useApi(
    (signal) =>
      loadDeliveryRoutes(signal, {
        search: term || undefined,
        review: review || undefined,
        sapStatus: showSap ? sapStatus || undefined : undefined,
      }),
    [term, review, sapStatus, showSap, version, revision],
    { enabled },
  );
  const model = useMemo(() => deliveryMapModel(q.data?.rows, siteOf), [q.data, siteOf]);
  const legs = useMemo(
    () => visibleDeliveries(model.legs, { siteId, sort }),
    [model.legs, siteId, sort],
  );
  const selectedId = params.get('delivery');
  const found = model.legs.find((l) => String(l._id) === selectedId);
  // A linked route outside the current filters still opens; the drawer fetches it by id.
  const selected = selectedId ? found || { _id: selectedId } : null;
  const lines = useMemo(
    () => drawableRoutes(found && !legs.includes(found) ? [...legs, found] : legs),
    [legs, found],
  );
  const fitPoints = useMemo(
    () => (found?.segments?.length ? found.segments.flat() : routeFitPoints(legs)),
    [legs, found],
  );
  const pick = useCallback(
    (id) =>
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          next.set('tab', 'routes');
          next.set('routeView', 'deliveries');
          next.delete('leg');
          if (id) next.set('delivery', String(id));
          else next.delete('delivery');
          return next;
        },
        { replace: !id },
      ),
    [setParams],
  );
  const setIntent = useCallback(
    (intent) =>
      setParams((previous) => {
        const next = new URLSearchParams(previous);
        if (intent) next.set('sapTab', intent);
        else next.delete('sapTab');
        return next;
      }),
    [setParams],
  );
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  return {
    showSap,
    sapTab: showSap ? params.get('sapTab') : null,
    setIntent,
    search,
    setSearch,
    review,
    setReview,
    sapStatus,
    setSapStatus,
    sort,
    setSort,
    siteId,
    setSiteId,
    hoveredId,
    setHoveredId,
    legs,
    sites: model.sites,
    totals: q.data?.totals,
    loaded: Boolean(q.data),
    loading: q.loading,
    error: q.error,
    refetch: q.refetch,
    refresh,
    selectedId,
    selected,
    pick,
    lines,
    fitPoints,
    fitKey: `delivery:${term}|${review}|${sapStatus}|${siteId || ''}|${selectedId || ''}|${q.data ? 1 : 0}`,
  };
}
