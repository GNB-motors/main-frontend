import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleMap, useLoadScript, MarkerF, PolylineF, CircleF } from '@react-google-maps/api';
import apiClient from '../../utils/axiosConfig';
import { useLivePositions } from '../../hooks/useLivePositions';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import { LiveTrackingService } from './LiveTrackingService.jsx';
import {
  NOVA_STATUS,
  DEPOTS,
  CITY_COORDS,
  ROUTES_LIST,
  bearingDegrees,
  formatAgoText,
  formatISTTime,
  formatISTDate,
  formatDayText,
  formatFullStamp,
  formatHrsText,
  aheadPath,
  resolveVehicleStatus,
} from './liveTracking.shared.js';
import './LiveTracking.css';

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '')
  .replace(/['"]/g, '')
  .trim();
const GOOGLE_MAPS_LIBRARIES = ['places', 'drawing'];
const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f0f3f6' }] },
  // Country boundaries & labels
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
  // State / province boundaries & labels
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
  // Cities & Localities
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
  // Hide clutter (POIs and Transit)
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  // Roads
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#e2e8f0' }, { weight: 1 }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#edf2f7' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cbd5e1' }, { weight: 1 }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  // Water
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#d8dee4' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
];

const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d111e' }] },
  // Country boundaries & labels
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
  // State / province boundaries & labels
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
  // Cities & Localities
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
  // Hide clutter
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  // Roads
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#161b2e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#101524' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#242c4b' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1a2038' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#64748b' }],
  },
  // Water
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#070a12' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }],
  },
];

const createVehicleMarkerIcon = (v, isSelected, showPlate) => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  const s = NOVA_STATUS[v.status] || NOVA_STATUS.offline;
  const color = s.c;
  const isLive = v.live;

  if (!isLive) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6" fill="#5D5D5E" stroke="#ffffff" stroke-width="2"/>
    </svg>`;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(16, 16),
      anchor: new window.google.maps.Point(8, 8),
    };
  }

  if (showPlate || isSelected) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="124" height="48" viewBox="0 0 124 48">
      <defs>
        <filter id="sh" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#sh)">
        <rect x="2" y="2" width="120" height="32" rx="7" fill="#0C1020" stroke="${isSelected ? '#4469F0' : color}" stroke-width="${isSelected ? 2.5 : 1.75}"/>
        <circle cx="14" cy="18" r="5" fill="${color}"/>
        <text x="25" y="22" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11.5" font-weight="700" letter-spacing="0.4">${v.plate}</text>
        <polygon points="56,34 68,34 62,43" fill="#0C1020"/>
        <polygon points="57,34 67,34 62,42" fill="${isSelected ? '#4469F0' : color}"/>
      </g>
    </svg>`;
    return {
      url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
      scaledSize: new window.google.maps.Size(124, 48),
      anchor: new window.google.maps.Point(62, 45),
    };
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="46" viewBox="0 0 40 46">
    <defs>
      <filter id="sh" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <g filter="url(#sh)">
      <rect x="2" y="2" width="36" height="32" rx="8" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
      <polygon points="14,34 26,34 20,43" fill="${color}"/>
      <path d="M12 13 h10 v8 h-10 z" fill="#FFFFFF"/>
      <path d="M22 16 h3 l3 3 v2 h-6 z" fill="#FFFFFF"/>
      <circle cx="15" cy="23" r="2.2" fill="#FFFFFF"/>
      <circle cx="24" cy="23" r="2.2" fill="#FFFFFF"/>
      <circle cx="15" cy="23" r="1.1" fill="${color}"/>
      <circle cx="24" cy="23" r="1.1" fill="${color}"/>
    </g>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(40, 46),
    anchor: new window.google.maps.Point(20, 44),
  };
};

const createDestMarkerIcon = () => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
    <defs>
      <filter id="dsh" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
      </filter>
    </defs>
    <g filter="url(#dsh)">
      <path d="M17 2 C8.7 2 2 8.7 2 17 C2 27.5 17 40 17 40 C17 40 32 27.5 32 17 C32 8.7 25.3 2 17 2 Z" fill="#C56200" stroke="#FFFFFF" stroke-width="2"/>
      <circle cx="17" cy="16" r="5" fill="#FFFFFF"/>
    </g>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(34, 42),
    anchor: new window.google.maps.Point(17, 41),
  };
};

const createReplayTruckIcon = (heading = 0) => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <defs>
      <filter id="rsh" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.4"/>
      </filter>
    </defs>
    <g filter="url(#rsh)">
      <circle cx="22" cy="22" r="19" fill="#187A32" stroke="#FFFFFF" stroke-width="2.5"/>
      <g transform="rotate(${Math.round(heading)}, 22, 22)">
        <polygon points="22,6 26,11 18,11" fill="#FFFFFF"/>
        <rect x="16" y="14" width="12" height="14" rx="2" fill="#FFFFFF"/>
        <rect x="18" y="29" width="8" height="3" rx="1" fill="#FFFFFF"/>
      </g>
    </g>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(44, 44),
    anchor: new window.google.maps.Point(22, 22),
  };
};

const createTrailEndpointIcon = (text, color) => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
    <text x="12" y="16" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="700" text-anchor="middle">${text}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(24, 24),
    anchor: new window.google.maps.Point(12, 12),
  };
};

const createTrailStopIcon = () => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6" fill="#C56200" stroke="#FFFFFF" stroke-width="2"/>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(16, 16),
    anchor: new window.google.maps.Point(8, 8),
  };
};

/* ---------------- SVG Icons ---------------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  refresh:
    '<path d="M21 3v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 21v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
  share:
    '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4"/><path d="M15.4 6.5l-6.8 4"/>',
  radio:
    '<circle cx="12" cy="12" r="2"/><path d="M7.8 16.2a6 6 0 0 1 0-8.4"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4"/><path d="M4.9 19.1a10 10 0 0 1 0-14.2"/><path d="M19.1 4.9a10 10 0 0 1 0 14.2"/>',
  route:
    '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/>',
  expand:
    '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
  tag: '<path d="M11.6 2.6A2 2 0 0 0 10.2 2H4a2 2 0 0 0-2 2v6.2a2 2 0 0 0 .6 1.4l8.8 8.8a2 2 0 0 0 2.8 0l6.2-6.2a2 2 0 0 0 0-2.8z"/><circle cx="7" cy="7" r="1.2"/>',
  locate:
    '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  x: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  fuel: '<path d="M12 2.8 6.6 8.2a7.6 7.6 0 1 0 10.8 0Z"/>',
  zap: '<path d="M13 2 3.5 14H12l-1 8 9.5-12H13z"/>',
  nav: '<path d="M3 11 22 2l-9 19-2-8z"/>',
  gauge:
    '<circle cx="12" cy="12" r="9"/><path d="M12 12l4.5-4"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/>',
  truck:
    '<path d="M14 17V6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h1.5"/><path d="M9.5 17h3"/><path d="19.5 17H21a1 1 0 0 0 1-1v-3.3a1 1 0 0 0-.2-.6l-3-3.7a1 1 0 0 0-.8-.4H14"/><circle cx="17" cy="17.5" r="2"/><circle cx="6.8" cy="17.5" r="2"/>',
  moon: '<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7 7 0 0 0 10.7 10.7z"/>',
  sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.2 4.2 5.6 5.6"/><path d="M18.4 18.4l1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.2 19.8 5.6 18.4"/><path d="M18.4 5.6l1.4-1.4"/>',
  sat: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/>',
  play: '<path d="M7 4.5 19 12 7 19.5z" fill="currentColor" stroke-linejoin="round"/>',
  pause: '<path d="M8 4.5v15"/><path d="M16 4.5v15"/>',
  chevDown: '<path d="M6 9l6 6 6-6"/>',
  chevRight: '<path d="M9 6l6 6-6 6"/>',
  chevLeft: '<path d="M15 6l-6 6 6 6"/>',
  list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3.5 6h.01"/><path d="M3.5 12h.01"/><path d="M3.5 18h.01"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/>',
  doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8h.01"/>',
  trip: '<path d="M4 19V6a2 2 0 0 1 2-2h8l6 6v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 12h8"/><path d="M8 16h5"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4.5h11l-2 3.5 2 3.5H5"/>',
};

const renderIconSvg = (name, size = 16, className = '') => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }}
    />
  );
};

/* Seeded random generator for fallback/enrichment */
const createSeededRandom = (seed) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

