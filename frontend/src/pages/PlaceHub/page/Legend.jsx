import PlaceIcon from '../../../components/Icons/PlaceIcon.jsx';
import { PLACE_ICON_SIZES } from '../../../config/placeIcons.js';
import { placeTypeLabel } from '../model/placeGroups.js';
import { PURPOSE_COLOR, PURPOSE_LABEL } from '../model/placePurpose.js';
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
import { RUN_COLORS } from '../model/routes.js';
import { mapPlaceIconUrl } from '../../LiveTracking/mapPlaceIcon.js';

export default function Legend({
  tab,
  places,
  showContext,
  showPoi,
  showAllTolls,
  showUsedTolls,
  isDark,
}) {
  const poi = showPoi && <PoiKeys />;
  // Only show toll keys while the corresponding layer is visible.
  const tolls = (showUsedTolls || showAllTolls) && (
    <>
      <span className="ph-legend-item">
        <img
          className="ph-toll-key"
          src={mapPlaceIconUrl({ layer: 'tolls' }, { size: PLACE_ICON_SIZES.tolls.visited })}
          alt=""
        />{' '}
        Toll plaza used
      </span>
      {showAllTolls && (
        <span className="ph-legend-item">
          <img
            className="ph-toll-key"
            src={mapPlaceIconUrl(
              { layer: 'tolls' },
              { size: PLACE_ICON_SIZES.tolls.upcoming, hollow: true },
            )}
            alt=""
          />{' '}
          Other toll plaza
        </span>
      )}
    </>
  );
  if (tab === 'routes')
    return (
      <div className="ph-legend ph-route-legend">
        <span>Width and blue shade = runs</span>
        <span className="ph-route-widths">
          {[2, 10, 40].map((n) => (
            <span key={n}>
              <i style={{ borderTopWidth: 2 + Math.sqrt(n / 40) * 6 }} />
              {n}
            </span>
          ))}
        </span>
        <span className="ph-route-ramp" aria-label="Runs: 2–3, 4–6, 7–12, 13–24, 25 or more">
          {RUN_COLORS[isDark ? 'dark' : 'light'].map((color) => (
            <i key={color} style={{ background: color }} />
          ))}
        </span>
        <span>━ Road our trucks drove</span>
        <span>┄ Likely road (engine)</span>
        <span>··· Straight-line link</span>
        {tolls}
      </div>
    );
  if (tab === 'places') {
    const types = [
      ...new Set(places.filter((p) => p.status === 'CONFIRMED').map((p) => p.type)),
    ].slice(0, 8);
    const hasUnknown = places.some((p) => p.type === 'UNKNOWN');
    const proposed = places.some((p) => p.status === 'PROPOSED');
    const risk = places.some((p) => p.risk);
    const purposes = new Set(places.map((p) => p.purpose || 'general'));
    const hasCore = places.some((p) => p.coreParts?.length);
    return (
      <div className="ph-legend">
        {types.map((t) => (
          <span key={t} className="ph-legend-item">
            <PlaceIcon type={t} size={18} style={{ color: styleOfType(t).color }} />{' '}
            {placeTypeLabel(t)}
          </span>
        ))}
        {hasUnknown && (
          <span className="ph-legend-item">
            <PlaceIcon type="UNKNOWN" size={18} style={{ color: styleOfType('UNKNOWN').color }} />{' '}
            Unknown place
          </span>
        )}
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
        {purposes.has('theft') && (
          <span className="ph-legend-item">
            <i style={{ background: PURPOSE_COLOR.theft }} /> {PURPOSE_LABEL.theft}
          </span>
        )}
        {purposes.has('pump') && (
          <span className="ph-legend-item">
            <PlaceIcon layer="pumps" size={18} style={{ color: PURPOSE_COLOR.pump }} />{' '}
            {PURPOSE_LABEL.pump}
          </span>
        )}
        {purposes.has('general') && (
          <span className="ph-legend-item">
            <i style={{ background: PURPOSE_COLOR.general }} /> {PURPOSE_LABEL.general}
          </span>
        )}
        {hasCore && (
          <span className="ph-legend-item">
            <i className="is-square" style={{ background: '#0f172a' }} /> Busiest part (darker)
          </span>
        )}
        {poi}
        {tolls}
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
        {tolls}
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
        {tolls}
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
      {tolls}
    </div>
  );
}
