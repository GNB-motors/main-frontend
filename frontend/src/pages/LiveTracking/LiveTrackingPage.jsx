import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  GoogleMap,
  useLoadScript,
  MarkerF,
  MarkerClustererF,
  InfoWindowF,
  PolylineF,
} from '@react-google-maps/api';
import {
  Navigation,
  Compass,
  Clock,
  Droplet,
  Zap,
  MapPin,
  Route,
  Share2,
  Search,
  Download,
  Maximize2,
  Minimize2,
  Tag,
  Crosshair,
  Plus,
  Minus,
  RefreshCw,
  Loader2,
  X,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Activity,
  Gauge,
  Radio,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { LiveTrackingService } from './LiveTrackingService.jsx';
import apiClient from '../../utils/axiosConfig';
import {
  INDIA_CENTER,
  IST_ZONE,
  formatIST,
  formatCardTime,
  formatRelativeIST,
  createVehicleMarkerIcon,
  CLUSTER_STYLES,
  resolveVehicleStatus,
  withCoordinates,
  fitMapToPositions,
} from './liveTracking.shared.js';
import { useLivePositions } from '../../hooks/useLivePositions';
import './LiveTracking.css';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const MAP_OPTIONS = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  gestureHandling: 'greedy',
};

const FILTER_TABS = [
  { id: 'All', label: 'All Fleet' },
  { id: 'GPS', label: 'GPS Live', hasDot: true, dotClass: 'gps' },
  { id: 'Moving', label: 'Moving', hasDot: true, dotClass: 'moving' },
  { id: 'Stopped', label: 'Stopped', hasDot: true, dotClass: 'stopped' },
  { id: 'Idling', label: 'Idling', hasDot: true, dotClass: 'idling' },
  { id: 'Offline', label: 'Offline', hasDot: true, dotClass: 'offline' },
];

const STATUS_COLOR_MAP = {
  Moving: '#10B981',
  Stopped: '#8B5CF6',
  Idling: '#F59E0B',
  Offline: '#94A3B8',
};

