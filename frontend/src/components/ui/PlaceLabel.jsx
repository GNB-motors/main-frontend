import { useEffect, useState } from 'react';
import { MapPin, Fuel, Factory, ParkingCircle, Wrench, Route, Ticket } from 'lucide-react';
import { resolvePlace } from '../../services/PlaceService';

/**
 * PlaceLabel — a place is named, never shown as coordinates.
 * Renders kind icon + bold label + muted sub, with a map affordance.
 * Coordinates appear only in the hover tooltip (or the map link), never
 * as the visible label.
 *
 *   <PlaceLabel lat={site.centroidLat} lng={site.centroidLng} />
 *   <PlaceLabel place={alreadyResolvedPlace} />
 */
const KIND_ICON = {
  TOLL: Ticket,
  PUMP: Fuel,
  PLANT: Factory,
  PARKING: ParkingCircle,
  WORKSHOP: Wrench,
  HIGHWAY: Route,
};

export default function PlaceLabel({ lat, lng, place = null, showMap = true, className = '' }) {
  const key = lat == null || lng == null ? null : `${lat},${lng}`;
  // { key, place } of the last lookup; `place: null` = the lookup failed or found nothing.
  const [lookup, setLookup] = useState(null);

  useEffect(() => {
    if (place || key == null) return undefined;
    let alive = true;
    resolvePlace(lat, lng).then((p) => {
      if (alive) setLookup({ key, place: p ?? null });
    });
    return () => {
      alive = false;
    };
  }, [place, key, lat, lng]);

  if (key == null) return <span className="text-dim">—</span>;

  const numLat = Number(lat);
  const numLng = Number(lng);
  const tooltip = `${numLat.toFixed(5)}, ${numLng.toFixed(5)}`;
  const mapUrl = `https://www.google.com/maps?q=${numLat},${numLng}`;
  const resolved = place || (lookup?.key === key ? lookup.place : undefined);

  if (!resolved) {
    // undefined = still looking up; null = no name (PlaceService negative-caches failures).
    const text = resolved === undefined ? 'Finding location…' : 'View on map';
    return showMap ? (
      <a
        href={mapUrl}
        target="_blank"
        rel="noreferrer"
        className={`place-label place-label--pending ${className}`.trim()}
        title={tooltip}
      >
        <MapPin size={12} />
        <span className="place-label-main">{text}</span>
      </a>
    ) : (
      <span className="text-dim" title={tooltip}>
        {resolved === undefined ? '…' : '—'}
      </span>
    );
  }

  const Icon = KIND_ICON[resolved.kind] || MapPin;
  return (
    <span className={`place-label ${className}`.trim()} title={tooltip}>
      <Icon size={12} className="place-label-icon" />
      <span className="place-label-text">
        <span className="place-label-main">{resolved.label}</span>
        {resolved.sub ? <span className="place-label-sub">{resolved.sub}</span> : null}
      </span>
      {showMap ? (
        <a
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open in map"
          className="place-label-map"
        >
          <MapPin size={11} />
        </a>
      ) : null}
    </span>
  );
}
