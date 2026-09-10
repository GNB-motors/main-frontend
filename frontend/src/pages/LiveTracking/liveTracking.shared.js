import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

/**
 * Presentation helpers for live vehicle positions, shared by the full Live
 * Tracking page and the dashboard's embedded mini-map so the two views can
 * never disagree about colours, state labels or timestamps.
 */

export const IST_ZONE = 'Asia/Kolkata';

export const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

// Reads our own DB; the backend cron is what talks to FleetEdge.
export const POLL_INTERVAL_MS = 45 * 1000;

export const STATE_META = {
  ACTIVE: { color: '#10B981', label: 'Active' },
  PARKED: { color: '#F59E0B', label: 'Parked' },
  OFFLINE: { color: '#94A3B8', label: 'Offline' },
};

export const getStateMeta = (state) => STATE_META[state] || STATE_META.OFFLINE;

export const toIST = (utcStr) => (utcStr ? dayjs.utc(utcStr).tz(IST_ZONE) : null);

export const formatIST = (utcStr) => {
  const d = toIST(utcStr);
  return d ? d.format('DD MMM YYYY, hh:mm A [IST]') : '—';
};

export const formatRelativeIST = (utcStr) => {
  const d = toIST(utcStr);
  return d ? d.fromNow() : null;
};

export const formatCardTime = (utcStr) => {
  const d = toIST(utcStr);
  return d ? d.format('h:mmA, DD MMM YYYY') : '—';
};

export const pinIcon = (color, dimmed) => ({
  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" opacity="${dimmed ? 0.55 : 1}">
          <path d="M16 0C7.16 0 0 7.16 0 16c0 12 16 24 16 24s16-12 16-24C32 7.16 24.84 0 16 0z" fill="${color}"/>
          <circle cx="16" cy="14" r="6" fill="white"/>
        </svg>`,
  )}`,
  scaledSize:
    typeof window !== 'undefined' && window.google
      ? new window.google.maps.Size(32, 40)
      : undefined,
});

/**
 * Enhanced directional vehicle marker with rotated top-down truck,
 * status-colored radar beam/cone, and clean plate pill tag.
 */
