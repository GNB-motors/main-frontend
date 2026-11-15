import renderIconSvg from './renderIconSvg.jsx';

/* Map layers about the selected vehicle, under its Trail / Replay / Share
   actions: per-trip trail colours and its habitual halts. */
export default function VehicleLayerToggles({
  selectedVehicle,
  isTrailVisible,
  segmentByTrip,
  setSegmentByTrip,
  isHabitualHaltsVisible,
  habitualHaltsLoading,
  toggleHabitualHalts,
  habitualHalts = [],
}) {
  return (
    <div className="lp-layer-toggles" role="group" aria-label="Vehicle map layers">
      <button
        type="button"
        className="lp-layer-toggles__btn"
        aria-pressed={segmentByTrip}
        disabled={!isTrailVisible}
        title={isTrailVisible ? 'Color the trail by trip' : 'Load a trail first'}
        onClick={() => setSegmentByTrip(!segmentByTrip)}
      >
        {renderIconSvg('trip', 14)} Trip segments
      </button>
      <button
        type="button"
        className="lp-layer-toggles__btn"
        aria-pressed={isHabitualHaltsVisible}
        title={
          isHabitualHaltsVisible ? 'Hide habitual halts' : 'Show where this vehicle regularly halts'
        }
        onClick={() => toggleHabitualHalts(selectedVehicle)}
      >
        {renderIconSvg('pin', 14)}{' '}
        {habitualHaltsLoading
          ? 'Loading halts…'
          : isHabitualHaltsVisible && habitualHalts.length > 0
            ? `Habitual halts · ${habitualHalts.length}`
            : 'Habitual halts'}
      </button>
    </div>
  );
}
