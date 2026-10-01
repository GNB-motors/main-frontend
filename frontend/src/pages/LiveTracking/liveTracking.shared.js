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

/**
 * Repeating direction arrows for a breadcrumb polyline — gives the trail a clear
 * sense of travel direction (points run oldest→newest). Used by both the
 * internal live map and the public share page. Returns undefined until the
 * Google Maps SDK is ready.
 */
export const trailArrowIcons = (color) => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  return [
    {
      icon: {
        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 2.6,
        strokeColor: '#ffffff',
        strokeWeight: 1,
        fillColor: color,
        fillOpacity: 1,
      },
      offset: '3%',
      repeat: '110px',
    },
  ];
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

export const STATUS_THEME = {
  moving: {
    primary: '#0C9F41',
    dark: '#088B36',
    mid: '#07A33E',
    beamOpacity: 0.55,
  },
  stopped: {
    primary: '#9333EA',
    dark: '#7E22CE',
    mid: '#9333EA',
    beamOpacity: 0.35,
  },
  idling: {
    primary: '#F97316',
    dark: '#C2410C',
    mid: '#EA580C',
    beamOpacity: 0.5,
  },
  offline: {
    primary: '#9CA3AF',
    dark: '#6B7280',
    mid: '#9CA3AF',
    beamOpacity: 0.25,
  },
  breakdown: {
    primary: '#EF4444',
    dark: '#DC2626',
    mid: '#EF4444',
    beamOpacity: 0.45,
  },
  workshop: {
    primary: '#EF4444',
    dark: '#DC2626',
    mid: '#EF4444',
    beamOpacity: 0.45,
  },
  faulty: {
    primary: '#84CC16',
    dark: '#65A30D',
    mid: '#84CC16',
    beamOpacity: 0.45,
  },
  geofence: {
    primary: '#3B82F6',
    dark: '#2563EB',
    mid: '#3B82F6',
    beamOpacity: 0.45,
  },
};

/**
 * Authentic telematics top-down truck marker with conical flashlight beam
 * matching WheelsEye telematics standard.
 * The forward conical flashlight beam points in the vehicle heading/direction of travel.
 * Supports both function signatures:
 * 1) createVehicleMarkerIcon(vehicleObj, isSelected, showLabel)
 * 2) createVehicleMarkerIcon({ status, courseDegrees, speed, registrationNumber, showLabel, isSelected })
 */
