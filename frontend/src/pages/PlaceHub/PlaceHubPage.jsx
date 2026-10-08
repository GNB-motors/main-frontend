import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLoadScript } from '@react-google-maps/api';
import {
  MapPinned,
  Hourglass,
  Flame,
  RefreshCw,
  Plus,
  ChevronDown,
  Satellite,
  Map as MapIcon,
  Maximize2,
  Warehouse,
  Hexagon,
  MousePointerClick,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { useConfirm } from '../../components/ui/confirmContext';
import { getUserRole } from '../../utils/session.js';
import { num } from '../../utils/formatMoney.js';
import PlaceHubService from './PlaceHubService.js';
import PlaceHubMap from './PlaceHubMap.jsx';
import PlaceHubDrawer from './PlaceHubDrawer.jsx';
import { PlacesPanel, IdlingPanel, FuelPanel } from './PlaceHubPanels.jsx';
import LocationSearch from './LocationSearch.jsx';
import {
  canEditPlaces,
  mergePlaces,
  filterPlaces,
  countByGroup,
  placeTotals,
  placeTypeLabel,
  liveIdleTotals,
  clusterIdleEvents,
  idleHistoryTotals,
  fromHotspot,
  drainCellsOf,
  fuelTotals,
  KIND_META,
  newDraft,
  draftFromPlace,
  validateDraft,
  payloadFor,
  centroidOf,
  hasPosition,
} from './placeHubModel.js';
import {
  styleOfType,
  IDLE_COLOR,
  PROVENANCE_COLOR,
  DRAIN_COLOR,
  CONTEXT_COLOR,
} from './placeHubStyle.js';
import './PlaceHub.css';

// Same libraries as the other place pages, so moving between them does not
// make @react-google-maps/api tear down and reload the Maps script.
const GMAPS_LIBS = ['places', 'geometry'];
const EMPTY_LAYER = { rows: [], error: null };
const LIVE_REFRESH_MS = 60_000;
const MAX_IDLE_SPOTS = 150;
const KIND_ICON = { WAREHOUSE: Warehouse, ZONE: Hexagon, HOTSPOT: Flame };

function useHtmlDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const observer = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark')),
    );
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

function errorText(err, fallback) {
  return err?.displayMessage || err?.response?.data?.message || err?.message || fallback;
}

