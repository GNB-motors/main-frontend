import RoadTrailLegend from '../../components/map/RoadTrailLegend';
import { toLayers, summaryOf } from '../../lib/roadTrail';
import renderIconSvg from './renderIconSvg.jsx';
import TrailDateFilter from './TrailDateFilter.jsx';

export default function MapOverlayControls({
  isTelemetryOn,
  setIsTelemetryOn,
  setIsRailOpen,
  triggerMapResize,
  handleZoomIn,
  handleZoomOut,
  isTrailVisible,
  roadTrail,
  mapMode,
  setMapMode,
  selectedVehicle,
  replayState,
  trailSelection,
  trailLoading,
  trailNotice,
  loadTrail,
  searchBox = null,
  legend = null,
  trafficToggle = null,
}) {
  const showTrailDates = Boolean(selectedVehicle && isTrailVisible && !replayState?.on);
  const showRoadLegend = Boolean(isTrailVisible && roadTrail);

  // The map has four corners and each one holds ONE stack, so nothing can be
  // drawn on top of anything else: the left column (search, live telemetry,
  // the filters), the right column (traffic, fleet list, trail dates, road
  // legend), the zoom at the bottom-right and Map/Satellite at the
  // bottom-left. Each stack grows downwards (or upwards) inside its own box.
  return (
    <>
      <div className="ov ov--left">
        <div className="ov-left-row">
          {searchBox}
          <button
            className={`mbtn ov-telemetry ${isTelemetryOn ? 'mbtn--on' : ''}`}
            aria-pressed={isTelemetryOn}
            onClick={() => setIsTelemetryOn?.((prev) => !prev)}
          >
            <span className="led" />
            <span className="eyebrow-mini">Live telemetry</span>
          </button>
        </div>
        {legend}
      </div>

      <div className="ov ov--right">
        <div className="ov-right-row">
          {/* Fleet list re-opener: only when the rail is closed. */}
          <button
            className="mbtn ov-fleet-reopen"
            onClick={() => {
              setIsRailOpen?.(true);
              setTimeout(() => triggerMapResize?.(), 240);
            }}
          >
            {renderIconSvg('list', 15)}
            Fleet list
          </button>
          {trafficToggle}
        </div>

        {showTrailDates && (
          <div className="ov-trail-dates">
            <TrailDateFilter
              selection={trailSelection}
              loading={trailLoading}
              notice={trailNotice}
              onSelect={(selection) => loadTrail(selectedVehicle, selection)}
            />
          </div>
        )}

        {showRoadLegend && (
          <div className="road-legend-card">
            <RoadTrailLegend
              layers={toLayers(roadTrail)}
              calibrated={roadTrail.calibrated}
              summary={summaryOf(roadTrail)}
            />
          </div>
        )}
      </div>

      {/* Bottom-right: zoom, above Google's attribution line. */}
      <div className="ov ov--lc">
        <button className="ctrl" title="Zoom in" aria-label="Zoom in" onClick={handleZoomIn}>
          {renderIconSvg('plus', 18)}
        </button>

        <button className="ctrl" title="Zoom out" aria-label="Zoom out" onClick={handleZoomOut}>
          {renderIconSvg('minus', 18)}
        </button>
      </div>

      {/* Bottom-left: Map/Satellite. */}
      <div className="ov ov--bl">
        <div className="segmented">
          <button aria-pressed={mapMode === 'map'} onClick={() => setMapMode?.('map')}>
            Map
          </button>
          <button aria-pressed={mapMode === 'sat'} onClick={() => setMapMode?.('sat')}>
            Satellite
          </button>
        </div>
      </div>
    </>
  );
}
