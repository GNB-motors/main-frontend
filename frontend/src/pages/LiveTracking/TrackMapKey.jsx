import PlaceIcon from '../../components/Icons/PlaceIcon.jsx';
import { PLACE_ICON_SIZES } from '../../config/placeIcons.js';
import { placeTypeLabel } from '../PlaceHub/model/placeGroups.js';
import { styleOfType } from '../PlaceHub/placeHubStyle.js';
import { mapPlaceIconUrl } from './mapPlaceIcon.js';
import { keyPlaceTypes, keyRouteSources } from './trackMapKeyModel.js';
import './TrackMapKey.css';

const ROUTE_SOURCE = {
  DRIVEN: { className: 'is-solid', label: 'Road our trucks drove' },
  ENGINE: { className: 'is-dashed', label: 'Likely road' },
  NONE: { className: 'is-dotted', label: 'Straight-line link' },
};

/** Map key for Live Tracking → Places & routes, in the spirit of Place Hub's legend. */
export default function TrackMapKey({
  tab,
  places = [],
  reviewCount = 0,
  idlingCount = 0,
  tollCount = 0,
  routeLines = [],
  routeKind = 'movement',
}) {
  const items =
    tab === 'routes'
      ? routeItems(routeLines, routeKind)
      : placeItems(places, reviewCount, idlingCount, tollCount);
  if (!items.length) return null;
  return (
    <div className="ov ov--bc lt-map-key-slot">
      <div className="lt-map-key" role="note" aria-label="Map key">
        {items}
      </div>
    </div>
  );
}

function placeItems(places, reviewCount, idlingCount, tollCount) {
  const items = keyPlaceTypes(places).map((type) => (
    <span key={type} className="lt-map-key-item">
      <PlaceIcon type={type} size={16} style={{ color: styleOfType(type).color }} />
      {type === 'UNKNOWN' ? 'Unknown place' : placeTypeLabel(type)}
    </span>
  ));
  if (reviewCount)
    items.push(
      <span key="review" className="lt-map-key-item">
        <i className="lt-map-key-diamond" /> Place to review
      </span>,
    );
  if (idlingCount)
    items.push(
      <span key="idling" className="lt-map-key-item">
        <i className="lt-map-key-dot" /> Idling now
      </span>,
    );
  if (tollCount)
    items.push(
      <span key="tolls" className="lt-map-key-item">
        <img
          className="lt-map-key-toll"
          src={mapPlaceIconUrl({ layer: 'tolls' }, { size: PLACE_ICON_SIZES.tolls.visited })}
          alt=""
        />
        Toll plaza
      </span>,
    );
  return items;
}

function routeItems(lines, kind) {
  const sources = keyRouteSources(lines);
  if (!sources.length) return [];
  return [
    <span key="what" className="lt-map-key-item lt-map-key-title">
      {kind === 'delivery' ? 'Delivery routes' : 'All movements'} · thicker = more trips
    </span>,
    ...sources.map((s) => (
      <span key={s} className="lt-map-key-item">
        <i className={`lt-map-key-line ${ROUTE_SOURCE[s].className}`} /> {ROUTE_SOURCE[s].label}
      </span>
    )),
  ];
}
