import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleMap, useLoadScript, MarkerF, PolylineF } from '@react-google-maps/api';
import apiClient from '../../utils/axiosConfig';
import DriverVehicleAssignmentService from '../../services/DriverVehicleAssignmentService';
import { useLivePositions } from '../../hooks/useLivePositions';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import { useShareLink } from '../../hooks/useShareLink';
import { LiveTrackingService } from './LiveTrackingService.jsx';
import RoadService from '../../services/RoadService';
import RoadTrailLayer from '../../components/map/RoadTrailLayer';
import RoadTrailLegend from '../../components/map/RoadTrailLegend';
import { toLayers, summaryOf } from '../../lib/roadTrail';
import {
  NOVA_STATUS,
  bearingDegrees,
  haversineKm,
  formatAgoText,
  formatDayText,
  formatFullStamp,
  resolveVehicleStatus,
  LIGHT_MAP_STYLE,
  DARK_MAP_STYLE,
  trailArrowIcons,
  computeMapVehicles,
} from './liveTracking.shared.js';
import AnimatedVehicleMarkers from './AnimatedVehicleMarkers.jsx';
import DestinationIntentSection from './DestinationIntentSection.jsx';
import './LiveTracking.css';

const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '')
  .replace(/['"]/g, '')
  .trim();
const GOOGLE_MAPS_LIBRARIES = ['places', 'drawing'];
const INDIA_CENTER = { lat: 22.5937, lng: 78.9629 };

const createReplayTruckIcon = (heading = 0, zoom = 12) => {
  if (typeof window === 'undefined' || !window.google) return undefined;
  const effectiveZ =
    typeof zoom === 'number' && !isNaN(zoom) ? Math.max(4, Math.min(20, zoom)) : 12;
  const sz = Math.round(38 + (effectiveZ - 4) * 3.2);
  const center = Math.round(sz / 2);
  // Clean directional "navigation cursor": soft halo + white disc + a crisp
  // green arrow that rotates to the direction of travel.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${sz}" height="${sz}" viewBox="0 0 48 48" data-scale="${sz}">
    <defs>
      <filter id="rsh" x="-40%" y="-40%" width="180%" height="180%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="2.5" flood-color="#0B3D1A" flood-opacity="0.35"/>
      </filter>
    </defs>
    <circle cx="24" cy="24" r="21" fill="#187A32" fill-opacity="0.16"/>
    <g filter="url(#rsh)">
      <circle cx="24" cy="24" r="14" fill="#FFFFFF"/>
      <circle cx="24" cy="24" r="14" fill="none" stroke="#187A32" stroke-width="2"/>
      <g transform="rotate(${Math.round(heading)}, 24, 24)">
        <path d="M24 13 L31 31 L24 26.5 L17 31 Z"
          fill="#187A32" stroke="#187A32" stroke-width="1" stroke-linejoin="round"/>
      </g>
    </g>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(sz, sz),
    anchor: new window.google.maps.Point(center, center),
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

/* ---------------- SVG Icons ---------------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
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

/* Total path length (km) of an ordered [lat, lng] breadcrumb list — this is
   real distance derived from the backend trail, not a synthetic estimate. */
const trailDistanceKm = (points) => {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    sum += haversineKm(points[i - 1], points[i]);
  }
  return sum;
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
  const { createAndCopy: createShareAndCopy, creating: shareCreating } = useShareLink();
  // Share dialog: null = closed, else { plate, ttlDays, trailHours, url }.
  const [shareDialog, setShareDialog] = useState(null);

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
  const [isRailOpen, setIsRailOpen] = useState(true);
  const [mapMode, setMapMode] = useState('map'); // 'map' | 'sat'
  const [isTelemetryOn, setIsTelemetryOn] = useState(true);

  // Filters & selection
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [clockTime, setClockTime] = useState('—');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Google Maps Load Script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Trail & Replay state
  const [trailLoading, setTrailLoading] = useState(false);
  const [isTrailVisible, setIsTrailVisible] = useState(false);
  const [trailPoints, setTrailPoints] = useState([]);
  const [roadTrail, setRoadTrail] = useState(null); // road geometry from our engine (plan P4.10)
  const [replayState, setReplayState] = useState({
    on: false,
    playing: false,
    t: 0,
    speed: 4,
    pts: null,
  });
  const [mapZoom, setMapZoom] = useState(12);
  const [driverAssignments, setDriverAssignments] = useState({});

  // Map & interaction refs
  const mapRef = useRef(null);
  const didAutoFitRef = useRef(false);
  // Tracks the last vehicle we zoomed to, so the gentle select-zoom fires once
  // per new pick — not on every live position update of the followed vehicle.
  const zoomedSelectionRef = useRef(null);
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

  // Fetch Active Driver ↔ Vehicle Assignments
  useEffect(() => {
    let cancelled = false;
    const loadAssignments = async () => {
      try {
        const res = await DriverVehicleAssignmentService.getAssignments();
        const list = Array.isArray(res) ? res : res?.items || res?.records || [];
        if (cancelled) return;
        const map = {};
        list.forEach((a) => {
          const vehReg = (a.vehicleId?.registrationNumber || a.registrationNumber || '')
            .toUpperCase()
            .trim();
          const vehId = a.vehicleId?._id || a.vehicleId;
          if (vehReg) {
            map[vehReg.replace(/\s+/g, '')] = a;
            map[vehReg] = a;
          }
          if (vehId && typeof vehId === 'string') {
            map[vehId] = a;
          }
        });
        setDriverAssignments(map);
      } catch (err) {
        console.warn('Could not load driver vehicle assignments:', err);
      }
    };
    loadAssignments();
    return () => {
      cancelled = true;
    };
  }, []);

  // Build Unified Vehicles List
  const vehicles = useMemo(() => {
    if (!Array.isArray(rawPositions) || rawPositions.length === 0) return [];

    return rawPositions
      .map((p) => {
        const reg = (p.registrationNumber || '').toUpperCase().trim();
        if (!reg) return null;
        const cleanReg = reg.replace(/\s+/g, '');
        const meta = vehiclesMeta[cleanReg] || vehiclesMeta[reg] || {};
        const st = resolveVehicleStatus(p).toLowerCase();
        const hasFix = p.latitude != null && p.longitude != null;
        const lat = hasFix ? Number(p.latitude) : null;
        const lng = hasFix ? Number(p.longitude) : null;
        const speed = p.speed != null ? Math.round(p.speed) : null;
        const fuel =
          p.primaryFuelLevel != null ? Number(Number(p.primaryFuelLevel).toFixed(1)) : null;
        const ignition = p.ignition === true || p.ignition === 'ON' ? 'ON' : 'OFF';
        const isLive = st !== 'offline' && !p.isStale;

        const minutesAgo = p.eventDateTime
          ? Math.max(0, Math.round((Date.now() - new Date(p.eventDateTime).getTime()) / 60000))
          : null;

        return {
          id: `live-${cleanReg}`,
          plate: reg,
          model: meta.model || meta.manufacturer || null,
          vin: meta.chassisNumber || p.vin || null,
          status: st,
          live: isLive,
          hasFix,
          lat,
          lng,
          area:
            meta.currentLocation ||
            meta.branch ||
            p.address ||
            (hasFix ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : null),
          speed,
          fuel,
          fuelUnit: p.fuelLevelUnit || null,
          ignition,
          gps: isLive ? 'Active' : 'No fix',
          ago: minutesAgo,
          eventDateTime: p.eventDateTime || null,
          courseDegrees: p.courseDegrees != null ? p.courseDegrees : null,
          odo: meta.odometer != null ? meta.odometer : null,
          regYear: meta.manufacturingYear != null ? meta.manufacturingYear : null,
        };
      })
      .filter(Boolean);
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

  // Counts for the connected status bar cards matching WheelsEye standard
  const counts = useMemo(() => {
    return {
      all: vehicles.length,
      moving: vehicles.filter((v) => v.status === 'moving').length,
      stopped: vehicles.filter((v) => v.status === 'stopped').length,
      idling: vehicles.filter((v) => v.status === 'idling').length,
      offline: vehicles.filter((v) => v.status === 'offline').length,
      breakdown: vehicles.filter(
        (v) => v.status === 'breakdown' || v.status === 'workshop' || v.inWorkshop || v.isBreakdown,
      ).length,
      faulty: vehicles.filter(
        (v) => v.status === 'faulty' || v.hasFault || (v.alertsCount && v.alertsCount > 0),
      ).length,
      geofence: vehicles.filter((v) => v.status === 'geofence' || v.inGeofenceAlert).length,
      gps: vehicles.filter((v) => v.live).length,
    };
  }, [vehicles]);

  // Filtered vehicles according to the active top status card
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vehicles.filter((v) => {
      let matchesFilter = true;
      if (filter === 'all') {
        matchesFilter = true;
      } else if (filter === 'moving') {
        matchesFilter = v.status === 'moving';
      } else if (filter === 'stopped') {
        matchesFilter = v.status === 'stopped';
      } else if (filter === 'idling') {
        matchesFilter = v.status === 'idling';
      } else if (filter === 'offline') {
        matchesFilter = v.status === 'offline';
      } else if (filter === 'breakdown') {
        matchesFilter =
          v.status === 'breakdown' || v.status === 'workshop' || v.inWorkshop || v.isBreakdown;
      } else if (filter === 'faulty') {
        matchesFilter = v.status === 'faulty' || v.hasFault || (v.alertsCount && v.alertsCount > 0);
      } else if (filter === 'geofence') {
        matchesFilter = v.status === 'geofence' || v.inGeofenceAlert;
      } else if (filter === 'gps') {
        matchesFilter = v.live;
      }

      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        v.plate.toLowerCase().includes(q) ||
        (v.model || '').toLowerCase().includes(q) ||
        (v.vin || '').toLowerCase().includes(q) ||
        (v.area || '').toLowerCase().includes(q)
      );
    });
  }, [vehicles, filter, searchQuery]);

  // Selected vehicle object
  const selectedVehicle = selectedId ? byId[selectedId] : null;

  // Vehicles plotted on the Google Map:
  // Guarantees that if a vehicle is selected, it NEVER vanishes from the map even when
  // switching filter tabs (e.g. from moving to stopped) or when changing statuses.
  const mapVehicles = useMemo(() => {
    return computeMapVehicles(filteredVehicles, selectedVehicle);
  }, [filteredVehicles, selectedVehicle]);

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
  // Fit the viewport to the GPS-live vehicles (those with a fix). Clamps the
  // zoom afterwards so a single live vehicle only zooms in "a little" rather
  // than to street level. Returns true if it had something to fit.
  const fitToLiveVehicles = useCallback(
    (map) => {
      if (!map || !window.google) return false;
      const live = vehicles.filter((v) => v.live && v.hasFix);
      if (!live.length) return false;
      const bounds = new window.google.maps.LatLngBounds();
      live.forEach((v) => bounds.extend({ lat: v.lat, lng: v.lng }));
      map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
      window.google.maps.event.addListenerOnce(map, 'idle', () => {
        // Land a little closer than a bare fit — one notch in, capped so a tight
        // cluster doesn't rocket to street level and a spread fleet still nudges in.
        const z = map.getZoom() || 6;
        map.setZoom(Math.min(z + 1, 13));
      });
      return true;
    },
    [vehicles],
  );

  const onMapLoad = useCallback(
    (map) => {
      mapRef.current = map;
      const initialZ = map.getZoom();
      if (typeof initialZ === 'number') {
        setMapZoom(initialZ);
      }
      map.addListener('zoom_changed', () => {
        const z = map.getZoom();
        if (typeof z === 'number') {
          setMapZoom(z);
        }
      });
      // Try fitting to live vehicles immediately; if positions haven't loaded
      // yet, the auto-fit effect below handles it once they arrive.
      if (fitToLiveVehicles(map)) {
        didAutoFitRef.current = true;
      }
    },
    [fitToLiveVehicles],
  );

  // One-time auto-fit to GPS-live vehicles once positions first arrive, so
  // landing on the page frames the moving fleet instead of all of India.
  useEffect(() => {
    if (didAutoFitRef.current || !mapRef.current || selectedId) return;
    if (fitToLiveVehicles(mapRef.current)) {
      didAutoFitRef.current = true;
    }
  }, [fitToLiveVehicles, selectedId]);

  // Pan / focus when selected vehicle changes
  useEffect(() => {
    if (!selectedVehicle || !selectedVehicle.hasFix || !mapRef.current) return;
    const map = mapRef.current;
    map.panTo({ lat: selectedVehicle.lat, lng: selectedVehicle.lng });
    // Gentle zoom-in only when a NEW vehicle is picked — not on every live
    // update of the one we're already following (that would fight the user's
    // own zoom/pan). Never zoom back out if they're already closer in.
    if (zoomedSelectionRef.current !== selectedVehicle.id) {
      if ((map.getZoom() || 5) < 14) map.setZoom(14);
      zoomedSelectionRef.current = selectedVehicle.id;
    }
  }, [selectedVehicle]);

  // Clearing the selection re-arms the gentle zoom, so re-picking the same
  // vehicle later zooms in again.
  useEffect(() => {
    if (!selectedId) zoomedSelectionRef.current = null;
  }, [selectedId]);

  const selectedStatusColor = useMemo(() => {
    if (!selectedVehicle) return '#187A32';
    return (NOVA_STATUS[selectedVehicle.status] || NOVA_STATUS.moving).c;
  }, [selectedVehicle]);

  // Breadcrumb Trail points transformed to LatLng objects
  const trailCoords = useMemo(() => {
    return trailPoints.map(([lat, lng]) => ({ lat, lng }));
  }, [trailPoints]);

  // Total distance (km) of the currently loaded trail — real, from the trail
  const trailKm = useMemo(() => trailDistanceKm(trailPoints), [trailPoints]);

  // Replay base trail points transformed to LatLng objects
  const replayPtsCoords = useMemo(() => {
    if (!replayState.pts) return [];
    return replayState.pts.map(([lat, lng]) => ({ lat, lng }));
  }, [replayState.pts]);

  // Derived current replay position, animated trail slice, and heading
  const { replayCurrentPos, replayRunPath, replayBearing } = useMemo(() => {
    if (!replayState.on || !replayState.pts || replayState.pts.length < 2) {
      return { replayCurrentPos: null, replayRunPath: [], replayBearing: 0 };
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
    const pathSlice = pts.slice(0, i + 1).map(([lat, lng]) => ({ lat, lng }));
    pathSlice.push(cur);
    const brg = bearingDegrees(p0, p1);
    return { replayCurrentPos: cur, replayRunPath: pathSlice, replayBearing: brg };
  }, [replayState.on, replayState.pts, replayState.t]);

  // Replay animation frame ticker (decoupled from replayState.t so 60fps loop runs smoothly without tearing down)
  useEffect(() => {
    if (!replayState.on || !replayState.playing || !replayState.pts || replayState.pts.length < 2) {
      lastReplayTimeRef.current = 0;
      return;
    }

    let animId;
    const speed = replayState.speed || 1;
    const duration = 24 / speed;

    const step = (ts) => {
      if (!lastReplayTimeRef.current) {
        lastReplayTimeRef.current = ts;
      }
      const dt = (ts - lastReplayTimeRef.current) / 1000;
      lastReplayTimeRef.current = ts;

      setReplayState((prev) => {
        if (!prev.playing) return prev;
        const nextT = prev.t + dt / duration;
        if (nextT >= 1) {
          return { ...prev, t: 1, playing: false };
        }
        return { ...prev, t: nextT };
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [replayState.on, replayState.playing, replayState.speed, replayState.pts]);

  // Toggle breadcrumb trail
  const toggleTrail = useCallback(
    async (v) => {
      if (isTrailVisible && !replayState.on) {
        setIsTrailVisible(false);
        setTrailPoints([]);
        setRoadTrail(null);
        return;
      }

      if (replayState.on) {
        setReplayState((prev) => ({ ...prev, on: false, playing: false }));
      }

      setTrailLoading(true);
      let points = [];

      try {
        const trailData = await LiveTrackingService.getTrail(v.plate);
        if (trailData?.points?.length > 1) {
          points = trailData.points
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => [p.latitude, p.longitude]);
        }
      } catch {
        // Trail is optional; empty-state handled below.
      } finally {
        setTrailLoading(false);
      }

      if (!points || points.length < 2) {
        showToast(`No recorded trail for ${v.plate}`);
        return;
      }

      // Road geometry for the same 24 h window the raw trail uses (backend trailDefaultHours = 24).
      const road = await RoadService.getRoadTrailIfEnabled(v.plate, {
        from: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        to: new Date().toISOString(),
      });
      setRoadTrail(road);
      setTrailPoints(points);
      setIsTrailVisible(true);

      if (mapRef.current && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        points.forEach(([lat, lng]) => bounds.extend({ lat, lng }));
        mapRef.current.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
      }
      const roadSummary = summaryOf(road);
      showToast(
        roadSummary
          ? `Trail · ${roadSummary.km.toFixed(1)} km ${roadSummary.label} · ${points.length} points`
          : `Trail · ${trailDistanceKm(points).toFixed(1)} km straight-line estimate · ${points.length} points`,
      );
    },
    [isTrailVisible, replayState.on, showToast],
  );

  // Enter Replay
  const enterReplay = useCallback(
    async (v) => {
      let points = [];
      try {
        const trailData = await LiveTrackingService.getTrail(v.plate);
        if (trailData?.points?.length > 1) {
          points = trailData.points
            .filter((p) => p.latitude != null && p.longitude != null)
            .map((p) => [p.latitude, p.longitude]);
        }
      } catch {
        // Trail is optional; empty-state handled below.
      }

      if (!points || points.length < 2) {
        showToast('No recorded trail to replay for this vehicle');
        return;
      }

      setRoadTrail(
        await RoadService.getRoadTrailIfEnabled(v.plate, {
          from: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
          to: new Date().toISOString(),
        }),
      );
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
    setIsTrailVisible(false);
    setRoadTrail(null);
  }, []);

  // Selected vehicle's active driver resolver
  const selectedDriver = useMemo(() => {
    if (!selectedVehicle) return null;
    const cleanPlate = (selectedVehicle.plate || '').toUpperCase().replace(/\s+/g, '');
    const meta = vehiclesMeta[cleanPlate] || vehiclesMeta[selectedVehicle.plate] || {};

    const assignment =
      driverAssignments[cleanPlate] ||
      driverAssignments[selectedVehicle.plate] ||
      (meta._id ? driverAssignments[meta._id] : null);

    if (assignment) {
      const d =
        assignment.driverId && typeof assignment.driverId === 'object' ? assignment.driverId : null;
      return {
        name: d?.name || d?.fullName || assignment.driverName || 'Primary Driver',
        phone: d?.phone || d?.mobileNumber || assignment.driverPhone || null,
        since: assignment.startDate ? formatDayText(assignment.startDate) : null,
      };
    }

    if (meta.assignedDriver) {
      if (typeof meta.assignedDriver === 'object') {
        return {
          name: meta.assignedDriver.name || meta.assignedDriver.fullName || 'Assigned Driver',
          phone: meta.assignedDriver.phone || meta.assignedDriver.mobileNumber || null,
        };
      }
    }

    if (meta.driverName || meta.driver) {
      const d = typeof meta.driver === 'object' ? meta.driver : null;
      return {
        name: meta.driverName || d?.name || d?.fullName || 'Assigned Driver',
        phone: meta.driverPhone || meta.driverMobile || d?.phone || null,
      };
    }

    return null;
  }, [selectedVehicle, vehiclesMeta, driverAssignments]);

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        setIsRailOpen(true);
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (replayState.on) exitReplay();
        else setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [replayState.on, exitReplay]);

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

  // Share Page Link (kept for when universal share button is restored)
  const _handleShareAll = useCallback(() => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    showToast('Live tracking link copied to clipboard');
  }, [showToast]);

  // Share Vehicle Link — opens a dialog to choose how long the link works and
  // how much recorded trail a viewer may see, then mints a public,
  // document-style link that exposes ONLY this vehicle's live location.
  const handleShareVehicle = useCallback((v) => {
    setShareDialog({ plate: v.plate, ttlDays: 7, trailHours: 6, url: '' });
  }, []);

  const submitShareLink = useCallback(() => {
    if (!shareDialog) return;
    const { plate, ttlDays, trailHours } = shareDialog;
    createShareAndCopy(
      {
        resourceType: 'vehicle_location',
        resource: { registrationNumber: plate },
        ttlDays,
        options: { trailHours },
      },
      {
        onDone: (url) => {
          setShareDialog((prev) => (prev ? { ...prev, url } : prev));
          showToast(`Public link copied · ${plate}`);
        },
        onError: () => showToast(`Could not create link for ${plate}`),
      },
    );
  }, [shareDialog, createShareAndCopy, showToast]);

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

  // Connected status cards definition matching WheelsEye standard
  const STATUS_CARDS = useMemo(
    () => [
      { k: 'all', label: 'All', count: counts.all, stripe: '#0A1128', countColor: null },
      { k: 'moving', label: 'Moving', count: counts.moving, stripe: '#0C9F41', countColor: null },
      {
        k: 'stopped',
        label: 'Stopped',
        count: counts.stopped,
        stripe: '#9333EA',
        countColor: null,
      },
      { k: 'idling', label: 'Idling', count: counts.idling, stripe: '#F97316', countColor: null },
      {
        k: 'offline',
        label: 'Offline',
        count: counts.offline,
        stripe: '#9CA3AF',
        countColor: null,
      },
      {
        k: 'breakdown',
        label: 'Breakdown',
        count: counts.breakdown,
        stripe: '#EF4444',
        countColor: '#EF4444',
      },
      {
        k: 'faulty',
        label: 'Faulty',
        count: counts.faulty,
        stripe: '#84CC16',
        countColor: '#84CC16',
      },
      {
        k: 'geofence',
        label: 'Geofence',
        count: counts.geofence,
        stripe: '#3B82F6',
        countColor: null,
      },
    ],
    [counts],
  );

  return (
    <div className="gnb-lt-page">
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

          {/* Connected Telematics Status Bar Strip (WheelsEye Style) */}
          <div className="gnb-status-bar" role="tablist" aria-label="Fleet status filters">
            {STATUS_CARDS.map((card) => {
              const isActive = filter === card.k;
              return (
                <button
                  key={card.k}
                  type="button"
                  role="tab"
                  className={`gnb-status-card ${isActive ? 'gnb-status-card--active' : ''}`}
                  aria-selected={isActive}
                  onClick={() => setFilter(card.k)}
                >
                  <span
                    className="gnb-status-card-count"
                    style={!isActive && card.countColor ? { color: card.countColor } : undefined}
                  >
                    {card.count}
                  </span>
                  <span className="gnb-status-card-label">{card.label}</span>
                  {!isActive && (
                    <span
                      className="gnb-status-card-stripe"
                      style={{ backgroundColor: card.stripe }}
                    />
                  )}
                  {isActive && <span className="gnb-status-card-arrow" />}
                </button>
              );
            })}
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
                  zoom={mapZoom}
                  onLoad={onMapLoad}
                  onZoomChanged={() => {
                    if (mapRef.current) {
                      const z = mapRef.current.getZoom();
                      if (typeof z === 'number') setMapZoom(z);
                    }
                  }}
                  options={mapOptions}
                >
                  {/* Fleet Vehicle Markers — imperative markers that glide between
                      SSE fixes instead of teleporting (see AnimatedVehicleMarkers). */}
                  <AnimatedVehicleMarkers
                    vehicles={mapVehicles}
                    selectedId={selectedId}
                    mapZoom={mapZoom}
                    onSelect={(id) => {
                      setSelectedId(id);
                      setIsRailOpen(true);
                    }}
                  />

                  {/* Breadcrumb Trail (real recorded path from the trail API) */}
                  {isTrailVisible && trailCoords.length > 1 && (
                    <>
                      {roadTrail && roadTrail.mode === 'MATCHED' ? (
                        <RoadTrailLayer trail={roadTrail} color={selectedStatusColor} />
                      ) : (
                        <PolylineF
                          path={trailCoords}
                          options={{
                            strokeColor: selectedStatusColor,
                            strokeOpacity: 0.9,
                            strokeWeight: 4,
                            icons: trailArrowIcons(selectedStatusColor),
                          }}
                        />
                      )}
                      <MarkerF
                        position={trailCoords[0]}
                        icon={createTrailEndpointIcon('S', selectedStatusColor)}
                      />
                      <MarkerF
                        position={trailCoords[trailCoords.length - 1]}
                        icon={createTrailEndpointIcon('E', selectedStatusColor)}
                      />
                    </>
                  )}

                  {/* Trip Replay */}
                  {replayState.on && replayPtsCoords.length > 1 && (
                    <>
                      {roadTrail && roadTrail.mode === 'MATCHED' ? (
                        <RoadTrailLayer trail={roadTrail} color="#9A9AA5" fleetColor="#c4b5fd" />
                      ) : (
                        <PolylineF
                          path={replayPtsCoords}
                          options={{
                            strokeColor: '#9A9AA5',
                            strokeOpacity: 0.45,
                            strokeWeight: 4,
                          }}
                        />
                      )}
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
                          key={`replay-${Math.round(mapZoom * 2) / 2}`}
                          position={replayCurrentPos}
                          icon={createReplayTruckIcon(replayBearing, mapZoom)}
                          zIndex={1200}
                        />
                      )}
                    </>
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

            {/* Overlay Left-Bottom: Zoom Controls */}
            <div className="ov ov--lc">
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

            {/* Overlay Bottom-Left: Map/Satellite Switcher */}
            <div className="ov ov--bl">
              {isTrailVisible && roadTrail && (
                <div
                  className="road-legend-card"
                  style={{
                    background: 'var(--surface, #fff)',
                    padding: 8,
                    borderRadius: 8,
                    marginBottom: 6,
                    maxWidth: 260,
                  }}
                >
                  <RoadTrailLegend
                    layers={toLayers(roadTrail)}
                    calibrated={roadTrail.calibrated}
                    summary={summaryOf(roadTrail)}
                  />
                </div>
              )}
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
                        {selectedVehicle.ago != null
                          ? formatDayText(selectedVehicle.ago)
                          : 'Recorded trail'}
                      </span>
                      <div className="rp-stats">
                        <div className="rp-stat">
                          <div className="k">Distance</div>
                          <div className="v">{trailKm.toFixed(1)} km</div>
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
                          setReplayState((prev) => {
                            const willPlay = !prev.playing;
                            const nextT = willPlay && prev.t >= 0.999 ? 0 : prev.t;
                            return { ...prev, playing: willPlay, t: nextT };
                          })
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
                    <b>{telemetryVehicle.speed != null ? telemetryVehicle.speed : '—'}</b> km/h
                  </span>
                  <span className="tsep" />
                  <span className="tval">
                    Fuel <b>{telemetryVehicle.fuel != null ? `${telemetryVehicle.fuel} L` : '—'}</b>
                  </span>
                  <span className="tsep" />
                  <span className="tval">
                    Ign <b>{telemetryVehicle.ignition}</b>
                  </span>
                  <span className="tsep opt1" />
                  <span className="tval opt1">
                    GPS <b>{telemetryVehicle.gps}</b>
                  </span>
                  <span className="tsep opt2" />
                  <span className="tval opt2">
                    {telemetryVehicle.ago != null ? formatAgoText(telemetryVehicle.ago) : '—'}
                  </span>
                </div>
              )}
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
                            <div className="vc-vin">{v.vin ? `#${v.vin}` : '—'}</div>
                          </div>
                          <span className="vc-state">
                            <i />
                            {s.trip}
                          </span>
                        </div>

                        {/* Current location (real position) */}
                        <div className="vc-loc">
                          {renderIconSvg('pin', 13)}
                          <span>{v.area || 'No location fix'}</span>
                        </div>

                        {/* Card Meta Footer */}
                        <div className="vc-meta">
                          <span>
                            {renderIconSvg('fuel', 13)}
                            <b>{v.fuel != null ? `${v.fuel} L` : '—'}</b>
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
                          <span>{v.ago != null ? formatAgoText(v.ago) : '—'}</span>
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
                          {selectedVehicle.model || 'Model n/a'}
                          {selectedVehicle.vin ? (
                            <>
                              {' · '}
                              <code>#{selectedVehicle.vin}</code>
                            </>
                          ) : null}
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

                    {/* Metric Tiles */}
                    <div className="metrics">
                      <div className="metric">
                        {renderIconSvg('fuel', 18)}
                        <div>
                          <div className="k">Fuel</div>
                          <div className="v">
                            {selectedVehicle.fuel != null ? `${selectedVehicle.fuel} L` : '—'}
                          </div>
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
                          <div className="v">
                            {selectedVehicle.speed != null ? `${selectedVehicle.speed} km/h` : '—'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Location and Last Update Lines */}
                    <div className="dlist">
                      <div className="dline">
                        {renderIconSvg('pin', 18)}
                        <div>
                          <b>{selectedVehicle.area || 'No location fix'}</b>
                          {selectedVehicle.hasFix
                            ? `${selectedVehicle.lat.toFixed(4)}, ${selectedVehicle.lng.toFixed(4)}`
                            : 'GPS position unavailable'}
                        </div>
                      </div>

                      <div className="dline">
                        {renderIconSvg('clock', 18)}
                        <div>
                          <b>
                            {selectedVehicle.ago != null
                              ? formatFullStamp(selectedVehicle.ago)
                              : 'No recent report'}
                          </b>
                          Last update ·{' '}
                          {selectedVehicle.ago != null ? formatAgoText(selectedVehicle.ago) : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="dactions">
                      <button
                        className="act"
                        disabled={!selectedVehicle.hasFix}
                        onClick={() => {
                          if (!selectedVehicle.hasFix) {
                            showToast(`No GPS fix for ${selectedVehicle.plate}`);
                            return;
                          }
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
                        disabled={shareCreating}
                        onClick={() => handleShareVehicle(selectedVehicle)}
                      >
                        {renderIconSvg('share', 18)}
                        Share
                      </button>
                    </div>

                    {/* Deep Details Accordion Sections */}
                    <div className="sections">
                      <DestinationIntentSection
                        registrationNumber={selectedVehicle.registrationNumber}
                      />
                      <details className="sec" open>
                        <summary>
                          {renderIconSvg('trip', 16)}
                          Recorded path
                          <span className="chev">{renderIconSvg('chevDown', 16)}</span>
                        </summary>
                        <div className="secbody">
                          {isTrailVisible && trailPoints.length > 1 ? (
                            <>
                              <div className="kv">
                                <span className="k">Path distance</span>
                                <span className="v">{trailKm.toFixed(1)} km</span>
                              </div>
                              <div className="kv">
                                <span className="k">GPS points</span>
                                <span className="v">{trailPoints.length}</span>
                              </div>
                            </>
                          ) : (
                            <div className="secnote">
                              Trip/dispatch data (origin, destination, ETA, planned route) is not
                              provided by telematics. Use <b>Trail</b> or <b>Replay</b> to load this
                              vehicle&apos;s recorded GPS path.
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
                            <span className="v">{selectedVehicle.vin || '—'}</span>
                          </div>
                          <div className="kv">
                            <span className="k">Model</span>
                            <span className="v">{selectedVehicle.model || '—'}</span>
                          </div>
                          <div className="kv">
                            <span className="k">Odometer</span>
                            <span className="v">
                              {selectedVehicle.odo != null
                                ? `${selectedVehicle.odo.toLocaleString('en-IN')} km`
                                : '—'}
                            </span>
                          </div>
                          <div className="kv">
                            <span className="k">Registered</span>
                            <span className="v">{selectedVehicle.regYear || '—'}</span>
                          </div>
                        </div>
                      </details>

                      <details className="sec" open>
                        <summary>
                          {renderIconSvg('user', 16)}
                          Driver &amp; assignment
                          <span className="chev">{renderIconSvg('chevDown', 16)}</span>
                        </summary>
                        <div className="secbody">
                          {selectedDriver ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                gap: '10px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    background: '#2563EB',
                                    color: '#FFFFFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                  }}
                                >
                                  {selectedDriver.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div
                                    style={{ fontWeight: 600, fontSize: '13px', color: '#F1F5F9' }}
                                  >
                                    {selectedDriver.name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                                    Primary Driver
                                    {selectedDriver.since ? ` · Since ${selectedDriver.since}` : ''}
                                  </div>
                                </div>
                              </div>
                              {selectedDriver.phone ? (
                                <a
                                  href={`tel:${selectedDriver.phone}`}
                                  className="btn btn--sm"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: '#187A32',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#FFFFFF',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    fontSize: '12px',
                                  }}
                                >
                                  {renderIconSvg('phone', 14)}
                                  Call
                                </a>
                              ) : (
                                <span style={{ fontSize: '11px', color: '#64748B' }}>No phone</span>
                              )}
                            </div>
                          ) : (
                            <div className="secnote">
                              No driver currently assigned to this vehicle in the ledger.
                            </div>
                          )}
                        </div>
                      </details>

                      <details className="sec" open>
                        <summary>
                          {renderIconSvg('zap', 16)}
                          Live Telematics &amp; Diagnostics
                          <span className="chev">{renderIconSvg('chevDown', 16)}</span>
                        </summary>
                        <div className="secbody">
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, 1fr)',
                              gap: '8px',
                              width: '100%',
                            }}
                          >
                            <div
                              style={{
                                padding: '10px 12px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: '#94A3B8',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                Odometer
                              </div>
                              <div
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#F1F5F9',
                                  marginTop: '2px',
                                }}
                              >
                                {selectedVehicle.odo != null
                                  ? `${Number(selectedVehicle.odo).toLocaleString('en-IN')} km`
                                  : 'Odo N/A'}
                              </div>
                            </div>

                            <div
                              style={{
                                padding: '10px 12px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: '#94A3B8',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                Heading / Course
                              </div>
                              <div
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#F1F5F9',
                                  marginTop: '2px',
                                }}
                              >
                                {selectedVehicle.courseDegrees != null
                                  ? `${Math.round(selectedVehicle.courseDegrees)}°`
                                  : '0° N'}
                              </div>
                            </div>

                            <div
                              style={{
                                padding: '10px 12px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: '#94A3B8',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                Telematics State
                              </div>
                              <div
                                style={{
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: selectedVehicle.live ? '#4ADE80' : '#94A3B8',
                                  marginTop: '2px',
                                }}
                              >
                                {selectedVehicle.live ? '● Connected' : '○ Standby'}
                              </div>
                            </div>

                            <div
                              style={{
                                padding: '10px 12px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: '#94A3B8',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                }}
                              >
                                GPS Coordinates
                              </div>
                              <div
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 500,
                                  color: '#38BDF8',
                                  marginTop: '3px',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                                title="Click to copy coordinates"
                                onClick={() => {
                                  if (selectedVehicle.hasFix) {
                                    navigator.clipboard?.writeText?.(
                                      `${selectedVehicle.lat}, ${selectedVehicle.lng}`,
                                    );
                                    showToast('Coordinates copied to clipboard');
                                  }
                                }}
                              >
                                {selectedVehicle.hasFix
                                  ? `${selectedVehicle.lat.toFixed(4)}, ${selectedVehicle.lng.toFixed(4)}`
                                  : 'No fix'}
                              </div>
                            </div>
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

      {/* Share Link Dialog */}
      {shareDialog && (
        <div className="sharedlg-scrim">
          <button
            type="button"
            className="sharedlg-scrimbtn"
            aria-label="Close share dialog"
            onClick={() => setShareDialog(null)}
          />
          <div className="sharedlg" role="dialog" aria-label="Share vehicle location">
            <div className="sharedlg-head">
              <div>
                <div className="sharedlg-title">Share live location</div>
                <div className="sharedlg-sub">{shareDialog.plate} · anyone with the link</div>
              </div>
              <button
                className="sharedlg-x"
                aria-label="Close"
                onClick={() => setShareDialog(null)}
              >
                {renderIconSvg('x', 16)}
              </button>
            </div>

            <div className="sharedlg-field">
              <span className="sharedlg-label">Link works for</span>
              <div className="sharedlg-opts">
                {[
                  { k: 1, label: '24 hours' },
                  { k: 7, label: '7 days' },
                  { k: 30, label: '30 days' },
                ].map((o) => (
                  <button
                    key={o.k}
                    aria-pressed={shareDialog.ttlDays === o.k}
                    disabled={!!shareDialog.url}
                    onClick={() => setShareDialog((p) => ({ ...p, ttlDays: o.k }))}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="sharedlg-field">
              <span className="sharedlg-label">Show recorded trail</span>
              <div className="sharedlg-opts">
                {[
                  { k: 0, label: 'Off' },
                  { k: 6, label: 'Last 6h' },
                  { k: 24, label: 'Last 24h' },
                ].map((o) => (
                  <button
                    key={o.k}
                    aria-pressed={shareDialog.trailHours === o.k}
                    disabled={!!shareDialog.url}
                    onClick={() => setShareDialog((p) => ({ ...p, trailHours: o.k }))}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {shareDialog.url ? (
              <div className="sharedlg-result">
                <input
                  className="sharedlg-url"
                  aria-label="Shareable tracking link"
                  readOnly
                  value={shareDialog.url}
                />
                <button
                  className="sharedlg-copy"
                  onClick={() => {
                    navigator.clipboard?.writeText(shareDialog.url).catch(() => {});
                    showToast('Link copied');
                  }}
                >
                  {renderIconSvg('share', 15)}
                  Copy
                </button>
              </div>
            ) : (
              <button
                className="sharedlg-create"
                disabled={shareCreating}
                onClick={submitShareLink}
              >
                {shareCreating ? 'Creating…' : 'Create link'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingPage;