function AddMenu({ allowHotspot, onAdd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const kinds = Object.keys(KIND_META).filter((k) => k !== 'HOTSPOT' || allowHotspot);
  return (
    <div className="ph-menu-wrap" ref={ref}>
      <button
        type="button"
        className="ph-btn ph-btn--primary"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Plus size={15} /> Add place <ChevronDown size={14} />
      </button>
      {open && (
        <div className="ph-menu" role="menu">
          {kinds.map((k) => {
            const Icon = KIND_ICON[k];
            const { color } = styleOfType(k);
            return (
              <button
                key={k}
                type="button"
                role="menuitem"
                className="ph-menu-item"
                onClick={() => {
                  setOpen(false);
                  onAdd(k);
                }}
              >
                <span className="ph-menu-icon" style={{ color, background: `${color}1a` }}>
                  <Icon size={15} />
                </span>
                <span>
                  <strong>{KIND_META[k].label}</strong>
                  <small>{KIND_META[k].hint}</small>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Legend({ tab, places, showContext }) {
  if (tab === 'places') {
    const types = [
      ...new Set(places.filter((p) => p.status !== 'PROPOSED').map((p) => p.type)),
    ].slice(0, 8);
    const proposed = places.some((p) => p.status === 'PROPOSED');
    if (!types.length && !proposed) return null;
    return (
      <div className="ph-legend">
        {types.map((t) => (
          <span key={t} className="ph-legend-item">
            <i style={{ background: styleOfType(t).color }} /> {placeTypeLabel(t)}
          </span>
        ))}
        {proposed && (
          <span className="ph-legend-item">
            <i className="is-hollow" /> To review
          </span>
        )}
      </div>
    );
  }
  const context = showContext && (
    <span className="ph-legend-item">
      <i className="is-ring" style={{ borderColor: CONTEXT_COLOR }} /> Your places
    </span>
  );
  if (tab === 'idling') {
    return (
      <div className="ph-legend">
        <span className="ph-legend-item">
          <i className="is-diamond" style={{ background: IDLE_COLOR.excess }} /> Idling now, excess
        </span>
        <span className="ph-legend-item">
          <i className="is-diamond" style={{ background: IDLE_COLOR.legit }} /> Idling now, legit
        </span>
        <span className="ph-legend-item">
          <i style={{ background: IDLE_COLOR.excess }} /> Idle spot (size = ₹)
        </span>
        {context}
      </div>
    );
  }
  return (
    <div className="ph-legend">
      <span className="ph-legend-item">
        <i className="is-ring" style={{ borderColor: PROVENANCE_COLOR['own-manual'] }} /> Your
        hotspot
      </span>
      <span className="ph-legend-item">
        <i className="is-ring" style={{ borderColor: PROVENANCE_COLOR.network }} /> Network hotspot
      </span>
      <span className="ph-legend-item">
        <i style={{ background: DRAIN_COLOR }} /> Fuel drops (size = ₹)
      </span>
      {context}
    </div>
  );
}

/**
 * Place Hub — one map for every place a fleet works with: warehouses, zones,
 * loading and unloading points, plus where trucks idle and where fuel goes
 * missing. It reads and writes the existing stores through their own APIs,
 * so the older pages (Warehouses, Geofence, Place Intelligence, Hotspots,
 * Idling Console) keep working side by side.
 */
export default function PlaceHubPage() {
  useFullPageLayout();
  const { isEnabled, ready } = useFeatureFlags();
  const confirm = useConfirm();
  const isDark = useHtmlDark();
  const canEdit = canEditPlaces(getUserRole());
  const [params, setParams] = useSearchParams();
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GMAPS_LIBS,
  });

  // Idling, hotspots and Place Intelligence are manager-only on the backend;
  // asking for them as anyone else would only collect 403s.
  const allowZones = isEnabled('geofence');
  const allowSites = isEnabled('fleetIntelligence') && canEdit;
  const allowFuel = isEnabled('fuelIntegrity') && canEdit;
  const allowIdling = isEnabled('idlingConsole') && canEdit;

  /* ─── Data ────────────────────────────────────────────────────────────── */

  const [data, setData] = useState({
    warehouses: [],
    zones: [],
    sites: [],
    proposedTotal: 0,
    hotspots: [],
    drain: null,
    live: [],
    history: [],
    historyTruncated: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState({ places: true, idling: true, fuel: true });
  const [loaded, setLoaded] = useState({ places: false, idling: false, fuel: false });

  const loadPlaces = useCallback(async () => {
    setLoading((l) => ({ ...l, places: true }));
    const [w, z, s] = await Promise.all([
      PlaceHubService.loadWarehouses(),
      allowZones ? PlaceHubService.loadZones() : EMPTY_LAYER,
      allowSites ? PlaceHubService.loadSites() : EMPTY_LAYER,
    ]);
    setData((d) => ({
      ...d,
      warehouses: w.rows,
      zones: z.rows,
      sites: s.rows,
      proposedTotal: s.proposedTotal || 0,
    }));
    setErrors((e) => ({ ...e, warehouses: w.error, zones: z.error, 'detected places': s.error }));
    setLoading((l) => ({ ...l, places: false }));
    setLoaded((l) => ({ ...l, places: true }));
  }, [allowZones, allowSites]);

  const loadIdling = useCallback(async () => {
    if (!allowIdling) return;
    setLoading((l) => ({ ...l, idling: true }));
    const [live, history] = await Promise.all([
      PlaceHubService.loadLiveIdling(),
      PlaceHubService.loadIdleHistory({ days: 7 }),
    ]);
    setData((d) => ({
      ...d,
      live: live.rows,
      history: history.rows,
      historyTruncated: history.truncated,
    }));
    setLoading((l) => ({ ...l, idling: false }));
    setLoaded((l) => ({ ...l, idling: true }));
  }, [allowIdling]);

  const loadFuel = useCallback(async () => {
    if (!allowFuel) return;
    setLoading((l) => ({ ...l, fuel: true }));
    const [hotspots, drain] = await Promise.all([
      PlaceHubService.loadHotspots(),
      PlaceHubService.loadDrainMap(),
    ]);
    setData((d) => ({ ...d, hotspots: hotspots.rows, drain: drain.rows }));
    setLoading((l) => ({ ...l, fuel: false }));
    setLoaded((l) => ({ ...l, fuel: true }));
  }, [allowFuel]);

  useEffect(() => {
    if (ready) loadPlaces();
  }, [ready, loadPlaces]);
  useEffect(() => {
    if (ready) loadIdling();
  }, [ready, loadIdling]);
  useEffect(() => {
    if (ready) loadFuel();
  }, [ready, loadFuel]);

  const refreshAll = () => {
    loadPlaces();
    loadIdling();
    loadFuel();
  };

  /* ─── Tabs ────────────────────────────────────────────────────────────── */

  const tabs = [
    { id: 'places', label: 'Places', Icon: MapPinned },
    allowIdling && { id: 'idling', label: 'Idling', Icon: Hourglass },
    allowFuel && { id: 'fuel', label: 'Fuel risk', Icon: Flame },
  ].filter(Boolean);
  const requestedTab = params.get('tab');
  const tab = tabs.some((t) => t.id === requestedTab) ? requestedTab : 'places';

  const [selectedId, setSelectedId] = useState(null);
  const [focus, setFocus] = useState(null);
  const [group, setGroup] = useState('all');
  const [query, setQuery] = useState('');
  const [idleView, setIdleView] = useState('live');
  const [fuelView, setFuelView] = useState('hotspots');
  const [satellite, setSatellite] = useState(false);
  const [showContext, setShowContext] = useState(true);
  const [fitNonce, setFitNonce] = useState(0);

  const setTab = (id) => {
    setSelectedId(null);
    setParams(
      (p) => {
        const next = new URLSearchParams(p);
        if (id === 'places') next.delete('tab');
        else next.set('tab', id);
        return next;
      },
      { replace: true },
    );
  };

  // Live idling moves minute to minute; refresh it while someone is watching.
  useEffect(() => {
    if (tab !== 'idling' || !allowIdling) return undefined;
    const timer = setInterval(async () => {
      const live = await PlaceHubService.loadLiveIdling();
      if (!live.error) setData((d) => ({ ...d, live: live.rows }));
    }, LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [tab, allowIdling]);

  /* ─── Derived ─────────────────────────────────────────────────────────── */

  const places = useMemo(
    () => mergePlaces({ warehouses: data.warehouses, zones: data.zones, sites: data.sites }),
    [data.warehouses, data.zones, data.sites],
  );
  // Only the 200 busiest suggestions are loaded; the counts use the real total.
  const counts = useMemo(
    () => ({
      ...countByGroup(places),
      review: Math.max(countByGroup(places).review || 0, data.proposedTotal),
    }),
    [places, data.proposedTotal],
  );
  const totals = useMemo(
    () => ({ ...placeTotals(places), toReview: counts.review }),
    [places, counts.review],
  );
  const reviewLoaded = useMemo(() => places.filter((p) => p.group === 'review').length, [places]);
  const visiblePlaces = useMemo(
    () => filterPlaces(places, { group, query }),
    [places, group, query],
  );
  const contextPlaces = useMemo(
    () => (showContext ? places.filter((p) => p.status !== 'PROPOSED') : []),
    [places, showContext],
  );

  const live = useMemo(
    () => data.live.filter(hasPosition).sort((a, b) => (b.durationMin || 0) - (a.durationMin || 0)),
    [data.live],
  );
  const liveTotals = useMemo(() => liveIdleTotals(data.live), [data.live]);
  const idleSpots = useMemo(
    () => clusterIdleEvents(data.history).slice(0, MAX_IDLE_SPOTS),
    [data.history],
  );
  const historyTotals = useMemo(() => idleHistoryTotals(data.history), [data.history]);

  const hotspots = useMemo(
    () =>
      data.hotspots
        .map(fromHotspot)
        .filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng))
        .sort((a, b) => Number(b.active) - Number(a.active) || b.incidentCount - a.incidentCount),
    [data.hotspots],
  );
  const drainCells = useMemo(() => drainCellsOf(data.drain), [data.drain]);
  const fuel = useMemo(() => fuelTotals(hotspots, drainCells), [hotspots, drainCells]);

  const selection = useMemo(() => {
    if (!selectedId) return null;
    const [prefix] = selectedId.split(':');
    if (prefix === 'live')
      return { kind: 'live', item: live.find((e) => `live:${e._id}` === selectedId) };
    if (prefix === 'idle')
      return { kind: 'idleSpot', item: idleSpots.find((s) => s.id === selectedId) };
    if (prefix === 'hotspot')
      return { kind: 'hotspot', item: hotspots.find((h) => h.id === selectedId) };
    if (prefix === 'drain')
      return { kind: 'drain', item: drainCells.find((c) => c.id === selectedId) };
    return { kind: 'place', item: places.find((p) => p.id === selectedId) };
  }, [selectedId, live, idleSpots, hotspots, drainCells, places]);

  const fitPoints = useMemo(() => {
    if (tab === 'places') return visiblePlaces;
    if (tab === 'idling')
      return [
        ...live.map((e) => ({ lat: Number(e.lat), lng: Number(e.lng) })),
        ...idleSpots.slice(0, 40),
      ];
    // Network hotspots span the country; fitting to them would zoom out to India.
    return [...hotspots.filter((h) => h.provenance !== 'network'), ...drainCells.slice(0, 40)];
  }, [tab, visiblePlaces, live, idleSpots, hotspots, drainCells]);
  const subView = tab === 'places' ? group : tab === 'idling' ? idleView : fuelView;
  const fitKey = `${tab}:${subView}:${loaded[tab] ? 1 : 0}:${fitNonce}`;

  /* ─── Selection ───────────────────────────────────────────────────────── */

  const focusOn = useCallback((lat, lng, zoom) => {
    setFocus({ lat, lng, zoom, key: `${lat}:${lng}:${Date.now()}` });
  }, []);

  const pickFromList = useCallback(
    (id, lat, lng) => {
      setSelectedId(id);
      focusOn(lat, lng, 14);
    },
    [focusOn],
  );

  // Opening the detail column narrows the map, so a marker clicked near the
  // right edge would slide out of view — re-centre on it, without zooming.
  const pointsById = useMemo(
    () =>
      new Map(
        [
          ...places,
          ...live.map((e) => ({ id: `live:${e._id}`, lat: Number(e.lat), lng: Number(e.lng) })),
          ...idleSpots,
          ...hotspots,
          ...drainCells,
        ].map((p) => [p.id, p]),
      ),
    [places, live, idleSpots, hotspots, drainCells],
  );
  const pickFromMap = useCallback(
    (id) => {
      setSelectedId(id);
      const p = pointsById.get(id);
      if (p) focusOn(p.lat, p.lng, null);
    },
    [focusOn, pointsById],
  );

  /* ─── Add / edit ──────────────────────────────────────────────────────── */

  const [draft, setDraft] = useState(null);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const draftErrors = useMemo(
    () => (draft && showErrors ? validateDraft(draft) : {}),
    [draft, showErrors],
  );

  const startAdd = useCallback(
    (kind, seed = {}) => {
      setDraft(newDraft(kind, seed));
      setShowErrors(false);
      if (seed.center) focusOn(seed.center.lat, seed.center.lng, 16);
    },
    [focusOn],
  );

  const startEdit = useCallback(
    (item) => {
      const next = draftFromPlace(item);
      if (!next) return;
      setDraft(next);
      setShowErrors(false);
      focusOn(item.lat, item.lng, 15);
    },
    [focusOn],
  );

  const changeDraft = useCallback((patch) => {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, ...patch };
      if (patch.shape === 'circle' && !next.center && d.polygon.length) {
        next.center = centroidOf(d.polygon);
      }
      return next;
    });
  }, []);

  // Map drags can overshoot; clamp there so the circle never shows a radius
  // the store would refuse. Typed values are left alone and validated instead.
  const changeDraftFromMap = useCallback((patch) => {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, ...patch };
      if (patch.radiusM != null) {
        const meta = KIND_META[d.kind];
        next.radiusM = Math.min(meta.maxRadius, Math.max(meta.minRadius, patch.radiusM));
      }
      return next;
    });
  }, []);

  const changeKind = (kind) => {
    setDraft((d) => {
      const center = d.center || (d.polygon.length ? centroidOf(d.polygon) : null);
      return newDraft(kind, { name: d.name, center });
    });
    setShowErrors(false);
  };

  const cancelDraft = () => {
    setDraft(null);
    setShowErrors(false);
  };

  const save = async () => {
    setShowErrors(true);
    if (Object.keys(validateDraft(draft)).length) return;
    const body = payloadFor(draft);
    const { kind, mode } = draft;
    const editing = mode === 'edit';
    setSaving(true);
    try {
      let id = draft.sourceId;
      if (kind === 'WAREHOUSE') {
        const res = editing
          ? await PlaceHubService.updateWarehouse(id, body)
          : await PlaceHubService.createWarehouse(body);
        id = id || res?._id;
      } else if (kind === 'ZONE') {
        const res = editing
          ? await PlaceHubService.updateZone(id, body)
          : await PlaceHubService.createZone(body);
        id = id || res?._id;
      } else {
        const res = editing
          ? await PlaceHubService.updateHotspot(id, body)
          : await PlaceHubService.createHotspot(body);
        id = id || res?._id;
      }
      toast.success(editing ? 'Changes saved' : `${KIND_META[kind].label} added`);
      setDraft(null);
      setShowErrors(false);
      if (kind === 'HOTSPOT') {
        await loadFuel();
        if (tab !== 'fuel') setTab('fuel');
        if (id) setSelectedId(`hotspot:${id}`);
      } else {
        await loadPlaces();
        if (tab === 'places' && id)
          setSelectedId(`${kind === 'WAREHOUSE' ? 'warehouse' : 'zone'}:${id}`);
        if (tab === 'idling') toast.info('Idling inside this place now counts as legit.');
      }
    } catch (err) {
      toast.error(errorText(err, 'Could not save the place'));
    } finally {
      setSaving(false);
    }
  };

  const removePlace = async (place) => {
    const isWarehouse = place.source === 'warehouse';
    const ok = await confirm({
      title: isWarehouse ? `Deactivate ${place.name}?` : `Delete ${place.name}?`,
      body: isWarehouse
        ? 'Trips stop anchoring on this yard and its entry/exit tracking stops.'
        : 'Trucks stop raising entry and exit alerts here, and idling here stops counting as legit.',
      consequence: isWarehouse
        ? 'Vehicles based here must be moved to another yard first.'
        : undefined,
      confirmLabel: isWarehouse ? 'Deactivate' : 'Delete zone',
      danger: true,
    });
    if (!ok) return;
    try {
      if (isWarehouse) await PlaceHubService.deactivateWarehouse(place.sourceId);
      else await PlaceHubService.deleteZone(place.sourceId);
      toast.success(isWarehouse ? 'Warehouse deactivated' : 'Zone deleted');
      setSelectedId(null);
      await loadPlaces();
    } catch (err) {
      toast.error(errorText(err, 'Could not remove the place'));
    }
  };

  const toggleHotspot = async (h) => {
    try {
      await PlaceHubService.updateHotspot(h.sourceId, { active: !h.active });
      toast.success(h.active ? 'Hotspot dismissed' : 'Hotspot reactivated');
      await loadFuel();
    } catch (err) {
      toast.error(errorText(err, 'Could not update the hotspot'));
    }
  };

  const hiddenPlaceId =
    draft?.mode === 'edit'
      ? `${{ WAREHOUSE: 'warehouse', ZONE: 'zone', HOTSPOT: 'hotspot' }[draft.kind]}:${draft.sourceId}`
      : null;

  const onMapSearch = (loc) => {
    focusOn(loc.lat, loc.lng, 15);
    if (draft && draft.shape === 'circle') changeDraft({ center: { lat: loc.lat, lng: loc.lng } });
  };

  const tabCount = { places: totals.places, idling: liveTotals.count, fuel: fuel.active };
  const panelOpen = Boolean(draft || selection?.item);

  /* ─── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="ph-page">
      <header className="ph-head">
        <nav className="ph-tabs" aria-label="Place Hub views">
          {tabs.map((t) => {
            const TabIcon = t.Icon;
            return (
              <button
                key={t.id}
                type="button"
                className={`ph-tab${tab === t.id ? ' is-on' : ''}`}
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => setTab(t.id)}
              >
                <TabIcon size={15} />
                {t.label}
                {loaded[t.id] && <span className="ph-tab-count">{num(tabCount[t.id])}</span>}
              </button>
            );
          })}
        </nav>

        <p className="ph-tagline">Every place your fleet works with, on one map</p>

        <div className="ph-actions">
          <button
            type="button"
            className="ph-icon-btn"
            onClick={refreshAll}
            aria-label="Refresh"
            title="Refresh"
          >
            <RefreshCw size={16} className={loading[tab] ? 'ph-spin' : ''} />
          </button>
          {canEdit && <AddMenu allowHotspot={allowFuel} onAdd={(k) => startAdd(k)} />}
        </div>
      </header>

      <div className={`ph-body${panelOpen ? ' has-panel' : ''}`}>
        <aside className="ph-side" aria-label={`${tab} list`}>
          {tab === 'places' && (
            <PlacesPanel
              loading={loading.places}
              places={visiblePlaces}
              counts={counts}
              totals={totals}
              group={group}
              onGroup={setGroup}
              query={query}
              onQuery={setQuery}
              selectedId={selectedId}
              onPick={(p) => pickFromList(p.id, p.lat, p.lng)}
              errors={{
                warehouses: errors.warehouses,
                zones: errors.zones,
                'detected places': errors['detected places'],
              }}
              canEdit={canEdit}
              onAdd={() => startAdd('WAREHOUSE')}
              reviewNote={
                group === 'review' && counts.review > reviewLoaded
                  ? `Showing the ${num(reviewLoaded)} busiest of ${num(counts.review)} suggestions.`
                  : null
              }
            />
          )}
          {tab === 'idling' && (
            <IdlingPanel
              loading={loading.idling}
              view={idleView}
              onView={setIdleView}
              live={live}
              liveTotals={liveTotals}
              spots={idleSpots}
              historyTotals={historyTotals}
              truncated={data.historyTruncated}
              selectedId={selectedId}
              onPickLive={(e) => pickFromList(`live:${e._id}`, Number(e.lat), Number(e.lng))}
              onPickSpot={(s) => pickFromList(s.id, s.lat, s.lng)}
            />
          )}
          {tab === 'fuel' && (
            <FuelPanel
              loading={loading.fuel}
              view={fuelView}
              onView={setFuelView}
              hotspots={hotspots}
              cells={drainCells}
              totals={fuel}
              disclaimer={data.drain?.disclaimer}
              selectedId={selectedId}
              onPickHotspot={(h) => pickFromList(h.id, h.lat, h.lng)}
              onPickCell={(c) => pickFromList(c.id, c.lat, c.lng)}
            />
          )}
        </aside>

        <section className="ph-mapwrap" aria-label="Map">
          <PlaceHubMap
            isLoaded={isLoaded}
            loadError={loadError}
            isDark={isDark}
            satellite={satellite}
            tab={tab}
            places={visiblePlaces}
            contextPlaces={contextPlaces}
            idleLive={live}
            idleSpots={idleSpots}
            hotspots={hotspots}
            drainCells={drainCells}
            hiddenPlaceId={hiddenPlaceId}
            selectedId={selectedId}
            onSelect={pickFromMap}
            draft={draft}
            onDraftChange={changeDraftFromMap}
            fitPoints={fitPoints}
            fitKey={fitKey}
            focus={focus}
          />

          <div className="ph-map-top">
            <div className="ph-map-search">
              <LocationSearch isLoaded={isLoaded} onPick={onMapSearch} />
            </div>
            <div className="ph-map-tools">
              {tab !== 'places' && (
                <button
                  type="button"
                  className={`ph-tool${showContext ? ' is-on' : ''}`}
                  onClick={() => setShowContext((v) => !v)}
                  aria-pressed={showContext}
                  title="Show your warehouses and zones"
                >
                  <MapPinned size={15} /> Your places
                </button>
              )}
              <button
                type="button"
                className={`ph-tool${satellite ? ' is-on' : ''}`}
                onClick={() => setSatellite((v) => !v)}
                aria-pressed={satellite}
                title={satellite ? 'Road map' : 'Satellite'}
              >
                {satellite ? <MapIcon size={15} /> : <Satellite size={15} />}
                {satellite ? 'Map' : 'Satellite'}
              </button>
              <button
                type="button"
                className="ph-tool"
                onClick={() => setFitNonce((n) => n + 1)}
                title="Fit everything in view"
                aria-label="Fit everything in view"
              >
                <Maximize2 size={15} />
              </button>
            </div>
          </div>

          {draft && (
            <div className="ph-draft-hint" role="status">
              <MousePointerClick size={15} />
              {draft.shape === 'polygon'
                ? draft.polygonDone
                  ? 'Outline closed. Save, or clear it to redraw.'
                  : 'Click the map to add corners. Click the first corner to close.'
                : draft.center
                  ? 'Drag the pin to move it, drag the circle edge to resize.'
                  : 'Click the map to drop the pin.'}
            </div>
          )}

          <Legend tab={tab} places={visiblePlaces} showContext={showContext && tab !== 'places'} />
        </section>

        {panelOpen && (
          <PlaceHubDrawer
            selection={selection}
            draft={draft}
            canEdit={canEdit}
            disclaimer={data.drain?.disclaimer}
            onClose={() => setSelectedId(null)}
            onEdit={startEdit}
            onDelete={removePlace}
            onReviewed={() => loadPlaces()}
            onAdd={startAdd}
            onToggleHotspot={toggleHotspot}
            editor={{
              errors: draftErrors,
              saving,
              isLoaded,
              allowHotspot: allowFuel,
              onChange: changeDraft,
              onKind: changeKind,
              onPick: (loc) => focusOn(loc.lat, loc.lng, 16),
              onCancel: cancelDraft,
              onSave: save,
            }}
          />
        )}
      </div>
    </div>
  );
}