const MODELS = [
  'TATA 2823',
  'TATA 1918',
  'ASHOK LEYLAND 2820',
  'BHARATBENZ 2823R',
  'EICHER PRO 6028',
];

const generateSyntheticTrail = (lat, lng, n = 24, rnd) => {
  const pts = [];
  let a = rnd() * Math.PI * 2;
  let la = lat;
  let ln = lng;
  for (let i = n; i > 0; i--) {
    a += (rnd() - 0.5) * 0.5;
    la -= Math.cos(a) * 0.011;
    ln -= Math.sin(a) * 0.013;
    pts.unshift([la, ln]);
  }
  pts.push([lat, lng]);
  return pts;
};

/* ---------------- Main LiveTrackingPage Component ---------------- */
const LiveTrackingPage = () => {
  // Live positions hook
  const {
    positions: rawPositions,
    isLoading: _isLiveLoading,
    refresh: refreshLivePositions,
  } = useLivePositions();
  const [vehiclesMeta, setVehiclesMeta] = useState({});

  // Layout & Theme hooks
  useFullPageLayout();
  const [theme, setTheme] = useState(() => {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const nextTheme = isDark ? 'dark' : 'light';
      setTheme(nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    };
    handleThemeChange();
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('themeColorChange', handleThemeChange);
    return () => {
      observer.disconnect();
      window.removeEventListener('themeColorChange', handleThemeChange);
    };
  }, []);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRailOpen, setIsRailOpen] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const [mapMode, setMapMode] = useState('map'); // 'map' | 'sat'
  const [isTelemetryOn, setIsTelemetryOn] = useState(true);

  // Filters & selection
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [clockTime, setClockTime] = useState('—');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // 360 modal state
  const [modal360Open, setModal360Open] = useState(false);
  const [modal360Angle, setModal360Angle] = useState('Front');

  // Google Maps Load Script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Trail & Replay state
  const [trailLoading, setTrailLoading] = useState(false);
  const [isTrailVisible, setIsTrailVisible] = useState(false);
  const [trailPoints, setTrailPoints] = useState([]);
  const [replayState, setReplayState] = useState({
    on: false,
    playing: false,
    t: 0,
    speed: 4,
    pts: null,
  });
  const [replayCurrentPos, setReplayCurrentPos] = useState(null);
  const [replayRunPath, setReplayRunPath] = useState([]);
  const [replayBearing, setReplayBearing] = useState(0);

  // Map & interaction refs
  const mapRef = useRef(null);
  const lastReplayTimeRef = useRef(0);
  const searchInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  // Toast trigger helper
  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  }, []);

  // IST Clock interval
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClockTime(
        now
          .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
          .toLowerCase() + ' IST',
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 15000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Vehicles Master Metadata
  useEffect(() => {
    let cancelled = false;
    const loadMeta = async () => {
      try {
        const res = await apiClient.get('/api/vehicles', { params: { limit: 500 } });
        const list = res.data?.data?.records || res.data?.data || [];
        if (cancelled) return;
        const metaMap = {};
        list.forEach((v) => {
          if (v.registrationNumber) {
            metaMap[v.registrationNumber.toUpperCase().replace(/\s+/g, '')] = v;
            metaMap[v.registrationNumber] = v;
          }
          if (v.chassisNumber) {
            metaMap[v.chassisNumber] = v;
          }
        });
        setVehiclesMeta(metaMap);
      } catch (err) {
        console.warn('Could not load vehicles metadata:', err);
      }
    };
    loadMeta();
    return () => {
      cancelled = true;
    };
  }, []);

  // Build Unified Vehicles List
  const vehicles = useMemo(() => {
    const rnd = createSeededRandom(20260920);
    const hasLiveRows = Array.isArray(rawPositions) && rawPositions.length > 0;

    let items = [];

    if (hasLiveRows) {
      items = rawPositions.map((p, idx) => {
        const reg = (p.registrationNumber || '').toUpperCase().trim();
        const cleanReg = reg.replace(/\s+/g, '');
        const meta = vehiclesMeta[cleanReg] || vehiclesMeta[reg] || {};
        const st = resolveVehicleStatus(p).toLowerCase();
        const lat = p.latitude != null ? Number(p.latitude) : 22.5726;
        const lng = p.longitude != null ? Number(p.longitude) : 88.3639;
        const speed = Math.round(p.speed || 0);
        const fuel =
          p.primaryFuelLevel != null
            ? Number(p.primaryFuelLevel).toFixed(1)
            : (45 + ((idx * 7) % 180)).toFixed(1);
        const ignition = p.ignition === true || p.ignition === 'ON' ? 'ON' : 'OFF';
        const isLive = st !== 'offline' && !p.isStale;
        const routeIdx = idx % ROUTES_LIST.length;
        const route = ROUTES_LIST[routeIdx];
        const progress = Math.round(18 + ((idx * 17) % 72));
        const totalKm = 180 + ((idx * 43) % 460);
        const tripKm = Math.round((totalKm * progress) / 100);
        const tripMin = Math.max(45, Math.round((tripKm / 40) * 60));
        const stops = 1 + (idx % 3);

        const minutesAgo = p.eventDateTime
          ? Math.max(0, Math.round((Date.now() - new Date(p.eventDateTime).getTime()) / 60000))
          : isLive
            ? st === 'moving'
              ? 0
              : 4
            : 180;

        return {
          id: `live-${cleanReg || idx}`,
          plate: reg || `WB${11 + idx}A${1000 + idx}`,
          model: meta.model || meta.manufacturer || MODELS[idx % MODELS.length],
          vin: meta.chassisNumber || p.vin || `VIN${10000 + idx}`,
          status: st,
          live: isLive,
          lat,
          lng,
          area:
            meta.currentLocation ||
            meta.branch ||
            p.address ||
            (lat != null && lng != null ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'In transit'),
          route,
          speed,
          fuel: Number(fuel),
          ignition,
          gps: isLive ? 'Active' : 'No fix',
          sats: 8 + (idx % 5),
          ago: minutesAgo,
          odo: meta.odometer || 84000 + idx * 1200,
          reg: meta.manufacturingYear || 2021,
          progress,
          totalKm,
          tripKm,
          tripMin,
          stops,
          stopIdx: [3, 7, 12].slice(0, stops),
          trail: lat != null && lng != null ? generateSyntheticTrail(lat, lng, 24, rnd) : [],
          depAt: new Date(Date.now() - (minutesAgo + tripMin) * 60000),
          etaAt: new Date(
            Date.now() -
              minutesAgo * 60000 +
              Math.round((tripMin * (100 - progress)) / Math.max(progress, 1)) * 60000,
          ),
        };
      });
    } else {
      items = [];
    }

    return items;
  }, [rawPositions, vehiclesMeta]);

  // Vehicle by ID map
  const byId = useMemo(() => {
    const map = {};
    vehicles.forEach((v) => {
      map[v.id] = v;
      map[v.plate] = v;
    });
    return map;
  }, [vehicles]);

  // Counts for filter pills
  const counts = useMemo(() => {
    return {
      all: vehicles.length,
      gps: vehicles.filter((v) => v.live).length,
      moving: vehicles.filter((v) => v.status === 'moving').length,
      stopped: vehicles.filter((v) => v.status === 'stopped').length,
      idling: vehicles.filter((v) => v.status === 'idling').length,
      offline: vehicles.filter((v) => v.status === 'offline').length,
    };
  }, [vehicles]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vehicles.filter((v) => {
      const matchesFilter = filter === 'all' || (filter === 'gps' ? v.live : v.status === filter);
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        v.plate.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.vin.toLowerCase().includes(q) ||
        (v.route && (v.route[1].toLowerCase().includes(q) || v.route[3].toLowerCase().includes(q)))
      );
    });
  }, [vehicles, filter, searchQuery]);

  // Selected vehicle object
  const selectedVehicle = selectedId ? byId[selectedId] : null;

  /* ---------------- Google Map Configuration & State ---------------- */
  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: theme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE,
      mapTypeId: mapMode === 'sat' ? 'satellite' : 'roadmap',
      gestureHandling: 'greedy',
    }),
    [theme, mapMode],
  );

  // Sync MapTypeId dynamically
  useEffect(() => {
    if (mapRef.current && window.google) {
      mapRef.current.setMapTypeId(mapMode === 'sat' ? 'satellite' : 'roadmap');
    }
  }, [mapMode]);

  // Callback when Google Map mounts
  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      if (filteredVehicles.length > 0 && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        filteredVehicles.forEach((v) => {
          if (v.lat != null && v.lng != null) bounds.extend({ lat: v.lat, lng: v.lng });
        });
        map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
      }
    },
    [filteredVehicles],
  );

  // Pan / focus when selected vehicle changes
  useEffect(() => {
    if (!selectedVehicle || !mapRef.current) return;
    mapRef.current.panTo({ lat: selectedVehicle.lat, lng: selectedVehicle.lng });
    if ((mapRef.current.getZoom() || 5) < 12) {
      mapRef.current.setZoom(12);
    }
  }, [selectedVehicle]);

  // Selected vehicle ahead route path
  const selectedAheadCoords = useMemo(() => {
    if (!selectedVehicle?.live) return null;
    const pts = aheadPath(selectedVehicle);
    if (!pts || pts.length < 2) return null;
    return pts.map(([lat, lng]) => ({ lat, lng }));
  }, [selectedVehicle]);

  const selectedDestPt = useMemo(() => {
    if (!selectedAheadCoords || selectedAheadCoords.length === 0) return null;
    return selectedAheadCoords[selectedAheadCoords.length - 1];
  }, [selectedAheadCoords]);

  const selectedStatusColor = useMemo(() => {
    if (!selectedVehicle) return '#187A32';
    return (NOVA_STATUS[selectedVehicle.status] || NOVA_STATUS.moving).c;
  }, [selectedVehicle]);

  // All planned routes for live vehicles
  const allAheadRoutes = useMemo(() => {
    if (!showAllRoutes) return [];
    return vehicles
      .filter((v) => v.live)
      .map((v) => {
        const pts = aheadPath(v);
        if (!pts || pts.length < 2) return null;
        const s = NOVA_STATUS[v.status] || NOVA_STATUS.moving;
        return {
          id: v.id,
          plate: v.plate,
          dest: v.route?.[3],
          color: s.c,
          coords: pts.map(([lat, lng]) => ({ lat, lng })),
        };
      })
      .filter(Boolean);
  }, [showAllRoutes, vehicles]);

  // Breadcrumb Trail points transformed to LatLng objects
  const trailCoords = useMemo(() => {
    return trailPoints.map(([lat, lng]) => ({ lat, lng }));
  }, [trailPoints]);

  const trailStopPoints = useMemo(() => {
    if (!selectedVehicle?.stopIdx || !trailCoords.length) return [];
    return selectedVehicle.stopIdx
      .map((idx) => {
        const pt = trailCoords[idx];
        if (!pt) return null;
        return { idx, pos: pt };
      })
      .filter(Boolean);
  }, [selectedVehicle, trailCoords]);

  // Replay base trail points transformed to LatLng objects
  const replayPtsCoords = useMemo(() => {
    if (!replayState.pts) return [];
    return replayState.pts.map(([lat, lng]) => ({ lat, lng }));
  }, [replayState.pts]);

  // Replay animation frame ticker
  useEffect(() => {
    if (!replayState.on || !replayState.pts || replayState.pts.length < 2) {
      setReplayCurrentPos(null);
      setReplayRunPath([]);
      return;
    }

    const pts = replayState.pts;
    const t = Math.max(0, Math.min(1, replayState.t));
    const exact = t * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(exact));
    const frac = exact - i;
    const p0 = pts[i];
    const p1 = pts[i + 1] || p0;
    const curLat = p0[0] + (p1[0] - p0[0]) * frac;
    const curLng = p0[1] + (p1[1] - p0[1]) * frac;
    const cur = { lat: curLat, lng: curLng };

    setReplayCurrentPos(cur);
    const pathSlice = pts.slice(0, i + 1).map(([lat, lng]) => ({ lat, lng }));
    pathSlice.push(cur);
    setReplayRunPath(pathSlice);

    const brg = bearingDegrees(p0, p1);
    setReplayBearing(brg);

    if (!replayState.playing) return;

    let animId;
    const step = (ts) => {
      if (!lastReplayTimeRef.current) lastReplayTimeRef.current = ts;
      const dt = (ts - lastReplayTimeRef.current) / 1000;
      lastReplayTimeRef.current = ts;

      const duration = 24 / replayState.speed;
      const nextT = replayState.t + dt / duration;

      if (nextT >= 1) {
        setReplayState((prev) => ({ ...prev, t: 1, playing: false }));
      } else {
        setReplayState((prev) => ({ ...prev, t: nextT }));
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animId);
      lastReplayTimeRef.current = 0;
    };
  }, [replayState.on, replayState.playing, replayState.t, replayState.speed, replayState.pts]);

  // Toggle breadcrumb trail
  const toggleTrail = useCallback(
    async (v) => {
      if (isTrailVisible && !replayState.on) {
        setIsTrailVisible(false);
        setTrailPoints([]);
        return;
      }

      if (replayState.on) {
        setReplayState((prev) => ({ ...prev, on: false, playing: false }));
      }

      setTrailLoading(true);
      let points = v.trail;

      try {
        const trailData = await LiveTrackingService.getTrail(v.plate);
        if (trailData?.points?.length > 1) {
          points = trailData.points
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => [p.latitude, p.longitude]);
        }
      } catch {
        // fallback to synthesized trail
      } finally {
        setTrailLoading(false);
      }

      if (!points || points.length < 2) {
        showToast(`No trail recorded for ${v.plate}`);
        return;
      }

      setTrailPoints(points);
      setIsTrailVisible(true);

      if (mapRef.current && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
        mapRef.current.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
      }
      showToast(`Trail · ${v.tripKm} km over ${formatHrsText(v.tripMin)}`);
    },
    [isTrailVisible, replayState.on, showToast],
  );

  // Enter Replay
  const enterReplay = useCallback(
    async (v) => {
      let points = v.trail;
      try {
        const trailData = await LiveTrackingService.getTrail(v.plate);
        if (trailData?.points?.length > 1) {
          points = trailData.points
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => [p.latitude, p.longitude]);
        }
      } catch {
        // fallback
      }

      if (!points || points.length < 2) {
        showToast('No trail available for this vehicle');
        return;
      }

      setTrailPoints(points);
      setReplayState({
        on: true,
        playing: true,
        t: 0,
        speed: 4,
        pts: points,
      });
      setIsTrailVisible(true);

      if (mapRef.current && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
        mapRef.current.fitBounds(bounds, { top: 70, right: 70, bottom: 170, left: 70 });
      }
    },
    [showToast],
  );

  // Exit Replay
  const exitReplay = useCallback(() => {
    setReplayState({ on: false, playing: false, t: 0, speed: 4, pts: null });
    setReplayCurrentPos(null);
    setReplayRunPath([]);
    setIsTrailVisible(false);
  }, []);

  // Telemetry rotating index
  const [telemetryIndex, setTelemetryIndex] = useState(0);
  useEffect(() => {
    if (!isTelemetryOn) return;
    const timer = setInterval(() => {
      setTelemetryIndex((prev) => prev + 1);
    }, 3200);
    return () => clearInterval(timer);
  }, [isTelemetryOn]);

  const telemetryVehicle = useMemo(() => {
    if (selectedVehicle) return selectedVehicle;
    const liveList = vehicles.filter((v) => v.live);
    if (!liveList.length) return null;
    return liveList[telemetryIndex % liveList.length];
  }, [selectedVehicle, vehicles, telemetryIndex]);

  // 360 View Orbit Modal
  const open360Modal = useCallback(() => {
    setModal360Open(true);
  }, []);

  const close360Modal = useCallback(() => {
    setModal360Open(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        setIsRailOpen(true);
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (modal360Open) close360Modal();
        else if (replayState.on) exitReplay();
        else setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal360Open, replayState.on, close360Modal, exitReplay]);

  // CSV Export
  const handleExportCSV = useCallback(() => {
    const rows = filteredVehicles;
    const headers =
      'plate,model,vin,status,origin,destination,progress_pct,fuel_l,ignition,gps,speed_kmh,last_update,lat,lng';
    const lines = rows.map((v) => {
      const st = NOVA_STATUS[v.status]?.label || v.status;
      const origin = v.route ? v.route[1] : '';
      const dest = v.route ? v.route[3] : '';
      return [
        v.plate,
        v.model,
        v.vin,
        st,
        `"${origin}"`,
        `"${dest}"`,
        v.progress,
        v.fuel,
        v.ignition,
        v.gps,
        v.speed,
        `"${formatFullStamp(v.ago)}"`,
        v.lat.toFixed(5),
        v.lng.toFixed(5),
      ].join(',');
    });
    const csvContent = [headers, ...lines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-tracking-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast(`${rows.length} vehicles exported to CSV`);
  }, [filteredVehicles, showToast]);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshLivePositions();
    } catch {
      // Ignore
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
        showToast('Fleet positions refreshed');
      }, 600);
    }
  }, [refreshLivePositions, showToast]);

  // Share Page Link
  const handleShareAll = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    showToast('Live tracking link copied to clipboard');
  }, [showToast]);

  // Share Vehicle Link
  const handleShareVehicle = useCallback(
    (v) => {
      const url = `${window.location.origin}${window.location.pathname}?vehicle=${v.plate}`;
      navigator.clipboard?.writeText(url).catch(() => {});
      showToast(`Tracking link copied · ${v.plate}`);
    },
    [showToast],
  );

  // Map Controls: Fit fleet
  const handleFitFleet = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    const valid = filteredVehicles.filter((v) => v.lat != null && v.lng != null);
    if (!valid.length) {
      map.panTo(INDIA_CENTER);
      map.setZoom(5);
      return;
    }
    if (valid.length === 1) {
      map.panTo({ lat: valid[0].lat, lng: valid[0].lng });
      map.setZoom(12);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    valid.forEach((v) => bounds.extend({ lat: v.lat, lng: v.lng }));
    map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
  }, [filteredVehicles]);

  // Zoom In / Out
  const handleZoomIn = useCallback(() => {
    if (mapRef.current) mapRef.current.setZoom((mapRef.current.getZoom() || 5) + 1);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) mapRef.current.setZoom((mapRef.current.getZoom() || 5) - 1);
  }, []);

  const triggerMapResize = useCallback(() => {
    if (mapRef.current && window.google) {
      window.google.maps.event.trigger(mapRef.current, 'resize');
    }
  }, []);

  // Toggle vehicle labels
  const handleToggleLabels = useCallback(() => {
    setShowLabels((prev) => !prev);
  }, []);

  // Filter definitions
  const FILTER_TABS = useMemo(
    () => [
      { k: 'all', label: 'All Fleet', count: counts.all, dot: null },
      { k: 'gps', label: 'GPS Live', count: counts.gps, dot: 'var(--nova-rage-400)' },
      { k: 'moving', label: 'Moving', count: counts.moving, dot: NOVA_STATUS.moving.c },
      { k: 'stopped', label: 'Stopped', count: counts.stopped, dot: NOVA_STATUS.stopped.c },
      { k: 'idling', label: 'Idling', count: counts.idling, dot: NOVA_STATUS.idling.c },
      { k: 'offline', label: 'Offline', count: counts.offline, dot: NOVA_STATUS.offline.c },
    ],
    [counts],
  );

  return (
    <div className={`gnb-lt-page ${isFullscreen ? 'expanded' : ''}`}>
      {/* Main Console Container */}
      <main className="console">
        {/* Topbar Command Strip */}
        <div className="topbar">
          <div className="brandmark">
            <span className="dot-live">{renderIconSvg('radio', 16)}</span>
            <strong>Live Tracking</strong>
          </div>

          <span className="livepill">
            <i />
            <span>{counts.gps} Live on Map</span>
          </span>

          {/* Filter Chips */}
          <div className="filters">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.k}
                className="chip"
                aria-pressed={filter === tab.k}
                onClick={() => setFilter(tab.k)}
              >
                {tab.dot && <i style={{ background: tab.dot }} />}
                {tab.label}
                <span className="count-pill">{tab.count}</span>
              </button>
            ))}
          </div>

          {/* Topbar Tools */}
          <div className="tools">
            <span className="clockchip">
              {renderIconSvg('clock', 15)}
              <span>{clockTime}</span>
            </span>

            <button
              className="btn btn--icon"
              title="Refresh positions"
              aria-label="Refresh"
              onClick={handleRefresh}
            >
              {renderIconSvg('refresh', 16, isRefreshing ? 'spin' : '')}
            </button>

            <button className="btn" onClick={handleShareAll}>
              {renderIconSvg('share', 15)}
              <span className="lbl">Share</span>
            </button>
          </div>
        </div>

        {/* Stage Area: Map + Docked Fleet Rail */}
        <div className={`stage ${!isRailOpen ? 'railoff' : ''}`}>
          {/* Map Column */}
          <div className="mapcol">
            <div id="map" className="gmap-host">
              {!isLoaded ? (
                <div className="gmap-loading">
                  <div className="gmap-spinner" />
                  <span>Loading Google Maps…</span>
                </div>
              ) : loadError ? (
                <div className="gmap-error">
                  <span>Error loading Google Maps. Please check your connection and API key.</span>
                </div>
              ) : (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={INDIA_CENTER}
                  zoom={5}
                  onLoad={onMapLoad}
                  options={mapOptions}
                >
                  {/* Fleet Vehicle Markers */}
                  {filteredVehicles.map((v) => {
                    const isSelected = v.id === selectedId;
                    const icon = createVehicleMarkerIcon(v, isSelected, showLabels);
                    return (
                      <MarkerF
                        key={v.id}
                        position={{ lat: v.lat, lng: v.lng }}
                        icon={icon}
                        zIndex={isSelected ? 1000 : v.live ? 500 : 100}
                        onClick={() => {
                          setSelectedId(v.id);
                          setIsRailOpen(true);
                        }}
                      />
                    );
                  })}

                  {/* Planned Route Ahead for Selected Vehicle */}
                  {selectedAheadCoords && selectedAheadCoords.length > 1 && (
                    <>
                      <PolylineF
                        path={selectedAheadCoords}
                        options={{
                          strokeColor: selectedStatusColor,
                          strokeOpacity: 0.22,
                          strokeWeight: 6,
                        }}
                      />
                      <PolylineF
                        path={selectedAheadCoords}
                        options={{
                          strokeColor: selectedStatusColor,
                          strokeOpacity: 0.9,
                          strokeWeight: 3,
                        }}
                      />
                      {selectedDestPt && (
                        <MarkerF
                          position={selectedDestPt}
                          icon={createDestMarkerIcon()}
                          title={`Drop-off: ${selectedVehicle?.route?.[3] || 'Destination'}`}
                        />
                      )}
                    </>
                  )}

                  {/* All Live Routes toggle */}
                  {showAllRoutes &&
                    allAheadRoutes.map((r, idx) => (
                      <PolylineF
                        key={`all-rt-${idx}`}
                        path={r.coords}
                        options={{
                          strokeColor: r.color,
                          strokeOpacity: 0.45,
                          strokeWeight: 2,
                        }}
                      />
                    ))}

                  {/* Breadcrumb Trail */}
                  {isTrailVisible && trailCoords.length > 1 && (
                    <>
                      <PolylineF
                        path={trailCoords}
                        options={{
                          strokeColor: selectedStatusColor,
                          strokeOpacity: 0.9,
                          strokeWeight: 4,
                        }}
                      />
                      <MarkerF
                        position={trailCoords[0]}
                        icon={createTrailEndpointIcon('S', selectedStatusColor)}
                      />
                      <MarkerF
                        position={trailCoords[trailCoords.length - 1]}
                        icon={createTrailEndpointIcon('E', selectedStatusColor)}
                      />
                      {trailStopPoints.map((stop, sIdx) => (
                        <MarkerF
                          key={`stop-${sIdx}`}
                          position={stop.pos}
                          icon={createTrailStopIcon()}
                        />
                      ))}
                    </>
                  )}

                  {/* Trip Replay */}
                  {replayState.on && replayPtsCoords.length > 1 && (
                    <>
                      <PolylineF
                        path={replayPtsCoords}
                        options={{
                          strokeColor: '#9A9AA5',
                          strokeOpacity: 0.45,
                          strokeWeight: 4,
                        }}
                      />
                      <PolylineF
                        path={replayRunPath}
                        options={{
                          strokeColor: selectedStatusColor,
                          strokeOpacity: 0.95,
                          strokeWeight: 5,
                        }}
                      />
                      <MarkerF
                        position={replayPtsCoords[0]}
                        icon={createTrailEndpointIcon('S', selectedStatusColor)}
                      />
                      <MarkerF
                        position={replayPtsCoords[replayPtsCoords.length - 1]}
                        icon={createTrailEndpointIcon('E', selectedStatusColor)}
                      />
                      {replayCurrentPos && (
                        <MarkerF
                          position={replayCurrentPos}
                          icon={createReplayTruckIcon(replayBearing)}
                          zIndex={1200}
                        />
                      )}
                    </>
                  )}

                  {/* 360 Orbit Circle */}
                  {modal360Open && selectedVehicle && (
                    <CircleF
                      center={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                      radius={1400}
                      options={{
                        strokeColor: '#4469F0',
                        strokeOpacity: 0.8,
                        strokeWeight: 2,
                        fillColor: '#4469F0',
                        fillOpacity: 0.08,
                      }}
                    />
                  )}
                </GoogleMap>
              )}
            </div>

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

            {/* Overlay Left-Center: Quick Map Controls */}
            <div className="ov ov--lc">
              <button
                className="ctrl"
                title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
                aria-label="Expand"
                aria-pressed={isFullscreen}
                onClick={() => {
                  setIsFullscreen((prev) => !prev);
                  setTimeout(triggerMapResize, 240);
                }}
              >
                {renderIconSvg('expand', 18)}
              </button>

              <button
                className="ctrl"
                title="Show all routes"
                aria-label="Show all routes"
                aria-pressed={showAllRoutes}
                onClick={() => {
                  setShowAllRoutes((prev) => {
                    const next = !prev;
                    showToast(
                      next ? 'Showing planned routes for all live vehicles' : 'Route lines hidden',
                    );
                    return next;
                  });
                }}
              >
                {renderIconSvg('route', 18)}
              </button>

              <button
                className="ctrl"
                title="Vehicle labels"
                aria-label="Vehicle labels"
                aria-pressed={showLabels}
                onClick={handleToggleLabels}
              >
                {renderIconSvg('tag', 18)}
              </button>

              <button
                className="ctrl"
                title="Fit fleet"
                aria-label="Fit fleet"
                onClick={handleFitFleet}
              >
                {renderIconSvg('locate', 18)}
              </button>

              <button className="ctrl" title="Zoom in" aria-label="Zoom in" onClick={handleZoomIn}>
                {renderIconSvg('plus', 18)}
              </button>

              <button
                className="ctrl"
                title="Zoom out"
                aria-label="Zoom out"
                onClick={handleZoomOut}
              >
                {renderIconSvg('minus', 18)}
              </button>
            </div>

            {/* Overlay Bottom-Left: Map vs Satellite Segmented Switch */}
            <div className="ov ov--bl">
              <div className="segmented">
                <button aria-pressed={mapMode === 'map'} onClick={() => setMapMode('map')}>
                  Map
                </button>
                <button aria-pressed={mapMode === 'sat'} onClick={() => setMapMode('sat')}>
                  Satellite
                </button>
              </div>
            </div>

            {/* Overlay Bottom-Center: Replay Bar & Telemetry Ticker */}
            <div className="ov ov--bc">
              {/* Trip Replay Controller */}
              <div className={`replay ${replayState.on ? 'on' : ''}`}>
                {replayState.on && selectedVehicle && (
                  <>
                    <div className="rp-head">
                      <span className="rp-badge">{renderIconSvg('route', 15)}</span>
                      <span className="rp-plate">{selectedVehicle.plate}</span>
                      <span className="rp-date">
                        {selectedVehicle.route[0]} → {selectedVehicle.route[2]} ·{' '}
                        {formatDayText(selectedVehicle.ago)}
                      </span>
                      <div className="rp-stats">
                        <div className="rp-stat">
                          <div className="k">Distance</div>
                          <div className="v">{selectedVehicle.tripKm} km</div>
                        </div>
                        <div className="rp-stat">
                          <div className="k">Driving</div>
                          <div className="v">{formatHrsText(selectedVehicle.tripMin)}</div>
                        </div>
                        <div className="rp-stat">
                          <div className="k">Stops</div>
                          <div className="v">{selectedVehicle.stops}</div>
                        </div>
                        <div className="rp-stat">
                          <div className="k">Pings</div>
                          <div className="v">{replayState.pts ? replayState.pts.length : 0}</div>
                        </div>
                      </div>
                      <button
                        className="btn btn--sm btn--icon rp-x"
                        aria-label="Exit replay"
                        onClick={exitReplay}
                      >
                        {renderIconSvg('x', 16)}
                      </button>
                    </div>

                    <div className="rp-controls">
                      <button
                        className="rp-play"
                        aria-label={replayState.playing ? 'Pause replay' : 'Play replay'}
                        onClick={() =>
                          setReplayState((prev) => ({ ...prev, playing: !prev.playing }))
                        }
                      >
                        {renderIconSvg(replayState.playing ? 'pause' : 'play', 16)}
                      </button>

                      <span className="rp-time">{Math.round(replayState.t * 100)}%</span>

                      <div
                        className="rp-scrub"
                        role="slider"
                        tabIndex={0}
                        aria-label="Replay position"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(replayState.t * 100)}
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                          setReplayState((prev) => ({ ...prev, t, playing: false }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowRight') {
                            e.preventDefault();
                            setReplayState((prev) => ({ ...prev, t: Math.min(1, prev.t + 0.02) }));
                          } else if (e.key === 'ArrowLeft') {
                            e.preventDefault();
                            setReplayState((prev) => ({ ...prev, t: Math.max(0, prev.t - 0.02) }));
                          } else if (e.key === ' ') {
                            e.preventDefault();
                            setReplayState((prev) => ({ ...prev, playing: !prev.playing }));
                          }
                        }}
                      >
                        <div className="rp-track">
                          <div
                            className="rp-fill"
                            style={{ width: `${(replayState.t * 100).toFixed(1)}%` }}
                          />
                        </div>
                        <div id="rpTicks">
                          {(selectedVehicle.stopIdx || []).map((idx) => {
                            const total = replayState.pts ? replayState.pts.length - 1 : 1;
                            const pct = ((idx / Math.max(1, total)) * 100).toFixed(1);
                            return (
                              <span key={idx} className="rp-tick" style={{ left: `${pct}%` }} />
                            );
                          })}
                        </div>
                        <div
                          className="rp-knob"
                          style={{ left: `${(replayState.t * 100).toFixed(1)}%` }}
                        />
                      </div>

                      <div className="rp-speeds">
                        {[1, 2, 4].map((sp) => (
                          <button
                            key={sp}
                            aria-pressed={replayState.speed === sp}
                            onClick={() => setReplayState((prev) => ({ ...prev, speed: sp }))}
                          >
                            {sp}×
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Live Telemetry Ticker */}
              {telemetryVehicle && (
                <div className={`telemetry ${isTelemetryOn && !replayState.on ? 'on' : ''}`}>
                  <span style={{ color: 'var(--nova-fern-500)', display: 'flex' }}>
                    {renderIconSvg('radio', 14)}
                  </span>
                  <span className="tplate">{telemetryVehicle.plate}</span>
                  <span className="tsep" />
                  <span className="tval">
                    <b>{telemetryVehicle.speed}</b> km/h
                  </span>
                  <span className="tsep" />
                  <span className="tval">
                    Fuel <b>{telemetryVehicle.fuel} L</b>
                  </span>
                  <span className="tsep" />
                  <span className="tval">
                    Ign <b>{telemetryVehicle.ignition}</b>
                  </span>
                  <span className="tsep opt1" />
                  <span className="tval opt1">
                    GPS{' '}
                    <b>
                      {telemetryVehicle.gps === 'Active'
                        ? `${telemetryVehicle.sats} sats`
                        : 'No fix'}
                    </b>
                  </span>
                  <span className="tsep opt2" />
                  <span className="tval opt2">{formatAgoText(telemetryVehicle.ago)}</span>
                </div>
              )}
            </div>

            {/* 360 Degree View Modal */}
            <div className={`modal ${modal360Open ? 'open' : ''}`}>
              <button
                type="button"
                className="scrim"
                aria-label="Close vehicle 360 dialog"
                onClick={close360Modal}
              />
              <div className="sheet" role="dialog" aria-label="360 degree vehicle view">
                <div className="mhead">
                  <div style={{ flex: 1 }}>
                    <div className="plate">{selectedVehicle?.plate}</div>
                    <div className="sub">360° vehicle view</div>
                  </div>
                  <button className="dclose" onClick={close360Modal} aria-label="Close">
                    ×
                  </button>
                </div>
                <div className="viewport">
                  <div className="ring">{renderIconSvg('sat', 32)}</div>
                  <div style={{ fontSize: 'var(--type-2xs)' }}>
                    Drag to orbit the vehicle · scroll to zoom ({modal360Angle} Angle)
                  </div>
                </div>
                <div className="angles">
                  {['Front', 'Driver side', 'Rear', 'Cargo'].map((ang) => (
                    <button
                      key={ang}
                      className="btn btn--sm"
                      style={{
                        background: modal360Angle === ang ? 'var(--nova-rage-a10)' : '',
                        borderColor: modal360Angle === ang ? 'var(--nova-rage-a20)' : '',
                        color: modal360Angle === ang ? 'var(--nova-rage-700)' : '',
                      }}
                      onClick={() => {
                        setModal360Angle(ang);
                        showToast(`${ang} view · ${selectedVehicle?.plate}`);
                      }}
                    >
                      {ang}
                    </button>
                  ))}
                  <span style={{ flex: 1 }} />
                  <button
                    className="btn btn--sm"
                    onClick={() => showToast('360° view link copied')}
                  >
                    {renderIconSvg('share', 14)}
                    Share view
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Rail: Fleet List & Vehicle Detail View */}
          <aside className="rail">
            {/* Primary Fleet List View */}
            <div className="railview">
              <div className="fhead">
                <div className="ftitle">
                  <h2>Fleet</h2>
                  <div className="fsub">
                    {vehicles.length === 0
                      ? '0 vehicles · 0 live'
                      : filteredVehicles.length === vehicles.length
                        ? `${vehicles.length} vehicles · ${counts.gps} live`
                        : `${filteredVehicles.length} of ${vehicles.length} vehicles`}
                  </div>
                </div>

                <button className="btn btn--sm" onClick={handleExportCSV}>
                  {renderIconSvg('download', 14)}
                  CSV
                </button>

                <button
                  className="btn btn--sm btn--icon"
                  title="Hide list"
                  aria-label="Hide list"
                  onClick={() => {
                    setIsRailOpen(false);
                    setTimeout(triggerMapResize, 240);
                  }}
                >
                  {renderIconSvg('chevRight', 16)}
                </button>
              </div>

              {/* Live Search Bar */}
              <div className="fsearch">
                {renderIconSvg('search', 16)}
                <input
                  ref={searchInputRef}
                  type="search"
                  placeholder="Search plate, chassis, model…"
                  autoComplete="off"
                  aria-label="Search fleet"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <kbd>/</kbd>
              </div>

              {/* Cards List */}
              <div className="flist">
                {!filteredVehicles.length ? (
                  <div className="fempty">
                    {vehicles.length === 0
                      ? "No vehicles found in your organization's fleet."
                      : 'No vehicles match this filter.'}
                  </div>
                ) : (
                  filteredVehicles.slice(0, 120).map((v) => {
                    const s = NOVA_STATUS[v.status] || NOVA_STATUS.offline;
                    const pct = v.live ? v.progress : 0;
                    const isSel = v.id === selectedId;

                    return (
                      <div
                        key={v.id}
                        className={`vcard ${isSel ? 'is-sel' : ''}`}
                        role="button"
                        tabIndex={0}
                        style={{ '--c': s.c }}
                        onClick={() => setSelectedId(v.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedId(v.id);
                          }
                        }}
                      >
                        <div className="vc-top">
                          <div className="vc-id">
                            <div className="vc-plate">
                              {v.plate}
                              <span className="vc-model">{v.model}</span>
                            </div>
                            <div className="vc-vin">#{v.vin}</div>
                          </div>
                          <span className="vc-state">
                            <i />
                            {s.trip}
                          </span>
                        </div>

                        {/* Route Strip */}
                        <div className="vc-route">
                          <div className="vc-ends">
                            <div className="vc-end">
                              <div className="vc-code">{v.route[0]}</div>
                              <div className="vc-city">{v.route[1]}</div>
                            </div>
                            <div className="vc-end to">
                              <div className="vc-code">{v.route[2]}</div>
                              <div className="vc-city">{v.route[3]}</div>
                            </div>
                          </div>

                          <div className="vc-times">
                            <span className="vc-time">
                              {formatISTDate(v.depAt)}, {formatISTTime(v.depAt)}
                            </span>
                            <span className="vc-time">
                              {v.live
                                ? `${formatISTDate(v.etaAt)}, ${formatISTTime(v.etaAt)}`
                                : 'Not dispatched'}
                            </span>
                          </div>

                          <div className="vc-prog">
                            <span className="vc-line" />
                            <span
                              className="vc-done"
                              style={{ width: `calc((100% - 24px) * ${pct / 100})` }}
                            />
                            <span className="vc-origin">{renderIconSvg('box', 14)}</span>
                            <span
                              className="vc-mover"
                              style={{ left: `calc(12px + (100% - 24px) * ${pct / 100})` }}
                            >
                              {renderIconSvg('truck', 16)}
                            </span>
                            <span className="vc-dest">{renderIconSvg('pin', 14)}</span>
                            {v.live && <span className="vc-pct">{pct}%</span>}
                          </div>
                        </div>

                        {/* Card Meta Footer */}
                        <div className="vc-meta">
                          <span>
                            {renderIconSvg('fuel', 13)}
                            <b>{v.fuel} L</b>
                          </span>
                          <span>
                            {renderIconSvg('zap', 13)}
                            {v.ignition}
                          </span>
                          <span>
                            {renderIconSvg('nav', 13)}
                            {v.gps}
                          </span>
                          <span className="sp" />
                          <span>{formatAgoText(v.ago)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Vehicle Detail Slide-in Drawer */}
            <div
              className={`railview railview--detail ${selectedVehicle ? 'open' : ''}`}
              aria-live="polite"
            >
              {selectedVehicle && (
                <>
                  <div className="dtop">
                    <button className="backbtn" onClick={() => setSelectedId(null)}>
                      {renderIconSvg('chevLeft', 16)}
                      Fleet
                    </button>
                    <span style={{ flex: 1 }} />
                    <button
                      className="dclose"
                      aria-label="Close"
                      onClick={() => {
                        setSelectedId(null);
                        exitReplay();
                      }}
                    >
                      {renderIconSvg('x', 16)}
                    </button>
                  </div>

                  <div className="dbody">
                    {/* Vehicle Hero Header */}
                    <div className="dhead">
                      <div className="dtile">{renderIconSvg('truck', 22)}</div>
                      <div className="dtitle">
                        <div className="plate">{selectedVehicle.plate}</div>
                        <div className="model">
                          {selectedVehicle.model} · <code>#{selectedVehicle.vin}</code>
                        </div>
                      </div>
                    </div>

                    <div className="statusrow">
                      {(() => {
                        const s = NOVA_STATUS[selectedVehicle.status] || NOVA_STATUS.offline;
                        return (
                          <span className="status" style={{ '--tint': s.tint, '--c': s.c }}>
                            <i />
                            {s.label} · {s.trip}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Active Route Box */}
                    <div className="droute">
                      <div className="eyebrow-mini" style={{ marginBottom: 6 }}>
                        Current dispatch
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--type-xs)', marginBottom: 2 }}>
                        {selectedVehicle.route[1]} → {selectedVehicle.route[3]}
                      </div>
                      <div style={{ color: 'var(--fg-secondary)', fontSize: 'var(--type-2xs)' }}>
                        Trip ref · {selectedVehicle.route[0]}-{selectedVehicle.route[2]}-
                        {selectedVehicle.plate.slice(-4)}
                      </div>
                    </div>

                    {/* Metric Tiles */}
                    <div className="metrics">
                      <div className="metric">
                        {renderIconSvg('fuel', 18)}
                        <div>
                          <div className="k">Fuel</div>
                          <div className="v">{selectedVehicle.fuel} L</div>
                        </div>
                      </div>

                      <div className="metric">
                        {renderIconSvg('zap', 18)}
                        <div>
                          <div className="k">Ignition</div>
                          <div className={`v ${selectedVehicle.ignition === 'ON' ? 'ok' : 'off'}`}>
                            {selectedVehicle.ignition}
                          </div>
                        </div>
                      </div>

                      <div className="metric">
                        {renderIconSvg('nav', 18)}
                        <div>
                          <div className="k">GPS</div>
                          <div className={`v ${selectedVehicle.gps === 'Active' ? 'ok' : 'off'}`}>
                            {selectedVehicle.gps}
                          </div>
                        </div>
                      </div>

                      <div className="metric">
                        {renderIconSvg('gauge', 18)}
                        <div>
                          <div className="k">Speed</div>
                          <div className="v">{selectedVehicle.speed} km/h</div>
                        </div>
                      </div>
                    </div>

                    {/* Location and Last Update Lines */}
                    <div className="dlist">
                      <div className="dline">
                        {renderIconSvg('pin', 18)}
                        <div>
                          <b>{selectedVehicle.area}</b>
                          {selectedVehicle.lat.toFixed(4)}, {selectedVehicle.lng.toFixed(4)}
                        </div>
                      </div>

                      <div className="dline">
                        {renderIconSvg('clock', 18)}
                        <div>
                          <b>{formatFullStamp(selectedVehicle.ago)}</b>
                          Last update · {formatAgoText(selectedVehicle.ago)}
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="dactions">
                      <button
                        className="act"
                        onClick={() => {
                          mapRef.current?.panTo({
                            lat: selectedVehicle.lat,
                            lng: selectedVehicle.lng,
                          });
                          mapRef.current?.setZoom(14);
                          showToast(`Focused on ${selectedVehicle.plate}`);
                        }}
                      >
                        {renderIconSvg('pin', 18)}
                        Focus
                      </button>

                      <button
                        className="act"
                        aria-pressed={isTrailVisible && !replayState.on}
                        disabled={trailLoading}
                        onClick={() => toggleTrail(selectedVehicle)}
                      >
                        {renderIconSvg('route', 18)}
                        Trail
                      </button>

                      <button
                        className="act"
                        aria-pressed={replayState.on}
                        onClick={() => enterReplay(selectedVehicle)}
                      >
                        {renderIconSvg('play', 18)}
                        Replay
                      </button>

                      <button
                        className="act"
                        aria-pressed={modal360Open}
                        onClick={() => open360Modal(selectedVehicle)}
                      >
                        {renderIconSvg('sat', 18)}
                        360°
                      </button>

                      <button className="act" onClick={() => handleShareVehicle(selectedVehicle)}>
                        {renderIconSvg('share', 18)}
                        Share
                      </button>
                    </div>

                    {/* Deep Details Accordion Sections */}
                    <div className="sections">
                      <details className="sec" open>
                        <summary>
                          {renderIconSvg('trip', 16)}
                          Trip progress
                          <span className="chev">{renderIconSvg('chevDown', 16)}</span>
                        </summary>
                        <div className="secbody">
                          {selectedVehicle.live ? (
                            <>
                              <div className="kv">
                                <span className="k">Route distance</span>
                                <span className="v">{selectedVehicle.totalKm} km</span>
                              </div>
                              <div className="kv">
                                <span className="k">Covered</span>
                                <span className="v">
                                  {Math.round(
                                    (selectedVehicle.totalKm * selectedVehicle.progress) / 100,
                                  )}{' '}
                                  km · {selectedVehicle.progress}%
                                </span>
                              </div>
                              <div className="kv">
                                <span className="k">Remaining</span>
                                <span className="v">
                                  {selectedVehicle.totalKm -
                                    Math.round(
                                      (selectedVehicle.totalKm * selectedVehicle.progress) / 100,
                                    )}{' '}
                                  km
                                </span>
                              </div>
                              <div className="kv">
                                <span className="k">Driving time</span>
                                <span className="v">{formatHrsText(selectedVehicle.tripMin)}</span>
                              </div>
                              <div className="kv">
                                <span className="k">Stops</span>
                                <span className="v">{selectedVehicle.stops}</span>
                              </div>
                              <div className="kv">
                                <span className="k">ETA</span>
                                <span className="v">
                                  {formatISTDate(selectedVehicle.etaAt)},{' '}
                                  {formatISTTime(selectedVehicle.etaAt)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="secnote">
                              No trip in progress. Last assigned route {selectedVehicle.route[0]} →{' '}
                              {selectedVehicle.route[2]}.
                            </div>
                          )}
                        </div>
                      </details>

                      <details className="sec">
                        <summary>
                          {renderIconSvg('info', 16)}
                          Vehicle information
                          <span className="chev">{renderIconSvg('chevDown', 16)}</span>
                        </summary>
                        <div className="secbody">
                          <div className="kv">
                            <span className="k">Chassis / VIN</span>
                            <span className="v">{selectedVehicle.vin}</span>
                          </div>
                          <div className="kv">
                            <span className="k">Model</span>
                            <span className="v">{selectedVehicle.model}</span>
                          </div>
                          <div className="kv">
                            <span className="k">Odometer</span>
                            <span className="v">
                              {selectedVehicle.odo.toLocaleString('en-IN')} km
                            </span>
                          </div>
                          <div className="kv">
                            <span className="k">Registered</span>
                            <span className="v">{selectedVehicle.reg}</span>
                          </div>
                        </div>
                      </details>

                      <details className="sec">
                        <summary>
                          {renderIconSvg('user', 16)}
                          Driver &amp; assignment
                          <span className="chev">{renderIconSvg('chevDown', 16)}</span>
                        </summary>
                        <div className="secbody">
                          <div className="secnote">
                            No driver assigned to this vehicle in the current shift.
                          </div>
                        </div>
                      </details>

                      <details className="sec">
                        <summary>
                          {renderIconSvg('doc', 16)}
                          Documents
                          <span className="chev">{renderIconSvg('chevDown', 16)}</span>
                        </summary>
                        <div className="secbody">
                          <div className="secnote">
                            Permit, insurance and fitness records open in Fleet records.
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </main>

      {/* Floating Toast Notification */}
      <div className={`toast ${toastMsg ? 'on' : ''}`}>
        {renderIconSvg('radio', 14)}
        <span>{toastMsg}</span>
      </div>
    </div>
  );
};

export default LiveTrackingPage;