export const createVehicleMarkerIcon = (arg1, arg2, arg3, arg4) => {
  let v = {};
  let isSelected = false;
  let showLabel = false;
  let zoom = 12;

  if (arg1 && typeof arg1 === 'object') {
    if (typeof arg2 === 'boolean' || typeof arg3 === 'boolean') {
      v = arg1;
      isSelected = !!arg2;
      showLabel = !!arg3;
      zoom = typeof arg4 === 'number' ? arg4 : 12;
    } else {
      v = arg1;
      isSelected = !!arg1.isSelected;
      showLabel = !!arg1.showLabel;
      zoom = typeof arg1.zoom === 'number' ? arg1.zoom : typeof arg2 === 'number' ? arg2 : 12;
    }
  }

  // Relative sizing based on map zoom:
  // Smoothly increases marker & label dimensions as the client zooms in,
  // and compacts them when zoomed out to prevent map clutter.
  const effectiveZoom =
    typeof zoom === 'number' && !isNaN(zoom) ? Math.max(4, Math.min(20, zoom)) : 12;

  // Continuous, responsive scale curve from zoom 4 (national overview) to zoom 20 (street level):
  let scale = 1.0;
  if (effectiveZoom >= 17) scale = 1.65;
  else if (effectiveZoom === 16) scale = 1.5;
  else if (effectiveZoom === 15) scale = 1.35;
  else if (effectiveZoom === 14) scale = 1.2;
  else if (effectiveZoom === 13) scale = 1.08;
  else if (effectiveZoom === 12) scale = 0.98;
  else if (effectiveZoom === 11) scale = 0.88;
  else if (effectiveZoom === 10) scale = 0.78;
  else if (effectiveZoom === 9) scale = 0.68;
  else if (effectiveZoom === 8) scale = 0.6;
  else if (effectiveZoom === 7) scale = 0.54;
  else scale = 0.48;

  if (isSelected) {
    scale = Math.max(1.25, Number((scale * 1.18).toFixed(2)));
  }

  const rawStatus = (v.status || '').toString().toLowerCase();
  const rawState = (v.state || '').toString().toLowerCase();
  const isIgnitionOn =
    v.ignition === true ||
    v.ignition === 'ON' ||
    v.ignition === 'on' ||
    v.ignition === 1 ||
    v.ignition === '1';
  const speed = typeof v.speed === 'number' && !isNaN(v.speed) ? v.speed : 0;

  let statusKey = 'offline';
  if (v.isStale || rawState === 'offline' || rawStatus === 'offline' || rawStatus.includes('off')) {
    statusKey = 'offline';
  } else if (rawStatus.includes('mov') || speed > 3) {
    statusKey = 'moving';
  } else if (
    rawStatus.includes('idl') ||
    rawState.includes('idl') ||
    (isIgnitionOn && speed <= 3 && rawState !== 'offline')
  ) {
    statusKey = 'idling';
  } else if (rawStatus.includes('break') || rawStatus.includes('workshop')) {
    statusKey = 'breakdown';
  } else if (rawStatus.includes('fault')) {
    statusKey = 'faulty';
  } else if (rawStatus.includes('geo')) {
    statusKey = 'geofence';
  } else if (rawStatus.includes('stop') || rawState.includes('park')) {
    statusKey = 'stopped';
  } else if (!isIgnitionOn && speed <= 3) {
    statusKey = 'stopped';
  } else {
    statusKey = 'offline';
  }

  const theme = STATUS_THEME[statusKey] || STATUS_THEME.offline;
  const course =
    v.courseDegrees != null ? Number(v.courseDegrees) : v.heading != null ? Number(v.heading) : 0;
  const heading = isNaN(course) ? 0 : course;
  const plateText = (v.plate || v.registrationNumber || '').toString().trim();

  // To avoid unreadable clutter across India when zoomed out (< 10),
  // labels for unselected vehicles appear once the user zooms into district/city level (zoom >= 10).
  // Selected vehicles always display their plate label.
  const hasLabel = Boolean(
    plateText.length > 0 && (isSelected || (showLabel && effectiveZoom >= 10)),
  );
  const shortPlate = plateText.length > 12 ? plateText.slice(-10) : plateText;
  const labelFontSize = effectiveZoom >= 16 ? 15 : effectiveZoom >= 13 ? 14 : 13;

  // ViewBox: 96x96 base (or 96x124 with label plate)
  const vbW = 96;
  const vbH = hasLabel ? 124 : 96;

  // Render authentic WheelsEye MovingTruckV2 SVG paths inside rotated wrapper:
  // Center of the truck is translated to (48, 48) and rotated around (48, 48)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${vbW}" height="${vbH}" viewBox="0 0 ${vbW} ${vbH}" fill="none">
    <defs>
      <filter id="fl-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000000" flood-opacity="0.32"/>
      </filter>
    </defs>

    ${
      isSelected
        ? `<circle cx="48" cy="48" r="41" fill="${theme.primary}" fill-opacity="0.12"/>
           <circle cx="48" cy="48" r="37" fill="none" stroke="${theme.primary}" stroke-width="2.5" stroke-dasharray="5 3" opacity="0.9"/>`
        : ''
    }

    <!-- Rotated Vehicle Assembly with Flashlight Beam -->
    <g transform="rotate(${Math.round(heading)}, 48, 48)" filter="url(#fl-glow)">
      <g transform="translate(21, 11)">
        <!-- Forward Flashlight Beam (conical ray pointing along travel heading) -->
        <path d="M53.1321 14.2725C54.2984 13.0672 54.3053 11.1033 53.0552 9.99141C49.8448 7.13608 46.2104 4.82224 42.2854 3.14213C37.4394 1.0677 32.2454 1.10333e-07 27 0C21.7546 -1.10333e-07 16.5606 1.0677 11.7146 3.14213C7.78963 4.82224 4.1552 7.13607 0.944803 9.99141C-0.305306 11.1033 -0.298404 13.0672 0.867852 14.2725L24.8883 39.0961C26.0545 40.3013 27.9455 40.3013 29.1117 39.0961L53.1321 14.2725Z" fill="${theme.primary}" fill-opacity="${theme.beamOpacity}"/>

        <!-- Rear Bumper & Chassis Elements -->
        <path fill-rule="evenodd" clip-rule="evenodd" d="M36.725 73.833H17.9717C17.7241 73.8251 17.4895 73.7251 17.3172 73.5541C17.145 73.3831 17.0487 73.1545 17.0487 72.9165C17.0487 72.6785 17.145 72.4499 17.3172 72.2789C17.4895 72.1079 17.7241 72.0079 17.9717 72H36.725C36.9726 72.0079 37.2072 72.1079 37.3795 72.2789C37.5517 72.4499 37.648 72.6785 37.648 72.9165C37.648 73.1545 37.5517 73.3831 37.3795 73.5541C37.2072 73.7251 36.9726 73.8251 36.725 73.833Z" fill="#2E2E2E"/>

        <!-- Truck Cargo Bed & Tanker Geometry with Status Styling -->
        <path fill-rule="evenodd" clip-rule="evenodd" d="M18.0675 42H36.8031L34.7214 72.133C34.6862 72.64 34.4514 73.1152 34.0648 73.462C33.6781 73.8088 33.1686 74.0011 32.6396 74H22.2309C21.702 74.0011 21.1925 73.8088 20.8058 73.462C20.4191 73.1152 20.1844 72.64 20.1492 72.133L18.0675 42Z" fill="${statusKey === 'idling' ? '#C2410C' : statusKey === 'offline' ? '#9CA3AF' : '#888888'}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M20.0353 43.7778H34.8375L32.3707 72.2208H22.5022L20.0353 43.7778Z" fill="${statusKey === 'idling' ? '#FED7AA' : statusKey === 'offline' ? '#E5E7EB' : 'white'}" fill-opacity="${statusKey === 'idling' || statusKey === 'offline' ? 0.95 : 0.8}"/>

        <!-- Wheels (Front & Rear Pairs) -->
        <path fill-rule="evenodd" clip-rule="evenodd" d="M18.4161 33.333H16.5062C16.3702 33.3349 16.2391 33.2848 16.1415 33.1939C16.0439 33.103 15.9879 32.9786 15.9857 32.848V28.985C15.9882 28.8545 16.0443 28.7302 16.1418 28.6394C16.2393 28.5485 16.3703 28.4984 16.5062 28.5H18.4161C18.5521 28.4981 18.6832 28.5481 18.7808 28.6391C18.8784 28.73 18.9344 28.8544 18.9366 28.985V32.848C18.9344 32.9786 18.8784 33.103 18.7808 33.1939C18.6832 33.2848 18.5521 33.3349 18.4161 33.333ZM37.3214 33.333H35.7622C35.6268 33.333 35.4968 33.2824 35.3996 33.1919C35.3024 33.1013 35.2458 32.978 35.2418 32.848V28.985C35.2458 28.855 35.3024 28.7316 35.3996 28.6411C35.4968 28.5505 35.6268 28.4999 35.7622 28.5H37.3235C37.4589 28.4999 37.5889 28.5505 37.6861 28.6411C37.7833 28.7316 37.8399 28.855 37.8439 28.985V32.848C37.8399 32.978 37.7833 33.1013 37.6861 33.1919C37.5889 33.2824 37.4589 33.333 37.3235 33.333M19.1083 63.5H17.547C17.4117 63.5 17.2816 63.4494 17.1844 63.3589C17.0873 63.2683 17.0306 63.145 17.0266 63.015V59.152C17.0306 59.022 17.0873 58.8986 17.1844 58.8081C17.2816 58.7175 17.4117 58.6669 17.547 58.667H19.1083C19.2437 58.6669 19.3737 58.7175 19.4709 58.8081C19.5681 58.8986 19.6247 59.022 19.6288 59.152V63.015C19.6247 63.145 19.5681 63.2683 19.4709 63.3589C19.3737 63.4494 19.2437 63.5 19.1083 63.5ZM37.1497 63.5H35.5884C35.453 63.5 35.323 63.4494 35.2258 63.3589C35.1286 63.2683 35.072 63.145 35.0679 63.015V59.152C35.072 59.022 35.1286 58.8986 35.2258 58.8081C35.323 58.7175 35.453 58.6669 35.5884 58.667H37.1497C37.285 58.6669 37.4151 58.7175 37.5123 58.8081C37.6094 58.8986 37.6661 59.022 37.6701 59.152V63.015C37.6661 63.145 37.6094 63.2683 37.5123 63.3589C37.4151 63.4494 37.285 63.5 37.1497 63.5ZM19.1083 69.333H17.547C17.4117 69.333 17.2816 69.2824 17.1844 69.1919C17.0873 69.1013 17.0306 68.978 17.0266 68.848V64.985C17.0306 64.855 17.0873 64.7316 17.1844 64.6411C17.2816 64.5505 17.4117 64.4999 17.547 64.5H19.1083C19.2437 64.4999 19.3737 64.5505 19.4709 64.6411C19.5681 64.7316 19.6247 64.855 19.6288 64.985V68.848C19.6247 68.978 19.5681 69.1013 19.4709 69.1919C19.3737 69.2824 19.2437 69.333 19.1083 69.333ZM37.1497 69.333H35.5884C35.453 69.333 35.323 69.2824 35.2258 69.1919C35.1286 69.1013 35.072 68.978 35.0679 68.848V64.985C35.072 64.855 35.1286 64.7316 35.2258 64.6411C35.323 64.5505 35.453 64.4999 35.5884 64.5H37.1497C37.285 64.4999 37.4151 64.5505 37.5123 64.6411C37.6094 64.7316 37.6661 64.855 37.6701 64.985V68.848C37.6661 68.978 37.6094 69.1013 37.5123 69.1919C37.4151 69.2824 37.285 69.333 37.1497 69.333Z" fill="#2E2E2E"/>

        <!-- Details / Rivets -->
        <path fill-rule="evenodd" clip-rule="evenodd" d="M27.3489 51.833C26.92 51.833 26.5009 51.7108 26.1443 51.4819C25.7878 51.2531 25.5099 50.9277 25.3458 50.5471C25.1817 50.1665 25.1387 49.7477 25.2224 49.3436C25.306 48.9396 25.5125 48.5684 25.8158 48.2771C26.119 47.9858 26.5053 47.7874 26.9259 47.707C27.3464 47.6266 27.7824 47.6679 28.1786 47.8256C28.5747 47.9832 28.9133 48.2502 29.1516 48.5927C29.3898 48.9353 29.517 49.338 29.517 49.75C29.517 50.3024 29.2886 50.8323 28.882 51.2229C28.4753 51.6135 27.9239 51.833 27.3489 51.833ZM27.3489 64.5C26.92 64.5 26.5009 64.3778 26.1443 64.1489C25.7878 63.9201 25.5099 63.5947 25.3458 63.2141C25.1817 62.8335 25.1387 62.4147 25.2224 62.0106C25.306 61.6066 25.5125 61.2354 25.8158 60.9441C26.119 60.6528 26.5053 60.4544 26.9259 60.374C27.3464 60.2936 27.7824 60.3349 28.1786 60.4926C28.5747 60.6502 28.9133 60.9172 29.1516 61.2597C29.3898 61.6023 29.517 62.005 29.517 62.417C29.5167 62.9694 29.2882 63.499 28.8816 63.8896C28.4751 64.2802 27.9238 64.4997 27.3489 64.5Z" fill="white"/>

        <!-- Mirrors -->
        <path fill-rule="evenodd" clip-rule="evenodd" d="M16.0587 23.0559L17.1963 24.1479C17.2996 24.247 17.3605 24.3798 17.367 24.5199H18.5599C18.6403 24.5197 18.7178 24.4912 18.7779 24.4398C18.8379 24.3884 18.8762 24.3176 18.8857 24.2409V24.2049V23.6899H19.2229V24.1999C19.2228 24.3607 19.1595 24.5155 19.0456 24.6332C18.9317 24.751 18.7757 24.8231 18.6088 24.8349H18.5599H17.2817L17.264 24.8599L17.1963 24.9379C17.1418 24.9906 17.0769 25.0325 17.0055 25.061C16.934 25.0896 16.8574 25.1043 16.78 25.1043C16.7026 25.1043 16.626 25.0896 16.5545 25.061C16.4831 25.0325 16.4182 24.9906 16.3636 24.9379L15.2301 23.8519C15.1197 23.7458 15.0577 23.6019 15.0577 23.4519C15.0577 23.3019 15.1197 23.158 15.2301 23.0519C15.3406 22.9458 15.4903 22.8862 15.6465 22.8862C15.8026 22.8862 15.9524 22.9458 16.0628 23.0519L16.0587 23.0559ZM38.073 23.0929C38.1866 22.9912 38.3376 22.937 38.4928 22.9423C38.648 22.9475 38.7946 23.0118 38.9005 23.1209C39.0064 23.2301 39.0628 23.3751 39.0573 23.5242C39.0518 23.6733 38.985 23.8142 38.8714 23.9159L37.6952 24.9699C37.6387 25.0209 37.5723 25.0606 37.4998 25.0867C37.4273 25.1129 37.3502 25.1251 37.2728 25.1224C37.1954 25.1198 37.1193 25.1026 37.0489 25.0716C36.9784 25.0406 36.9151 24.9965 36.8625 24.9419L36.798 24.8619L36.7813 24.8359L35.5042 24.7939H35.4552C35.2888 24.7768 35.1354 24.6997 35.0258 24.5781C34.9163 24.4566 34.8588 24.2996 34.8651 24.1389L34.8838 23.6239L35.2179 23.6349L35.1992 24.1499V24.1869C35.2059 24.2634 35.2412 24.3349 35.2986 24.3882C35.3561 24.4416 35.4317 24.4731 35.5114 24.4769L36.7022 24.5169C36.7136 24.3767 36.7793 24.2457 36.8864 24.1499L38.073 23.0929Z" fill="#444444"/>

        <!-- Cabin Base & Hood with Dynamic Status Colors -->
        <path fill-rule="evenodd" clip-rule="evenodd" d="M21.6461 41.508C20.5808 41.4893 19.5664 41.0665 18.8244 40.3319C18.0824 39.5973 17.673 38.6106 17.6856 37.587V25.922C17.6727 24.8983 18.082 23.9112 18.8241 23.1764C19.5661 22.4416 20.5806 22.0187 21.6461 22H32.4607C33.5252 22.02 34.5384 22.4435 35.2793 23.1782C36.0202 23.9128 36.4288 24.8991 36.416 25.922V37.587C36.4285 38.6097 36.0198 39.5957 35.279 40.3302C34.5381 41.0647 33.5251 41.488 32.4607 41.508H21.6461Z" fill="${theme.dark}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M21.6468 41.5079C20.6232 41.5292 19.6325 41.1608 18.8905 40.483C18.1486 39.8052 17.7157 38.8731 17.6863 37.8899V27.1269C17.7157 26.1437 18.1486 25.2114 18.8905 24.5335C19.6324 23.8556 20.6231 23.4869 21.6468 23.5079H32.4614C33.4842 23.488 34.4738 23.8572 35.2146 24.535C35.9555 25.2128 36.3875 26.1445 36.4167 27.1269V37.8899C36.3875 38.8723 35.9554 39.8038 35.2146 40.4815C34.4737 41.1592 33.4841 41.5281 32.4614 41.5079H21.6468Z" fill="${theme.mid}"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M32.4523 49H22.4183C21.6336 48.9979 20.8816 48.6977 20.3264 48.1649C19.7713 47.6321 19.458 46.9099 19.455 46.156V37.343C19.458 36.589 19.7714 35.8668 20.3269 35.3341C20.8823 34.8015 21.6345 34.5016 22.4193 34.5H32.4512C33.2359 34.5018 33.988 34.8018 34.5434 35.3344C35.0988 35.8671 35.4123 36.5891 35.4156 37.343V46.156C35.4126 46.9101 35.0992 47.6324 34.5438 48.1652C33.9884 48.6981 33.2372 48.9982 32.4523 49Z" fill="${theme.dark}"/>

        <!-- Windshield & Cabin Glass -->
        <path fill-rule="evenodd" clip-rule="evenodd" d="M18.9366 29.528V36.909L21.0287 36.874V32.3L18.9366 29.528ZM35.782 29.563V36.944L33.5816 36.909V32.335L35.782 29.563ZM20.5582 27.424L22.437 31.063C23.9093 30.3419 25.5374 29.9634 27.19 29.9582C28.8426 29.953 30.4733 30.3212 31.9505 31.033L33.796 27.395C33.796 27.395 27.3114 22.767 20.5561 27.424" fill="white"/>

        <!-- Roof Grooves -->
        <path opacity="0.12" fill-rule="evenodd" clip-rule="evenodd" d="M23.0277 40.1628C22.9372 40.1623 22.8505 40.1275 22.7865 40.0658C22.7226 40.0042 22.6866 39.9208 22.6863 39.8338V32.6158C22.6863 32.5289 22.7223 32.4454 22.7863 32.3839C22.8503 32.3224 22.9372 32.2878 23.0277 32.2878C23.1183 32.2878 23.2051 32.3224 23.2691 32.3839C23.3331 32.4454 23.3691 32.5289 23.3691 32.6158V39.8338C23.3688 39.9208 23.3328 40.0042 23.2689 40.0658C23.2049 40.1275 23.1183 40.1623 23.0277 40.1628ZM25.7808 40.1628C25.6903 40.1623 25.6036 40.1275 25.5396 40.0658C25.4757 40.0042 25.4397 39.9208 25.4394 39.8338V32.6158C25.4442 32.5319 25.4824 32.4528 25.546 32.395C25.6095 32.3372 25.6938 32.305 25.7813 32.305C25.8689 32.305 25.9531 32.3372 26.0167 32.395C26.0803 32.4528 26.1184 32.5319 26.1233 32.6158V39.8338C26.123 39.921 26.0868 40.0045 26.0227 40.0662C25.9585 40.1278 25.8715 40.1626 25.7808 40.1628ZM28.3674 40.1628C28.2768 40.1623 28.1901 40.1275 28.1262 40.0658C28.0623 40.0042 28.0262 39.9208 28.026 39.8338V32.6158C28.0308 32.5319 28.0689 32.4528 28.1325 32.395C28.1961 32.3372 28.2803 32.305 28.3679 32.305C28.4554 32.305 28.5397 32.3372 28.6033 32.395C28.6669 32.4528 28.705 32.5319 28.7098 32.6158V39.8338C28.7095 39.921 28.6734 40.0045 28.6092 40.0662C28.545 40.1278 28.4581 40.1626 28.3674 40.1628ZM31.0913 40.1628C31.0008 40.1623 30.9141 40.1275 30.8501 40.0658C30.7862 40.0042 30.7502 39.9208 30.7499 39.8338V32.6158C30.7547 32.5319 30.7929 32.4528 30.8565 32.395C30.9201 32.3372 31.0043 32.305 31.0918 32.305C31.1794 32.305 31.2636 32.3372 31.3272 32.395C31.3908 32.4528 31.4289 32.5319 31.4338 32.6158V39.8338C31.4335 39.921 31.3973 40.0045 31.3332 40.0662C31.269 40.1278 31.1821 40.1626 31.0913 40.1628Z" fill="black"/>
      </g>
    </g>

    ${
      hasLabel
        ? `
      <!-- High-contrast crisp prominent number plate chip -->
      <g transform="translate(48, 108)">
        <rect x="-45" y="-12" width="90" height="24" rx="6" fill="#0C1020" stroke="${isSelected ? '#38BDF8' : '#94A3B8'}" stroke-width="${isSelected ? 2.5 : 1.5}"/>
        <text x="0" y="5" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif" font-size="${labelFontSize}" font-weight="900" text-anchor="middle" letter-spacing="0.5">
          ${shortPlate}
        </text>
      </g>
    `
        : ''
    }
  </svg>`;

  const baseW = 52;
  const baseH = hasLabel ? 68 : 52;
  const scaledW = Math.round(baseW * scale);
  const scaledH = Math.round(baseH * scale);
  const anchorX = Math.round(26 * scale);
  const anchorY = Math.round(26 * scale);

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize:
      typeof window !== 'undefined' && window.google
        ? new window.google.maps.Size(scaledW, scaledH)
        : undefined,
    anchor:
      typeof window !== 'undefined' && window.google
        ? new window.google.maps.Point(anchorX, anchorY)
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
  const rawStatus = (v.status || '').toString().toLowerCase();
  const rawState = (v.state || '').toString().toLowerCase();
  const isIgnitionOn =
    v.ignition === true ||
    v.ignition === 'ON' ||
    v.ignition === 'on' ||
    v.ignition === 1 ||
    v.ignition === '1';
  const speed = typeof v.speed === 'number' && !isNaN(v.speed) ? v.speed : 0;

  if (v.isStale || rawState === 'offline' || rawStatus === 'offline' || rawStatus.includes('off')) {
    return 'Offline';
  }
  if (speed > 3 || rawStatus.includes('mov')) {
    return 'Moving';
  }
  if (rawStatus.includes('idl') || rawState.includes('idl') || (isIgnitionOn && speed <= 3)) {
    return 'Idling';
  }
  if (rawStatus.includes('break') || rawStatus.includes('workshop')) {
    return 'Breakdown';
  }
  if (rawStatus.includes('fault')) {
    return 'Faulty';
  }
  if (rawStatus.includes('geo')) {
    return 'Geofence';
  }
  return 'Stopped';
};

/** Status configuration for tabs, indicators and cards */
export const STATUS_CONFIG = {
  All: { label: 'All', color: '#0F172A', barColor: '#0F172A' },
  Moving: { label: 'Moving', color: '#0C9F41', barColor: '#0C9F41' },
  Stopped: { label: 'Stopped', color: '#9333EA', barColor: '#9333EA' },
  Idling: { label: 'Idling', color: '#F97316', barColor: '#F97316' },
  Offline: { label: 'Offline', color: '#9CA3AF', barColor: '#9CA3AF' },
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

/**
 * Compute the list of vehicles rendered on the map.
 * Ensures the actively selected vehicle NEVER vanishes from the map if
 * the user toggles a filter tab (e.g. from Moving to Stopped) or if its status changes.
 */
export const computeMapVehicles = (filteredVehicles = [], selectedVehicle = null) => {
  if (!selectedVehicle || !selectedVehicle.hasFix) return filteredVehicles;
  const isIncluded = filteredVehicles.some((v) => v.id === selectedVehicle.id);
  if (!isIncluded) {
    return [selectedVehicle, ...filteredVehicles];
  }
  return filteredVehicles;
};
