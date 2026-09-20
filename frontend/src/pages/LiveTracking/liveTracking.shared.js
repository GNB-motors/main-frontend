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
 * Dark plate-pill marker matching the live-tracking map's selected-vehicle
 * marker — a dark chip with a status dot + the plate and a pointer. Used by the
 * internal map and the public single-vehicle share page so a pin means the same
 * thing in both.
 */
export const plateMarkerIcon = (plate, color) => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="124" height="48" viewBox="0 0 124 48">
    <defs>
      <filter id="pm" x="-10%" y="-10%" width="120%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.35"/>
      </filter>
    </defs>
    <g filter="url(#pm)">
      <rect x="2" y="2" width="120" height="32" rx="7" fill="#0C1020" stroke="${color}" stroke-width="1.75"/>
      <circle cx="14" cy="18" r="5" fill="${color}"/>
      <text x="25" y="22" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" letter-spacing="0.4">${plate}</text>
      <polygon points="56,34 68,34 62,43" fill="#0C1020"/>
      <polygon points="57,34 67,34 62,42" fill="${color}"/>
    </g>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(124, 48),
    anchor: new window.google.maps.Point(62, 45),
  };
};

/* Muted map styles shared by the internal live map and the public share page,
   so both render the same understated cartography (light + dark variants). */
export const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f0f3f6' }] },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ visibility: 'on' }, { color: '#7b8794' }, { weight: 1.5 }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ visibility: 'on' }, { color: '#475569' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'on' }, { color: '#ffffff' }, { weight: 2 }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ visibility: 'on' }, { color: '#9daab8' }, { weight: 1.2 }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'labels.text.fill',
    stylers: [{ visibility: 'on' }, { color: '#64748b' }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'on' }, { color: '#ffffff' }, { weight: 2 }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ visibility: 'on' }, { color: '#1e293b' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'on' }, { color: '#ffffff' }, { weight: 2 }],
  },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e2e8f0' }, { weight: 1 }],
  },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#edf2f7' }] },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cbd5e1' }, { weight: 1 }],
  },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#d8dee4' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
];

