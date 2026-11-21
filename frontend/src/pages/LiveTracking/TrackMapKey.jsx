import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import InfoTip from '../../components/redesign/InfoTip';
import { PURPOSE_COLOR } from '../PlaceHub/model/placePurpose';
import PlaceIcon from '../../components/Icons/PlaceIcon.jsx';
import { PLACE_ICON_SIZES } from '../../config/placeIcons.js';
import { placeTypeLabel } from '../PlaceHub/model/placeGroups.js';
import { styleOfType } from '../PlaceHub/placeHubStyle.js';
import { mapPlaceIconUrl } from './mapPlaceIcon.js';
import { keyAreaPurposes, keyPlaceTypes, keyRouteSources } from './trackMapKeyModel.js';
import { reviewPlaceIconUrl } from './reviewPlaceIcon.js';
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
  const slot = useRef(null);
  const contentId = useId();
  const [compact, setCompact] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const areas = tab === 'routes' ? [] : keyAreaPurposes(places);
  const items =
    tab === 'routes'
      ? routeItems(routeLines, routeKind)
      : placeItems(places, reviewCount, idlingCount, tollCount);
  const hasItems = items.length > 0;
  useEffect(() => {
    if (!hasItems || !slot.current) return undefined;
    const map = slot.current.parentElement;
    const update = ({ width, height }) => {
      if (width > 0 && height > 0) setCompact(width < 900 || height < 560);
    };
    update(map.getBoundingClientRect());
    const observer = new ResizeObserver(([entry]) => {
      if (entry) update(entry.contentRect);
    });
    observer.observe(map);
    return () => observer.disconnect();
  }, [hasItems]);
  if (!hasItems) return null;
  const visible = !compact || expanded;
  return (
    <div ref={slot} className={`ov ov--bc lt-map-key-slot${compact ? ' is-compact' : ''}`}>
      {compact ? (
        <button
          type="button"
          className="lt-map-key-toggle"
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => setExpanded((value) => !value)}
        >
          Map legend{' '}
          {expanded ? (
            <ChevronDown size={14} aria-hidden="true" />
          ) : (
            <ChevronUp size={14} aria-hidden="true" />
          )}
        </button>
      ) : null}
      <div id={contentId} className="lt-map-key" role="note" aria-label="Map key" hidden={!visible}>
        <div className="lt-map-key-symbols">{items}</div>
        {areas.length ? (
          <div className="lt-map-key-areas" role="group" aria-label="Place areas">
            <span className="lt-map-key-title">Areas</span>
            {areas.map((purpose) => (
              <span className="lt-map-key-item" key={purpose}>
                <i
                  className="lt-map-key-area"
                  style={{
                    borderColor: PURPOSE_COLOR[purpose],
                    backgroundColor: `${PURPOSE_COLOR[purpose]}1f`,
                  }}
                />
                {
                  { theft: 'Fuel-risk area', pump: 'Fuel-pump area', general: 'Other place area' }[
                    purpose
                  ]
                }
              </span>
            ))}
            <InfoTip
              label="About place area shading"
              text="Darker shading marks the busiest part. Pin icons show the place type."
            />
          </div>
        ) : null}
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
        <img className="lt-map-key-review" src={reviewPlaceIconUrl} alt="" /> Place to review
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
