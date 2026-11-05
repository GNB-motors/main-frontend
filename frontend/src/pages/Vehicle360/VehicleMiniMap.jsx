import { googleMapsLoaderOptions } from '../../utils/googleMapsLoader.js';
import { useMemo } from 'react';
import { GoogleMap, useLoadScript, MarkerF } from '@react-google-maps/api';
import { INDIA_CENTER } from '../LiveTracking/liveTrackingConstants.js';
import { getStateMeta, NOVA_STATUS } from '../LiveTracking/statusPalettes.js';
import { pinIcon } from '../LiveTracking/mapIcons.js';
import { formatNum, timeAgo } from '../../utils/formatters';

const MAP_CONTAINER_STYLE = { width: '100%', height: '100%', borderRadius: 'inherit' };

/**
 * Small single-vehicle map for the hero card — same marker styling as the
 * full Live Tracking page and the org-wide dashboard mini-map
 * (`LiveTracking/mapIcons.js`), so a pin means the same thing everywhere.
 *
 * `livePosition` arrives once with the rest of the vehicle profile fetch; this
 * widget does not poll on its own, and it never reverse-geocodes the pin (see
 * CLAUDE.md's geocoding cost landmine) — the coordinates are shown as-is.
 * Status and staleness are derived from `livePosition.view` (pure canonical
 * liveVehicleView reader) rather than trusted raw DB fields.
 */
export default function VehicleMiniMap({ livePosition }) {
  const { isLoaded } = useLoadScript(googleMapsLoaderOptions);

  const hasFix = livePosition?.latitude != null && livePosition?.longitude != null;
  const center = useMemo(
    () => (hasFix ? { lat: livePosition.latitude, lng: livePosition.longitude } : INDIA_CENTER),
    [hasFix, livePosition],
  );

  const view = livePosition?.view;
  const statusKey = view?.status || (livePosition?.state ? String(livePosition.state).toLowerCase() : 'offline');
  const novaMeta = NOVA_STATUS[statusKey];
  const fallbackMeta = getStateMeta(livePosition?.state);
  const color = novaMeta?.c || fallbackMeta.color;
  const label = novaMeta?.label || fallbackMeta.label;
  const isOffline = view?.isOffline ?? (livePosition?.isStale || livePosition?.state === 'OFFLINE');
  const speed = view?.speedKmh ?? (livePosition?.speed != null ? Math.round(livePosition.speed) : null);
  const fixTime = view?.lastFixAt || livePosition?.eventDateTime || livePosition?.pulledAt;

  let badgeText = label;
  if (statusKey === 'moving' && speed != null && speed > 0) {
    badgeText = `Moving · ${formatNum(speed)} km/h`;
  } else if (statusKey === 'idling') {
    badgeText = 'Idling · Engine on';
  } else if (statusKey === 'stopped') {
    badgeText = 'Stopped';
  } else if (isOffline) {
    badgeText = 'Offline';
  }
  if (fixTime) {
    badgeText += ` · ${timeAgo(fixTime)}`;
  }

  if (!googleMapsLoaderOptions.googleMapsApiKey) {
    return (
      <div className="v360-minimap v360-minimap--empty">
        <span className="v360-empty-title">Map unavailable</span>
        <span className="v360-empty-hint">No Google Maps key is configured.</span>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="v360-minimap v360-minimap--loading" aria-hidden="true" />;
  }

  if (!hasFix) {
    return (
      <div className="v360-minimap v360-minimap--empty">
        <span className="v360-empty-title">No live position</span>
        <span className="v360-empty-hint">Appears once live tracking polls this vehicle.</span>
      </div>
    );
  }

  return (
    <div className="v360-minimap">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={13}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'cooperative',
        }}
      >
        <MarkerF
          position={center}
          icon={pinIcon(color, isOffline)}
          title={speed != null && speed > 0 ? `${formatNum(speed)} km/h` : label}
        />
      </GoogleMap>
      <span className="v360-minimap-badge">
        <span
          className="v360-minimap-badge-dot"
          style={{ background: color }}
          aria-hidden="true"
        />
        {badgeText}
      </span>
    </div>
  );
}