const LiveTrackingPage = () => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const fetchInFlightRef = useRef(false);

  // Live positions hook (SSE stream + REST fallback)
  const { positions, isLoading, error: _liveError, lastEventAt, refresh } = useLivePositions();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Vehicle master metadata from /api/vehicles
  const [vehiclesMeta, setVehiclesMeta] = useState({});

  // Active filters and views
  const [activeTab, setActiveTab] = useState('All');
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [selectedReg, setSelectedReg] = useState(null);

  // Map settings
  const [showLabels, setShowLabels] = useState(true);
  const [mapTypeId, setMapTypeId] = useState('roadmap');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Trail state
  const [trail, setTrail] = useState([]);
  const [_trailLoading, setTrailLoading] = useState(false);
  const [_trailError, setTrailError] = useState(null);

  // Playback state
  const [playbackActive, setPlaybackActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const playbackTimerRef = useRef(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  // Fetch vehicles master metadata to enrich live positions with model, manufacturer, etc.
  useEffect(() => {
    let cancelled = false;
    const fetchVehicles = async () => {
      try {
        const res = await apiClient.get('/api/vehicles', { params: { limit: 500 } });
        const list = res.data?.data?.records || res.data?.data || [];
        if (cancelled) return;
        const metaMap = {};
        list.forEach((v) => {
          if (v.registrationNumber) {
            const cleanReg = v.registrationNumber.replace(/\s+/g, '').toUpperCase();
            metaMap[cleanReg] = v;
            metaMap[v.registrationNumber] = v;
          }
          if (v.chassisNumber) {
            metaMap[v.chassisNumber] = v;
          }
        });
        setVehiclesMeta(metaMap);
      } catch {
        // Fallback gracefully
      }
    };
    fetchVehicles();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch trail when a vehicle is selected
  useEffect(() => {
    if (!selectedReg) {
      setTrail([]);
      setTrailError(null);
      setPlaybackActive(false);
      setIsPlaying(false);
      return;
    }
    let cancelled = false;
    const loadTrail = async () => {
      setTrailLoading(true);
      setTrailError(null);
      try {
        const data = await LiveTrackingService.getTrail(selectedReg);
        if (cancelled) return;
        const points = (data.points || [])
          .filter((p) => p.latitude != null && p.longitude != null)
          .map((p) => ({ lat: p.latitude, lng: p.longitude }));
        setTrail(points);
      } catch (err) {
        if (!cancelled) {
          setTrail([]);
          setTrailError(err.detail || 'Could not load vehicle trail.');
        }
      } finally {
        if (!cancelled) setTrailLoading(false);
      }
    };
    loadTrail();
    return () => {
      cancelled = true;
    };
  }, [selectedReg]);

  // Handle Playback animation along trail
  useEffect(() => {
    if (!isPlaying || trail.length === 0) {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
      return;
    }
    playbackTimerRef.current = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= trail.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        const next = prev + 1;
        if (mapRef.current && trail[next]) {
          mapRef.current.panTo(trail[next]);
        }
        return next;
      });
    }, 600);
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, trail]);

  // Status and location counts calculation
  const counts = useMemo(() => {
    const res = {
      All: positions.length,
      GPS: 0,
      Moving: 0,
      Stopped: 0,
      Idling: 0,
      Offline: 0,
    };
    positions.forEach((v) => {
      if (v.latitude != null && v.longitude != null) res.GPS++;
      const s = resolveVehicleStatus(v);
      if (res[s] !== undefined) res[s]++;
    });
    return res;
  }, [positions]);

  // Filtered vehicles based on activeTab and search query
  const filteredVehicles = useMemo(() => {
    const needle = vehicleQuery.trim().toLowerCase();
    return positions
      .filter((v) => {
        // Tab filter
        if (activeTab === 'GPS') {
          if (v.latitude == null || v.longitude == null) return false;
        } else if (activeTab !== 'All') {
          const s = resolveVehicleStatus(v);
          if (s !== activeTab) return false;
        }

        // Search query
        if (needle) {
          const reg = String(v.registrationNumber || '').toLowerCase();
          const vin = String(v.vin || '').toLowerCase();
          const meta = vehiclesMeta[v.registrationNumber] || vehiclesMeta[v.vin] || {};
          const model = String(meta.model || meta.modelName || '').toLowerCase();
          const maker = String(meta.manufacturer || '').toLowerCase();
          if (
            !reg.includes(needle) &&
            !vin.includes(needle) &&
            !model.includes(needle) &&
            !maker.includes(needle)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        // Sort vehicles with active coordinates first
        const hasA = a.latitude != null && a.longitude != null ? 1 : 0;
        const hasB = b.latitude != null && b.longitude != null ? 1 : 0;
        if (hasA !== hasB) return hasB - hasA;
        return String(a.registrationNumber || '').localeCompare(String(b.registrationNumber || ''));
      });
  }, [positions, activeTab, vehicleQuery, vehiclesMeta]);

  // Vehicles with coordinates for map rendering
  const locatedVehicles = useMemo(() => withCoordinates(filteredVehicles), [filteredVehicles]);

  const selectedVehicle = useMemo(
    () => positions.find((v) => v.registrationNumber === selectedReg) || null,
    [positions, selectedReg],
  );

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    if (fetchInFlightRef.current) return;
    fetchInFlightRef.current = true;
    setIsRefreshing(true);
    try {
      await refresh();
      toast.success('Fleet telemetry refreshed');
    } catch {
      toast.error('Could not refresh positions');
    } finally {
      fetchInFlightRef.current = false;
      setIsRefreshing(false);
    }
  }, [refresh]);

  // Select vehicle from map or card
  const handleSelectVehicle = useCallback((vehicle) => {
    if (!vehicle) {
      setSelectedReg(null);
      return;
    }
    setSelectedReg(vehicle.registrationNumber);
    if (vehicle.latitude != null && vehicle.longitude != null && mapRef.current) {
      mapRef.current.panTo({ lat: vehicle.latitude, lng: vehicle.longitude });
      mapRef.current.setZoom(16);
    }
  }, []);

  // Reframe / Center all vehicles on map
  const handleCenterAll = useCallback(() => {
    if (mapRef.current && locatedVehicles.length > 0) {
      fitMapToPositions(mapRef.current, locatedVehicles);
    }
  }, [locatedVehicles]);

  // Toggle fullscreen
  const handleToggleFullscreen = useCallback(() => {
    const elem = containerRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      elem
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  }, []);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (filteredVehicles.length === 0) {
      toast.info('No vehicles to export');
      return;
    }
    const headers = [
      'Registration Number',
      'Status',
      'Speed (km/h)',
      'Ignition',
      'Fuel Level (L)',
      'VIN / Chassis',
      'Manufacturer',
      'Model',
      'Latitude',
      'Longitude',
      'Last Update (IST)',
    ];
    const rows = filteredVehicles.map((v) => {
      const meta = vehiclesMeta[v.registrationNumber] || vehiclesMeta[v.vin] || {};
      return [
        v.registrationNumber || '—',
        resolveVehicleStatus(v),
        v.speed != null ? Math.round(v.speed) : 0,
        v.ignition ? 'ON' : 'OFF',
        v.primaryFuelLevel != null ? v.primaryFuelLevel : '—',
        v.vin || meta.chassisNumber || '—',
        meta.manufacturer || '—',
        meta.model || meta.modelName || '—',
        v.latitude || '—',
        v.longitude || '—',
        formatIST(v.eventDateTime),
      ]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gnb_fleet_live_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Fleet data exported to CSV');
  }, [filteredVehicles, vehiclesMeta]);

  // Share live tracking link
  const handleSharePage = useCallback(() => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Live tracking link copied to clipboard!');
    }
  }, []);

  // Share individual vehicle link
  const handleShareVehicle = useCallback((e, reg) => {
    e.stopPropagation();
    const url = `${window.location.origin}/live-tracking?reg=${encodeURIComponent(reg)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success(`Tracking link for ${reg} copied!`);
    }
  }, []);

  // Focus action on card
  const handleCardFocus = useCallback(
    (e, vehicle) => {
      e.stopPropagation();
      if (vehicle.latitude != null && vehicle.longitude != null) {
        handleSelectVehicle(vehicle);
      } else {
        toast.info(`No active GPS coordinates for ${vehicle.registrationNumber}`);
      }
    },
    [handleSelectVehicle],
  );

  // Trip trail action on card
  const handleCardTrail = useCallback(
    (e, vehicle) => {
      e.stopPropagation();
      handleSelectVehicle(vehicle);
      toast.info(`Plotting trip trail for ${vehicle.registrationNumber}`);
    },
    [handleSelectVehicle],
  );

  // Replay Trail button click on top-left overlay
  const handlePlayBackClick = useCallback(() => {
    if (!selectedVehicle) {
      const firstWithCoords = locatedVehicles[0];
      if (firstWithCoords) {
        handleSelectVehicle(firstWithCoords);
        toast.info(`Selected ${firstWithCoords.registrationNumber} for trail replay`);
      } else {
        toast.info('No vehicles with GPS coordinates to replay');
        return;
      }
    }
    setPlaybackActive(true);
    setIsPlaying(true);
    setPlaybackIndex(0);
  }, [selectedVehicle, locatedVehicles, handleSelectVehicle]);

  return (
    <div className="gnb-lt-container" ref={containerRef}>
      {/* ── Top Operations Command Strip ── */}
      <header className="gnb-lt-topbar">
        {/* Title & Live Status Chip */}
        <div className="gnb-lt-topbar__title-group">
          <h1 className="gnb-lt-topbar__title">
            <Radio size={18} color="#4f46e5" />
            Live Tracking
          </h1>
          <span className="gnb-lt-topbar__gps-chip">
            <span className="gnb-lt-live-ping" />
            {counts.GPS} Live on Map
          </span>
        </div>

        {/* GNB Segmented Status Filter Tabs */}
        <nav className="gnb-lt-filters-wrap" aria-label="Status Filters">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = counts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                className={`gnb-lt-filter-btn ${isActive ? 'is-active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.hasDot && <span className={`gnb-status-dot ${tab.dotClass}`} />}
                <span>{tab.label}</span>
                <span className="gnb-lt-filter-btn__badge">{count}</span>
              </button>
            );
          })}
        </nav>

        {/* Sync & Refresh Actions */}
        <div className="gnb-lt-topbar__actions">
          {lastEventAt && (
            <span className="gnb-lt-sync-meta">
              <Clock size={12} />
              {lastEventAt.toLocaleTimeString('en-IN', {
                hour12: true,
                timeZone: IST_ZONE,
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              IST
            </span>
          )}
          <button
            type="button"
            className="gnb-lt-action-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh telemetry"
          >
            {isRefreshing ? <Loader2 size={15} className="fc-spin" /> : <RefreshCw size={15} />}
          </button>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <div className="gnb-lt-workspace">
        {/* ── Map Area ── */}
        <div className="gnb-lt-map-wrapper">
          {/* Top-Left Overlays: Live Stream Pill & Replay Trail Button */}
          <div className="gnb-lt-map-top-left">
            <div className="gnb-lt-live-chip">
              <span className="pulse-dot" />
              LIVE TELEMETRY
            </div>
            <button
              type="button"
              className="gnb-lt-replay-btn"
              onClick={handlePlayBackClick}
              title="Replay traveled route on map"
            >
              <Route size={14} color="#4f46e5" />
              Replay Trail
            </button>
          </div>

          {/* Right Floating Controls */}
          <div className="gnb-lt-floating-controls">
            <button
              type="button"
              className="gnb-lt-map-ctrl-btn"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              onClick={handleToggleFullscreen}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              type="button"
              className={`gnb-lt-map-ctrl-btn ${showLabels ? 'is-active' : ''}`}
              title="Toggle Registration Plate Labels"
              onClick={() => setShowLabels((prev) => !prev)}
            >
              <Tag size={16} />
            </button>
            <button
              type="button"
              className="gnb-lt-map-ctrl-btn"
              title="Reframe Fleet (Center All)"
              onClick={handleCenterAll}
            >
              <Crosshair size={16} />
            </button>
            <button
              type="button"
              className="gnb-lt-map-ctrl-btn"
              title="Zoom In"
              onClick={() => {
                if (mapRef.current) {
                  const z = mapRef.current.getZoom() || 5;
                  mapRef.current.setZoom(z + 1);
                }
              }}
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              className="gnb-lt-map-ctrl-btn"
              title="Zoom Out"
              onClick={() => {
                if (mapRef.current) {
                  const z = mapRef.current.getZoom() || 5;
                  mapRef.current.setZoom(z - 1);
                }
              }}
            >
              <Minus size={16} />
            </button>
          </div>

          {/* Bottom-Left Map Type Switcher */}
          <div className="gnb-lt-map-type">
            <button
              type="button"
              className={`gnb-lt-map-type-btn ${mapTypeId === 'roadmap' ? 'is-active' : ''}`}
              onClick={() => setMapTypeId('roadmap')}
            >
              Map
            </button>
            <button
              type="button"
              className={`gnb-lt-map-type-btn ${mapTypeId === 'hybrid' ? 'is-active' : ''}`}
              onClick={() => setMapTypeId('hybrid')}
            >
              Satellite
            </button>
          </div>

          {/* Bottom Trail Playback Bar (Visible during playback) */}
          {playbackActive && trail.length > 0 && (
            <div className="gnb-lt-playback-bar">
              <button
                type="button"
                className="gnb-lt-playback-icon-btn"
                onClick={() => setIsPlaying((prev) => !prev)}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                type="button"
                className="gnb-lt-playback-icon-btn"
                onClick={() => {
                  setPlaybackIndex(0);
                  if (trail[0] && mapRef.current) mapRef.current.panTo(trail[0]);
                }}
                title="Restart"
              >
                <RotateCcw size={16} />
              </button>
              <input
                type="range"
                min={0}
                max={trail.length - 1}
                value={playbackIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setPlaybackIndex(idx);
                  if (trail[idx] && mapRef.current) mapRef.current.panTo(trail[idx]);
                }}
              />
              <span>
                {playbackIndex + 1} / {trail.length} pts
              </span>
              <button
                type="button"
                className="gnb-lt-playback-icon-btn"
                onClick={() => setPlaybackActive(false)}
                title="Close playback"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Google Map */}
          {!isLoaded ? (
            <div
              style={{
                display: 'flex',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f1f5f9',
                gap: 8,
                color: '#475569',
              }}
            >
              <Loader2 size={24} className="fc-spin" /> Loading Google Maps...
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={
                locatedVehicles.length === 1
                  ? { lat: locatedVehicles[0].latitude, lng: locatedVehicles[0].longitude }
                  : INDIA_CENTER
              }
              zoom={locatedVehicles.length === 1 ? 14 : 5}
              mapTypeId={mapTypeId}
              options={MAP_OPTIONS}
              onLoad={(map) => {
                mapRef.current = map;
                if (locatedVehicles.length > 0) {
                  fitMapToPositions(map, locatedVehicles);
                }
              }}
            >
              {/* Clustered Fleet Markers */}
              <MarkerClustererF
                styles={CLUSTER_STYLES}
                options={{
                  maxZoom: 11,
                  gridSize: 50,
                  minimumClusterSize: 2,
                }}
              >
                {(clusterer) =>
                  locatedVehicles.map((v) => {
                    const isSelected = v.registrationNumber === selectedReg;
                    const status = resolveVehicleStatus(v);
                    return (
                      <MarkerF
                        key={v.registrationNumber || v.vin}
                        position={{ lat: v.latitude, lng: v.longitude }}
                        clusterer={clusterer}
                        icon={createVehicleMarkerIcon({
                          status,
                          courseDegrees: v.courseDegrees || 0,
                          registrationNumber: v.registrationNumber,
                          showLabel: showLabels,
                          isSelected,
                        })}
                        onClick={() => handleSelectVehicle(v)}
                      />
                    );
                  })
                }
              </MarkerClustererF>

              {/* Traveled Route Polyline */}
              {trail.length > 1 && (
                <PolylineF
                  path={trail}
                  options={{
                    strokeColor: '#4F46E5',
                    strokeOpacity: 0.85,
                    strokeWeight: 4,
                  }}
                />
              )}

              {/* Playback Current Position Marker */}
              {playbackActive && trail[playbackIndex] && (
                <MarkerF
                  position={trail[playbackIndex]}
                  icon={{
                    path: window.google?.maps?.SymbolPath?.CIRCLE,
                    scale: 7,
                    fillColor: '#4F46E5',
                    fillOpacity: 1,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2,
                  }}
                />
              )}

              {/* Selected Vehicle InfoWindow with direct Vehicle 360 link */}
              {selectedVehicle && selectedVehicle.latitude != null && (
                <InfoWindowF
                  position={{
                    lat: selectedVehicle.latitude,
                    lng: selectedVehicle.longitude,
                  }}
                  onCloseClick={() => setSelectedReg(null)}
                >
                  <div className="gnb-lt-info-box">
                    <h4 className="gnb-lt-info-box__title">
                      {selectedVehicle.registrationNumber || selectedVehicle.vin}
                    </h4>
                    <div className="gnb-lt-info-box__row">
                      <span>Status:</span>
                      <strong
                        style={{
                          color:
                            STATUS_COLOR_MAP[resolveVehicleStatus(selectedVehicle)] || '#64748b',
                        }}
                      >
                        {resolveVehicleStatus(selectedVehicle)}
                      </strong>
                    </div>
                    <div className="gnb-lt-info-box__row">
                      <span>Speed:</span>
                      <strong>
                        {selectedVehicle.speed != null
                          ? `${Math.round(selectedVehicle.speed)} km/h`
                          : '0 km/h'}
                      </strong>
                    </div>
                    <div className="gnb-lt-info-box__row">
                      <span>Ignition:</span>
                      <strong>{selectedVehicle.ignition ? 'ON' : 'OFF'}</strong>
                    </div>
                    {selectedVehicle.primaryFuelLevel != null && (
                      <div className="gnb-lt-info-box__row">
                        <span>Fuel Level:</span>
                        <strong>{selectedVehicle.primaryFuelLevel} L</strong>
                      </div>
                    )}
                    <div
                      className="gnb-lt-info-box__row"
                      style={{ fontSize: 11, color: '#64748b' }}
                    >
                      <span>Updated:</span>
                      <span>{formatIST(selectedVehicle.eventDateTime)}</span>
                    </div>

                    <Link
                      to={`/vehicles/${encodeURIComponent(selectedVehicle.registrationNumber || '')}`}
                      className="gnb-lt-info-box__btn"
                    >
                      Open in Vehicle 360 &rarr;
                    </Link>
                  </div>
                </InfoWindowF>
              )}
            </GoogleMap>
          )}
        </div>

        {/* ── Right Sidebar: Operations Roster ── */}
        <aside className="gnb-lt-sidebar">
          {/* Header with Title & Action Tools */}
          <div className="gnb-lt-sidebar__header">
            <div className="gnb-lt-sidebar__title-row">
              <div className="gnb-lt-sidebar__title">
                <span>Fleet Roster</span>
                <span className="gnb-lt-sidebar__count-badge">
                  {counts.GPS} Live / {positions.length} Total
                </span>
              </div>
              <div className="gnb-lt-sidebar__tools">
                <button
                  type="button"
                  className="gnb-lt-sidebar__tool-btn"
                  onClick={handleExportCSV}
                  title="Export fleet to CSV"
                >
                  <Download size={13} />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  className="gnb-lt-sidebar__tool-btn"
                  onClick={handleSharePage}
                  title="Share live fleet map"
                >
                  <Share2 size={13} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="gnb-lt-sidebar__search">
            <div className="gnb-lt-search-box">
              <Search size={14} className="search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search plate, chassis, model..."
                value={vehicleQuery}
                onChange={(e) => setVehicleQuery(e.target.value)}
              />
              {vehicleQuery && (
                <button
                  type="button"
                  className="gnb-lt-search-clear"
                  onClick={() => setVehicleQuery('')}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="gnb-lt-sidebar__meta-row">
              <span>
                Showing {filteredVehicles.length} of {positions.length} vehicles
              </span>
              {activeTab !== 'All' && (
                <span style={{ color: '#4f46e5', fontWeight: 600 }}>Filtered: {activeTab}</span>
              )}
            </div>
          </div>

          {/* Scrollable Vehicle Cards */}
          <div className="gnb-lt-cards-list">
            {isLoading ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '40px 20px',
                  color: '#64748b',
                  gap: 8,
                }}
              >
                <Loader2 size={24} className="fc-spin" />
                <span>Loading fleet telemetry...</span>
              </div>
            ) : filteredVehicles.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
                No vehicles match current filter or search criteria.
              </div>
            ) : (
              filteredVehicles.map((v) => {
                const isSelected = v.registrationNumber === selectedReg;
                const status = resolveVehicleStatus(v);
                const statusColor = STATUS_COLOR_MAP[status] || '#94A3B8';
                const meta = vehiclesMeta[v.registrationNumber] || vehiclesMeta[v.vin] || {};
                const maker = meta.manufacturer || 'TATA';
                const model = meta.model || meta.modelName || '2823';
                const chassis = v.vin || meta.chassisNumber || '—';
                const hasCoordinates = v.latitude != null && v.longitude != null;

                return (
                  <div
                    key={v.registrationNumber || v.vin}
                    className={`gnb-lt-card ${isSelected ? 'is-selected' : ''}`}
                    style={{ '--card-status-color': statusColor }}
                    onClick={() => handleSelectVehicle(v)}
                  >
                    {/* Header: Plate, Model Badge & Status Pill */}
                    <div className="gnb-lt-card__head">
                      <div className="gnb-lt-card__reg-wrap">
                        <span className="gnb-lt-card__reg">
                          {v.registrationNumber || v.vin || '—'}
                        </span>
                        <span className="gnb-lt-card__model-badge">
                          {maker} {model}
                        </span>
                      </div>

                      <span className={`gnb-lt-status-pill ${status.toLowerCase()}`}>
                        <span className={`gnb-status-dot ${status.toLowerCase()}`} />
                        {status === 'Moving' && v.speed > 0
                          ? `${Math.round(v.speed)} km/h`
                          : status}
                      </span>
                    </div>

                    {/* Telemetry Grid */}
                    <div className="gnb-lt-card__telemetry">
                      <div className="gnb-lt-telemetry-item">
                        <Droplet size={13} color="#2563eb" />
                        <span>Fuel:</span>
                        <strong>
                          {v.primaryFuelLevel != null ? `${v.primaryFuelLevel} L` : '—'}
                        </strong>
                      </div>
                      <div className="gnb-lt-telemetry-item">
                        <Zap size={13} color={v.ignition ? '#10b981' : '#94a3b8'} />
                        <span>Ignition:</span>
                        <strong>{v.ignition ? 'ON' : 'OFF'}</strong>
                      </div>
                      <div className="gnb-lt-telemetry-item" title={chassis}>
                        <span>VIN:</span>
                        <strong>{chassis.slice(-8)}</strong>
                      </div>
                      <div className="gnb-lt-telemetry-item">
                        <Navigation size={13} color="#6366f1" />
                        <span>GPS:</span>
                        <strong>{hasCoordinates ? 'Active' : 'No Fix'}</strong>
                      </div>
                    </div>

                    {/* Footer: Timestamp & Relative Age */}
                    <div className="gnb-lt-card__footer">
                      <div className="gnb-lt-card__time">
                        <Clock size={11} />
                        <span>{formatCardTime(v.eventDateTime)}</span>
                      </div>
                      {v.eventDateTime && <span>{formatRelativeIST(v.eventDateTime)}</span>}
                    </div>

                    {/* GNB Action Row: Focus, Trail, Vehicle 360, Share */}
                    <div className="gnb-lt-card__actions">
                      <button
                        type="button"
                        className="gnb-lt-card-btn"
                        onClick={(e) => handleCardFocus(e, v)}
                        title="Locate on map"
                      >
                        <MapPin size={13} />
                        <span>Focus</span>
                      </button>
                      <button
                        type="button"
                        className="gnb-lt-card-btn"
                        onClick={(e) => handleCardTrail(e, v)}
                        title="Plot trip route"
                      >
                        <Route size={13} />
                        <span>Trail</span>
                      </button>
                      <Link
                        to={`/vehicles/${encodeURIComponent(v.registrationNumber || '')}`}
                        className="gnb-lt-card-btn primary-highlight"
                        onClick={(e) => e.stopPropagation()}
                        title="Open Vehicle 360 Dashboard"
                      >
                        <Gauge size={13} />
                        <span>360°</span>
                      </Link>
                      <button
                        type="button"
                        className="gnb-lt-card-btn"
                        onClick={(e) => handleShareVehicle(e, v.registrationNumber)}
                        title="Share vehicle link"
                      >
                        <Share2 size={13} />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LiveTrackingPage;
