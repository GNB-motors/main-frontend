import renderIconSvg from './renderIconSvg.jsx';

/* LiveLayerToggles — pill row in the right rail that exposes the trip /
   habitual-halts / break layers that the unified Live page consolidates.

   Each pill toggles a state in `useLiveMap`. We avoid stacking them in
   the topbar because the topbar is owned by status cards / refresh — pills
   here keep them close to the rail drawer that actually explains what is
   on the map, and let the map column stay uncluttered. */
export default function LiveLayerToggles({
  selectedVehicle,
  isTrailVisible,
  segmentByTrip,
  setSegmentByTrip,
  isHabitualHaltsVisible,
  habitualHaltsLoading,
  toggleHabitualHalts,
  habitualHalts = [],
  isCongestionVisible,
  congestionLoading,
  congestionCount = 0,
  toggleCongestion,
}) {
  const vehiclePicked = Boolean(selectedVehicle?.plate);
  return (
    <div className="lp-layer-toggles" role="group" aria-label="Live map layers">
      <button
        type="button"
        className="lp-layer-toggles__btn"
        aria-pressed={segmentByTrip}
        disabled={!vehiclePicked || !isTrailVisible}
        title={isTrailVisible ? 'Color the breadcrumb by trip' : 'Load a trail first'}
        onClick={() => setSegmentByTrip(!segmentByTrip)}
      >
        {renderIconSvg('trip', 14)} Trip segments
      </button>
      <button
        type="button"
        className="lp-layer-toggles__btn"
        aria-pressed={isHabitualHaltsVisible}
        disabled={!vehiclePicked}
        title={
          !vehiclePicked
            ? 'Pick a vehicle to show its habitual halts (places / hub)'
            : isHabitualHaltsVisible
              ? 'Hide habitual halts'
              : 'Show habitual halts (places / hub)'
        }
        onClick={() => selectedVehicle && toggleHabitualHalts(selectedVehicle)}
      >
        {renderIconSvg('pin', 14)}{' '}
        {habitualHaltsLoading
          ? 'Loading halts…'
          : isHabitualHaltsVisible && Array.isArray(habitualHalts) && habitualHalts.length > 0
            ? `Habitual halts · ${habitualHalts.length}`
            : 'Habitual halts'}
      </button>
      {/* Congestion (00_PLAN.md item 5). No vehicle needed — this is a layer over
          the roads the whole org drives, not over one vehicle's day. */}
      <button
        type="button"
        className="lp-layer-toggles__btn"
        aria-pressed={isCongestionVisible}
        title="Congestion on the roads our own trucks drive, against the boundary we learned for each road class"
        onClick={() => toggleCongestion(!isCongestionVisible)}
      >
        {renderIconSvg('road', 14)}{' '}
        {congestionLoading
          ? 'Loading congestion…'
          : isCongestionVisible && congestionCount > 0
            ? `Congestion · ${congestionCount}`
            : 'Congestion'}
      </button>
    </div>
  );
}