export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d111e' }] },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [{ visibility: 'on' }, { color: '#43516f' }, { weight: 1.5 }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ visibility: 'on' }, { color: '#cbd5e1' }],
  },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'on' }, { color: '#090d18' }, { weight: 2 }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'geometry.stroke',
    stylers: [{ visibility: 'on' }, { color: '#2d3a54' }, { weight: 1.2 }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'labels.text.fill',
    stylers: [{ visibility: 'on' }, { color: '#94a3b8' }],
  },
  {
    featureType: 'administrative.province',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'on' }, { color: '#090d18' }, { weight: 2 }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ visibility: 'on' }, { color: '#e2e8f0' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.stroke',
    stylers: [{ visibility: 'on' }, { color: '#090d18' }, { weight: 2 }],
  },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#161b2e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#101524' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#242c4b' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1a2038' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#070a12' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
];

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
      <g transform="translate(34, 29)">
        ${
          isSelected
            ? `<circle r="26" fill="none" stroke="${coneStroke}" stroke-width="2" stroke-dasharray="4 3" opacity="0.8"/>`
            : ''
        }
        <g transform="rotate(${courseDegrees})">
          <path d="M 0 0 L -22 -34 A 38 38 0 0 1 22 -34 Z"
                fill="${coneFill}"
                stroke="${coneStroke}"
                stroke-width="1.2"/>
          <rect x="-7" y="-12" width="14" height="24" rx="4"
                fill="${cabFill}"
                stroke="#0F172A"
                stroke-width="1.5"/>
          <rect x="-5" y="-10" width="10" height="7" rx="2"
                fill="#F8FAFC"
                opacity="0.9"/>
          <line x1="0" y1="-12" x2="0" y2="-16" stroke="#0F172A" stroke-width="2"/>
          <circle cx="0" cy="-17" r="1.5" fill="#EF4444"/>
        </g>
        <circle r="2.5" fill="#FFFFFF" stroke="#0F172A" stroke-width="1"/>
      </g>
      ${
        showLabel && registrationNumber
          ? `
        <g transform="translate(34, 66)">
          <rect x="-30" y="-10" width="60" height="18" rx="4"
                fill="#0F172A"
                stroke="#334155"
                stroke-width="1"/>
          <text x="0" y="3"
                fill="#FFFFFF"
                font-family="system-ui, -apple-system, sans-serif"
                font-size="10"
                font-weight="700"
                text-anchor="middle"
                letter-spacing="0.5">
            ${registrationNumber.slice(-8)}
          </text>
        </g>
      `
          : ''
      }
    </svg>
  `;

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize:
      typeof window !== 'undefined' && window.google
        ? new window.google.maps.Size(svgWidth, svgHeight)
        : undefined,
    anchor:
      typeof window !== 'undefined' && window.google
        ? new window.google.maps.Point(34, 29)
        : undefined,
  };
};

/**
 * Cluster badge style generator
 */
export const CLUSTER_STYLES = [
  {
    textColor: '#FFFFFF',
    textSize: 12,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '700',
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#1E293B" stroke="#3B82F6" stroke-width="2"/>
        <circle cx="20" cy="20" r="14" fill="#3B82F6" opacity="0.2"/>
      </svg>`,
    )}`,
    height: 40,
    width: 40,
  },
  {
    textColor: '#FFFFFF',
    textSize: 13,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '700',
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="#1E293B" stroke="#6366F1" stroke-width="2.5"/>
        <circle cx="24" cy="24" r="17" fill="#6366F1" opacity="0.25"/>
      </svg>`,
    )}`,
    height: 48,
    width: 48,
  },
  {
    textColor: '#FFFFFF',
    textSize: 14,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '800',
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="26" fill="#0F172A" stroke="#8B5CF6" stroke-width="3"/>
        <circle cx="28" cy="28" r="20" fill="#8B5CF6" opacity="0.3"/>
      </svg>`,
    )}`,
    height: 56,
    width: 56,
  },
];

/** Resolve normalized vehicle status */
export const resolveVehicleStatus = (v) => {
  if (!v) return 'Offline';
  if (v.state === 'OFFLINE' || v.status === 'Offline' || v.status === 'offline' || v.isStale) {
    return 'Offline';
  }
  if (v.speed > 3 || v.status === 'Moving' || v.status === 'moving') {
    return 'Moving';
  }
  if (
    (v.ignition === true ||
      v.ignition === 'ON' ||
      v.status === 'Idling' ||
      v.status === 'idling') &&
    (v.speed <= 3 || !v.speed)
  ) {
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

/* =========================================================================
   NOVA EDGE PRO EXTENSIONS & CONSTANTS
   ========================================================================= */

export const NOVA_STATUS = {
  moving: { label: 'Moving', trip: 'In transit', c: '#187A32', tint: 'rgba(37,186,76,.12)' },
  idling: { label: 'Idling', trip: 'Halted', c: '#C56200', tint: 'rgba(240,170,72,.16)' },
  stopped: { label: 'Stopped', trip: 'At stop', c: '#6A43D8', tint: 'rgba(106,67,216,.12)' },
  offline: { label: 'Offline', trip: 'Pending', c: '#5D5D5E', tint: 'rgba(93,93,94,.12)' },
};

export const haversineKm = (a, b) => {
  if (!a || !b) return 0;
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

export const bearingDegrees = (a, b) => {
  if (!a || !b) return 0;
  const y = Math.sin(((b[1] - a[1]) * Math.PI) / 180) * Math.cos((b[0] * Math.PI) / 180);
  const x =
    Math.cos((a[0] * Math.PI) / 180) * Math.sin((b[0] * Math.PI) / 180) -
    Math.sin((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.cos(((b[1] - a[1]) * Math.PI) / 180);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
};

export const formatAgoText = (m) => {
  if (m == null || isNaN(m)) return '—';
  if (m < 1) return 'just now';
  if (m < 60) return `${Math.round(m)} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} hr ago`;
  if (m < 43200) return `${Math.floor(m / 1440)} day${m >= 2880 ? 's' : ''} ago`;
  return `${Math.floor(m / 43200)} months ago`;
};

export const formatISTTime = (d) => {
  if (!d) return '—';
  const dateObj = d instanceof Date ? d : new Date(d);
  return dateObj
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toUpperCase()
    .replace(' ', '');
};

export const formatISTDate = (d) => {
  if (!d) return '—';
  const dateObj = d instanceof Date ? d : new Date(d);
  return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const formatDayText = (m) => {
  const d = new Date(Date.now() - (m || 0) * 60000);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const formatFullStamp = (m) => {
  const d = new Date(Date.now() - (m || 0) * 60000);
  return `${formatISTTime(d)}, ${formatISTDate(d)} ${d.getFullYear()}`;
};

export const formatHrsText = (m) => {
  if (!m || isNaN(m)) return '0h 00m';
  return `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}m`;
};
