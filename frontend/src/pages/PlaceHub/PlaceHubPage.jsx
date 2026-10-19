import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLoadScript } from '@react-google-maps/api';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { useConfirm } from '../../components/ui/confirmContext';
import { getUserRole } from '../../utils/session.js';
import { num } from '../../utils/formatMoney.js';
import PlaceHubMap from './PlaceHubMap.jsx';
import PlaceHubDrawer from './PlaceHubDrawer.jsx';
import { canEditPlaces } from './model/placeHubConfig.js';
import useHtmlDark from './page/useHtmlDark.js';
import placeHubTabs from './page/placeHubTabs.js';
import usePlaceHubData from './page/usePlaceHubData.js';
import useLiveIdlingRefresh from './page/useLiveIdlingRefresh.js';
import useLinkedPlace from './page/useLinkedPlace.js';
import usePlaceHubDerived from './page/usePlaceHubDerived.js';
import useStopAnswers from './page/useStopAnswers.js';
import usePlaceEditor from './page/usePlaceEditor.js';
import PlaceHubHeader from './page/PlaceHubHeader.jsx';
import PlaceHubTableTab from './page/PlaceHubTableTab.jsx';
import PlaceHubSideList from './page/PlaceHubSideList.jsx';
import MapToolbar from './page/MapToolbar.jsx';
import DraftHint from './page/DraftHint.jsx';
import Legend from './page/Legend.jsx';
import './intelligence/placeIntelligence.css';
import './PlaceHub.css';

