import RoadTrailLegend from '../../components/map/RoadTrailLegend';
import { toLayers, summaryOf } from '../../lib/roadTrail';
import renderIconSvg from './renderIconSvg.jsx';

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
}) {
  return (
    <>
      {/* Overlay Top-Left: Live Telemetry Switcher */}
      <div className="ov ov--tl">
        <button
          className={`mbtn ${isTelemetryOn ? 'mbtn--on' : ''}`}
          aria-pressed={isTelemetryOn}
          onClick={() => setIsTelemetryOn((prev) => !prev)}
        >
          <span className="led" />
          <span className="eyebrow-mini">Live telemetry</span>
        </button>
      </div>

      {/* Overlay Top-Right: Fleet List Re-opener */}
      <div className="ov ov--tr">
        <button
          className="mbtn"
          onClick={() => {
            setIsRailOpen(true);
            setTimeout(triggerMapResize, 240);
          }}
        >
          {renderIconSvg('list', 15)}
          Fleet list
        </button>
      </div>

      {/* Overlay Left-Bottom: Zoom Controls */}
      <div className="ov ov--lc">
        <button className="ctrl" title="Zoom in" aria-label="Zoom in" onClick={handleZoomIn}>
          {renderIconSvg('plus', 18)}
        </button>

        <button className="ctrl" title="Zoom out" aria-label="Zoom out" onClick={handleZoomOut}>
          {renderIconSvg('minus', 18)}
        </button>
      </div>

      {/* Overlay Bottom-Left: Map/Satellite Switcher */}
      <div className="ov ov--bl">
        {isTrailVisible && roadTrail && (
          <div
            className="road-legend-card"
            style={{
              background: 'var(--surface, #fff)',
              padding: 8,
              borderRadius: 8,
              marginBottom: 6,
              maxWidth: 260,
            }}
          >
            <RoadTrailLegend
              layers={toLayers(roadTrail)}
              calibrated={roadTrail.calibrated}
              summary={summaryOf(roadTrail)}
            />
          </div>
        )}
        <div className="segmented">
          <button aria-pressed={mapMode === 'map'} onClick={() => setMapMode('map')}>
            Map
          </button>
          <button aria-pressed={mapMode === 'sat'} onClick={() => setMapMode('sat')}>
            Satellite
          </button>
        </div>
      </div>
    </>
  );
}
