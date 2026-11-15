import { reviewNoteFor } from '../model/placeFilters.js';
import PlacesPanel from '../panels/PlacesPanel.jsx';
import IdlingPanel from '../panels/IdlingPanel.jsx';
import FuelPanel from '../panels/FuelPanel.jsx';
import StopsPanel from '../panels/StopsPanel.jsx';

export default function PlaceHubSideList({
  tab,
  loading,
  errors,
  data,
  visiblePlaces,
  counts,
  group,
  setGroup,
  query,
  setQuery,
  vehicleLabel,
  vehicleHalts,
  onVehiclePick,
  onVehicleClear,
  onPickVehicleHalt,
  selectedId,
  pickFromList,
  canEdit,
  startAdd,
  reviewLoaded,
  lowLoaded,
  idleView,
  setIdleView,
  live,
  liveTotals,
  idleSpots,
  historyTotals,
  fuelView,
  setFuelView,
  hotspots,
  drainCells,
  fuel,
  stopGroups,
  siteOf,
}) {
  return (
    <aside className="ph-side" aria-label={`${tab} list`}>
      {tab === 'places' && (
        <PlacesPanel
          loading={loading.places}
          places={visiblePlaces}
          counts={counts}
          group={group}
          onGroup={setGroup}
          query={query}
          onQuery={setQuery}
          vehicleLabel={vehicleLabel}
          vehicleHalts={vehicleHalts}
          onVehiclePick={onVehiclePick}
          onVehicleClear={onVehicleClear}
          onPickVehicleHalt={onPickVehicleHalt}
          selectedId={selectedId}
          onPick={(p) => pickFromList(p.id, p.lat, p.lng)}
          errors={{
            warehouses: errors.warehouses,
            zones: errors.zones,
            'detected places': errors['detected places'],
            'rejected places': errors['rejected places'],
          }}
          canEdit={canEdit}
          onAdd={() => startAdd('WAREHOUSE')}
          reviewNote={reviewNoteFor(group, {
            review: [reviewLoaded, counts.review],
            low: [lowLoaded, counts.low],
          })}
        />
      )}
      {tab === 'idling' && (
        <IdlingPanel
          loading={loading.idling || loading.idleHistory}
          view={idleView}
          onView={setIdleView}
          live={live}
          liveTotals={liveTotals}
          spots={idleSpots}
          historyTotals={historyTotals}
          truncated={data.historyTruncated}
          idleSetting={data.idleSetting}
          errors={{
            'live idling': errors['live idling'],
            'idle history': errors['idle history'],
          }}
          selectedId={selectedId}
          onPickLive={(e) => pickFromList(`live:${e._id}`, Number(e.lat), Number(e.lng))}
          onPickSpot={(s) => pickFromList(s.id, s.lat, s.lng)}
        />
      )}
      {tab === 'fuel' && (
        <FuelPanel
          loading={loading.fuel || loading.drain}
          view={fuelView}
          onView={setFuelView}
          hotspots={hotspots}
          cells={drainCells}
          totals={fuel}
          disclaimer={data.drain?.disclaimer}
          errors={{ 'fuel hotspots': errors['fuel hotspots'], 'drain map': errors['drain map'] }}
          selectedId={selectedId}
          onPickHotspot={(h) => pickFromList(h.id, h.lat, h.lng)}
          onPickCell={(c) => pickFromList(c.id, c.lat, c.lng)}
        />
      )}
      {tab === 'stops' && (
        <StopsPanel
          loading={loading.stops}
          error={errors.stops}
          groups={stopGroups}
          siteOf={siteOf}
          selectedId={selectedId}
          onPick={(g) => pickFromList(g.id, g.lat, g.lng)}
        />
      )}
    </aside>
  );
}