// Same libraries as the other place pages, so moving between them does not
// make @react-google-maps/api tear down and reload the Maps script.
const GMAPS_LIBS = ['places', 'geometry'];
/** Tabs drawn on the map; the rest are tables that take the whole body. */
const MAP_TABS = new Set(['places', 'idling', 'fuel', 'stops']);

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
  const isSuperAdmin = getUserRole() === 'SUPER_ADMIN';
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

  const {
    data,
    setData,
    errors,
    loading,
    loaded,
    loadPlaces,
    loadRejected,
    loadIdling,
    loadIdleHistory,
    loadFuel,
    loadDrain,
    loadStops,
  } = usePlaceHubData({ ready, allowZones, allowSites, allowIdling, allowFuel });

  // Bumped after an answer or a refresh so the table tabs refetch with the map.
  const [version, setVersion] = useState(0);
  const refreshAll = () => {
    loadPlaces();
    loadIdling();
    loadFuel();
    if (loaded.idleHistory) loadIdleHistory();
    if (loaded.drain) loadDrain();
    if (loaded.stops) loadStops();
    setVersion((v) => v + 1);
  };
  const onLearned = () => {
    setVersion((v) => v + 1);
    loadPlaces();
  };

  /* ─── Tabs ────────────────────────────────────────────────────────────── */

  const tabs = placeHubTabs({ allowIdling, allowFuel, allowSites, isSuperAdmin });
  const requestedTab = params.get('tab');
  const tab = tabs.some((t) => t.id === requestedTab) ? requestedTab : 'places';

  const [selectedId, setSelectedId] = useState(null);
  const [focus, setFocus] = useState(null);
  const [group, setGroup] = useState('all');
  const [query, setQuery] = useState('');
  const [idleView, setIdleView] = useState('live');
  const [fuelView, setFuelView] = useState('hotspots');
  const [satellite, setSatellite] = useState(false);
  const [showPoi, setShowPoi] = useState(false);
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

  // Each tab's own data loads the first time it is opened.
  useEffect(() => {
    if (tab === 'stops' && !loaded.stops) loadStops();
  }, [tab, loaded.stops, loadStops]);
  useEffect(() => {
    if (tab === 'idling' && !loaded.idleHistory) loadIdleHistory();
  }, [tab, loaded.idleHistory, loadIdleHistory]);
  useEffect(() => {
    if (tab === 'fuel' && !loaded.drain) loadDrain();
  }, [tab, loaded.drain, loadDrain]);
  useEffect(() => {
    if (group === 'rejected' && !loaded.rejected) loadRejected();
  }, [group, loaded.rejected, loadRejected]);

  useLiveIdlingRefresh({ tab, allowIdling, setData });

  /* ─── Derived ─────────────────────────────────────────────────────────── */

  const {
    places,
    counts,
    totals,
    reviewLoaded,
    lowLoaded,
    visiblePlaces,
    contextPlaces,
    siteOf,
    stopGroups,
    live,
    liveTotals,
    idleSpots,
    historyTotals,
    hotspots,
    drainCells,
    fuel,
    selection,
    fitPoints,
  } = usePlaceHubDerived({ data, group, query, showContext, selectedId, tab });
  const subView = { places: group, idling: idleView, fuel: fuelView }[tab] || '';
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
          ...stopGroups,
        ].map((p) => [p.id, p]),
      ),
    [places, live, idleSpots, hotspots, drainCells, stopGroups],
  );
  const pickFromMap = useCallback(
    (id) => {
      setSelectedId(id);
      const p = pointsById.get(id);
      if (p) focusOn(p.lat, p.lng, null);
    },
    [focusOn, pointsById],
  );

  useLinkedPlace({
    params,
    setParams,
    loaded,
    places,
    allowSites,
    pickFromList,
    setGroup,
    setData,
  });

  /** Opens a detected place on the Places tab — from a stop, a facility or a link. */
  const openSite = useCallback(
    (siteId) => {
      setSelectedId(null);
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('tab');
          next.set('place', `site:${siteId}`);
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  /* ─── Unexplained stops: answers ──────────────────────────────────────── */

  const { stopsBusy, answerStops } = useStopAnswers({ loadStops, loadPlaces });

  /* ─── Add / edit ──────────────────────────────────────────────────────── */

  const {
    draft,
    draftErrors,
    saving,
    startAdd,
    startEdit,
    changeDraft,
    changeDraftFromMap,
    changeKind,
    cancelDraft,
    save,
    removePlace,
    toggleHotspot,
    hiddenPlaceId,
  } = usePlaceEditor({ confirm, focusOn, tab, setTab, setSelectedId, loadPlaces, loadFuel });

  const onMapSearch = (loc) => {
    focusOn(loc.lat, loc.lng, 15);
    if (draft && draft.shape === 'circle') changeDraft({ center: { lat: loc.lat, lng: loc.lng } });
  };

  const unexplainedHours = data.summary?.unproductive?.hours;
  const tabBadge = {
    places: loaded.places ? num(totals.places) : null,
    idling: loaded.idling ? num(liveTotals.count) : null,
    fuel: loaded.fuel ? num(fuel.active) : null,
    stops: unexplainedHours ? `${num(unexplainedHours)} h` : null,
  };
  const panelOpen = Boolean(draft || selection?.item);
  const isMapTab = MAP_TABS.has(tab);
  const lastRunAt = data.summary?.lastRunAt;

  /* ─── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="ph-page">
      <PlaceHubHeader
        tabs={tabs}
        tab={tab}
        tabBadge={tabBadge}
        setTab={setTab}
        lastRunAt={lastRunAt}
        refreshAll={refreshAll}
        loading={loading}
        canEdit={canEdit}
        allowFuel={allowFuel}
        isMapTab={isMapTab}
        startAdd={startAdd}
      />

      {!isMapTab && (
        <PlaceHubTableTab
          tab={tab}
          tabs={tabs}
          version={version}
          isEnabled={isEnabled}
          onLearned={onLearned}
          openSite={openSite}
        />
      )}

      {/* Hidden, not unmounted, on the table tabs: every new map is a billed map load. */}
      <div className={`ph-body${panelOpen ? ' has-panel' : ''}`} hidden={!isMapTab}>
        <PlaceHubSideList
          tab={tab}
          loading={loading}
          errors={errors}
          data={data}
          visiblePlaces={visiblePlaces}
          counts={counts}
          group={group}
          setGroup={setGroup}
          query={query}
          setQuery={setQuery}
          selectedId={selectedId}
          pickFromList={pickFromList}
          canEdit={canEdit}
          startAdd={startAdd}
          reviewLoaded={reviewLoaded}
          lowLoaded={lowLoaded}
          idleView={idleView}
          setIdleView={setIdleView}
          live={live}
          liveTotals={liveTotals}
          idleSpots={idleSpots}
          historyTotals={historyTotals}
          fuelView={fuelView}
          setFuelView={setFuelView}
          hotspots={hotspots}
          drainCells={drainCells}
          fuel={fuel}
          stopGroups={stopGroups}
          siteOf={siteOf}
        />

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
            stopGroups={stopGroups}
            showPoi={showPoi}
            hiddenPlaceId={hiddenPlaceId}
            selectedId={selectedId}
            onSelect={pickFromMap}
            draft={draft}
            onDraftChange={changeDraftFromMap}
            fitPoints={fitPoints}
            fitKey={fitKey}
            focus={focus}
          />

          <MapToolbar
            isLoaded={isLoaded}
            onMapSearch={onMapSearch}
            tab={tab}
            showContext={showContext}
            setShowContext={setShowContext}
            showPoi={showPoi}
            setShowPoi={setShowPoi}
            satellite={satellite}
            setSatellite={setSatellite}
            setFitNonce={setFitNonce}
          />

          {draft && <DraftHint draft={draft} />}

          <Legend
            tab={tab}
            places={visiblePlaces}
            showContext={showContext && tab !== 'places'}
            showPoi={showPoi}
          />
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
            onReviewed={onLearned}
            onAdd={startAdd}
            onToggleHotspot={toggleHotspot}
            siteOf={siteOf}
            stopsBusy={stopsBusy}
            onAnswerStops={answerStops}
            onOpenSite={openSite}
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