export const createVehicleMarkerIcon = ({
  status = 'Stopped',
  courseDegrees = 0,
  registrationNumber = '',
  showLabel = true,
  isSelected = false,
}) => {
  const isMoving = status === 'Moving';
  const isIdling = status === 'Idling';
  const isStopped = status === 'Stopped';

  // Sensor cone colors matching Screenshot 2 (purple for Stopped, green for Moving)
  const coneFill = isMoving
    ? 'rgba(34, 197, 94, 0.4)'
    : isIdling
      ? 'rgba(245, 158, 11, 0.4)'
      : isStopped
        ? 'rgba(168, 85, 247, 0.4)'
        : 'rgba(148, 163, 184, 0.3)';

  const coneStroke = isMoving
    ? '#16A34A'
    : isIdling
      ? '#D97706'
      : isStopped
        ? '#9333EA'
        : '#64748B';

  const cabFill = isMoving ? '#22C55E' : isIdling ? '#F59E0B' : isStopped ? '#A855F7' : '#94A3B8';

  const labelHeight = showLabel && registrationNumber ? 24 : 0;
  const svgWidth = 68;
  const svgHeight = 58 + labelHeight;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      ${
        isSelected
          ? `
        <circle cx="34" cy="28" r="26" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-dasharray="4 3" opacity="0.9" />
      `
          : ''
      }

      <!-- Rotated Vehicle and Forward Beam -->
      <g transform="rotate(${courseDegrees || 0} 34 28)">
        <!-- Forward Sensor / Direction Beam projecting forward -->
        <path d="M 34 14 L 14 0 A 30 30 0 0 1 54 0 Z" fill="${coneFill}" stroke="${coneStroke}" stroke-width="1.2" stroke-dasharray="2.5 2" />
        
        <!-- Truck Chassis / Body -->
        <rect x="27" y="18" width="14" height="20" rx="2.5" fill="#FFFFFF" stroke="#334155" stroke-width="1.5" />
        
        <!-- Truck Cabin -->
        <rect x="28.5" y="10" width="11" height="9" rx="2" fill="${cabFill}" stroke="#1E293B" stroke-width="1.2" />
        
        <!-- Windshield -->
        <rect x="29.5" y="12" width="9" height="3" rx="1" fill="#E2E8F0" opacity="0.95" />
        
        <!-- Wheels / Side Mirrors -->
        <rect x="25" y="12" width="2" height="4" rx="1" fill="#1E293B" />
        <rect x="41" y="12" width="2" height="4" rx="1" fill="#1E293B" />
        <rect x="25" y="28" width="2" height="6" rx="1" fill="#1E293B" />
        <rect x="41" y="28" width="2" height="6" rx="1" fill="#1E293B" />
      </g>

      ${
        showLabel && registrationNumber
          ? `
        <!-- Plate Badge Pill (Unrotated) -->
        <g transform="translate(34, 55)">
          <rect x="-32" y="0" width="64" height="17" rx="3" fill="#FFFFFF" stroke="#64748B" stroke-width="1" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.35))" />
          <text x="0" y="12" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="800" fill="#000000" letter-spacing="0.2px">
            ${registrationNumber.slice(0, 11)}
          </text>
        </g>
      `
          : ''
      }
    </svg>
    `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    anchor:
      typeof window !== 'undefined' && window.google
        ? new window.google.maps.Point(34, 28)
        : undefined,
    scaledSize:
      typeof window !== 'undefined' && window.google
        ? new window.google.maps.Size(svgWidth, svgHeight)
        : undefined,
  };
};

/** MarkerClusterer styles for zoomed-out fleet overview */
export const CLUSTER_STYLES = [
  {
    textColor: '#FFFFFF',
    textSize: 13,
    fontWeight: '800',
    width: 44,
    height: 44,
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="21" fill="#1E1B4B" fill-opacity="0.85" stroke="#818CF8" stroke-width="2"/>
            <circle cx="22" cy="22" r="14" fill="#0F172A" fill-opacity="0.95"/>
          </svg>
        `)}`,
  },
  {
    textColor: '#FFFFFF',
    textSize: 14,
    fontWeight: '800',
    width: 50,
    height: 50,
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50">
            <circle cx="25" cy="25" r="24" fill="#1E1B4B" fill-opacity="0.85" stroke="#A78BFA" stroke-width="2.5"/>
            <circle cx="25" cy="25" r="16" fill="#0F172A" fill-opacity="0.95"/>
          </svg>
        `)}`,
  },
  {
    textColor: '#FFFFFF',
    textSize: 15,
    fontWeight: '800',
    width: 56,
    height: 56,
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="27" fill="#1E1B4B" fill-opacity="0.85" stroke="#C084FC" stroke-width="3"/>
            <circle cx="28" cy="28" r="18" fill="#0F172A" fill-opacity="0.95"/>
          </svg>
        `)}`,
  },
];

/** Resolve normalized vehicle status */
export const resolveVehicleStatus = (v) => {
  if (!v) return 'Offline';
  if (v.state === 'OFFLINE' || v.status === 'Offline' || v.isStale) {
    return 'Offline';
  }
  if (v.speed > 3 || v.status === 'Moving') {
    return 'Moving';
  }
  if ((v.ignition === true || v.status === 'Idling') && v.speed <= 3) {
    return 'Idling';
  }
  return 'Stopped';
};

/** Status configuration for tabs, indicators and cards */
export const STATUS_CONFIG = {
  All: { label: 'All', color: '#0F172A', barColor: '#0F172A' },
  Moving: { label: 'Moving', color: '#10B981', barColor: '#10B981' },
  Stopped: { label: 'Stopped', color: '#8B5CF6', barColor: '#8B5CF6' },
  Idling: { label: 'Idling', color: '#F59E0B', barColor: '#F59E0B' },
  Offline: { label: 'Offline', color: '#94A3B8', barColor: '#94A3B8' },
  Breakdown: { label: 'Breakdown', color: '#EF4444', barColor: '#EF4444' },
  Faulty: { label: 'Faulty', color: '#84CC16', barColor: '#84CC16' },
  Geofence: { label: 'Geofence', color: '#3B82F6', barColor: '#3B82F6' },
};

/** Only rows the map can actually plot. */
export const withCoordinates = (positions) =>
  (positions || []).filter((p) => p.latitude != null && p.longitude != null);

/** Frame every plotted vehicle at once instead of a fixed country-wide zoom. */
export const fitMapToPositions = (map, located) => {
  if (!map || !window.google || !located?.length) return;

  if (located.length === 1) {
    map.setCenter({ lat: located[0].latitude, lng: located[0].longitude });
    map.setZoom(12);
    return;
  }

  const bounds = new window.google.maps.LatLngBounds();
  located.forEach((p) => bounds.extend({ lat: p.latitude, lng: p.longitude }));
  map.fitBounds(bounds, 60);
};
