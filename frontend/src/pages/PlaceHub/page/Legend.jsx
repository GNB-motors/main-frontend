import { placeTypeLabel } from '../placeHubModel.js';
import {
  styleOfType,
  IDLE_COLOR,
  PROVENANCE_COLOR,
  DRAIN_COLOR,
  CONTEXT_COLOR,
  STOP_COLOR,
  RISK_COLOR,
} from '../placeHubStyle.js';
import PoiKeys from './PoiKeys.jsx';

export default function Legend({ tab, places, showContext, showPoi }) {
  const poi = showPoi && <PoiKeys />;
  if (tab === 'places') {
    const types = [
      ...new Set(places.filter((p) => p.status === 'CONFIRMED').map((p) => p.type)),
    ].slice(0, 8);
    const proposed = places.some((p) => p.status === 'PROPOSED');
    const risk = places.some((p) => p.risk);
    if (!types.length && !proposed && !risk && !poi) return null;
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
        {risk && (
          <span className="ph-legend-item">
            <i className="is-ring" style={{ borderColor: RISK_COLOR }} /> Fuel risk
          </span>
        )}
        {poi}
      </div>
    );
  }
  const context = showContext && (
    <span className="ph-legend-item">
      <i className="is-ring" style={{ borderColor: CONTEXT_COLOR }} /> Your places
    </span>
  );
  if (tab === 'stops') {
    return (
      <div className="ph-legend">
        <span className="ph-legend-item">
          <i style={{ background: STOP_COLOR }} /> Unexplained stops (size = hours)
        </span>
        {context}
        {poi}
      </div>
    );
  }
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
        {poi}
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
      {poi}
    </div>
  );
}
