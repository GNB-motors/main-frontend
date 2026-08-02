import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  GoogleMap, useLoadScript, MarkerF, CircleF, PolygonF, PolylineF,
} from '@react-google-maps/api';
import { GeofenceService } from '../../services/GeofenceService.jsx';
import './AddZoneDrawer.css';

// Only 'places' needed — NO 'drawing' library required at all.
// Polygon is drawn using plain map click events (no DrawingManager).
const GMAPS_LIBS = ['places'];

// ─── Location Search ────────────────────────────────────────────────────────────
const LocationSearch = ({ isLoaded, value, onChange, onSelect, hasError }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const svcRef = useRef(null);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (isLoaded && window.google?.maps?.places) {
      svcRef.current = new window.google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!isLoaded || !svcRef.current || !value || value.length < 3) {
      setSuggestions([]); return;
    }
    debounceRef.current = setTimeout(() => {
      svcRef.current.getPlacePredictions(
        { input: value, componentRestrictions: { country: 'in' } },
        (preds, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && preds) {
            setSuggestions(preds);
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [value, isLoaded]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setSuggestions([]);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="azd-location-wrap" ref={wrapperRef}>
      <div className={`azd-location-input-row ${hasError ? 'azd-error-border' : ''} ${focused ? 'azd-focused' : ''}`}>
        <MapPin size={16} className="azd-pin-icon" />
        <input
          className="azd-location-input"
          type="text"
          placeholder="Search location…"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
      </div>
      {hasError && <p className="azd-error-msg">Location is required</p>}
      {suggestions.length > 0 && (
        <ul className="azd-suggestions">
          {suggestions.map((s, i) => (
            <li
              key={s.place_id || i}
              className="azd-suggestion-item"
              onMouseDown={() => { setSuggestions([]); onSelect(s); }}
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ─── Geofence Type Dropdown ─────────────────────────────────────────────────────
const GeoTypeSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const OPTIONS = [
    { value: 'circular', label: 'Circular', icon: '⊙', badge: null },
    { value: 'polygon', label: 'Polygon (Draw on Map)', icon: '⬡', badge: 'NEW' },
  ];
  const selected = OPTIONS.find(o => o.value === value);

  return (
    <div className="azd-type-wrap" ref={ref}>
      <button
        type="button"
        className={`azd-type-trigger ${open ? 'azd-type-open' : ''}`}
        onClick={() => setOpen(p => !p)}
      >
        <span className="azd-type-label">{selected ? selected.label : 'Select type'}</span>
        <span className="azd-chevron">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <div className="azd-type-dropdown">
          {OPTIONS.map(o => (
            <div
              key={o.value}
              className={`azd-type-option ${value === o.value ? 'azd-type-selected' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              <span className="azd-type-icon">{o.icon}</span>
              <span className="azd-type-name">{o.label}</span>
              {o.badge && <span className="azd-new-badge">{o.badge}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Map Preview ────────────────────────────────────────────────────────────────
// Polygon drawing: click to add points, press "Finish Drawing" button when done.
// NO DrawingManager / 'drawing' library needed.
const ZoneMapPreview = ({
  isLoaded, locationLatLng, geofenceType,
  radiusMetres, polygonPath, onPolygonComplete, onClearShape,
  draftPoints, onAddPoint, onClearDraft,
}) => {
  const [mapInstance, setMapInstance] = useState(null);
  const isDone = polygonPath.length >= 3;

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
    draggableCursor: (geofenceType === 'polygon' && !isDone) ? 'crosshair' : undefined,
  };

  // Pan to location when it changes
  useEffect(() => {
    if (mapInstance && locationLatLng) {
      mapInstance.panTo(locationLatLng);
      mapInstance.setZoom(14);
    }
  }, [locationLatLng, mapInstance]);

  // Handle map click — only collect points when in polygon mode and not done
  const handleMapClick = useCallback((e) => {
    if (geofenceType !== 'polygon' || isDone) return;
    onAddPoint({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }, [geofenceType, isDone, onAddPoint]);

  const handleClear = () => {
    onClearDraft();
    onClearShape();
  };

  const center = locationLatLng || { lat: 22.5, lng: 82.0 };
  const zoom = locationLatLng ? 14 : 5;

  if (!isLoaded) {
    return (
      <div className="azd-map-placeholder">
        <RefreshCw size={18} className="azd-spin" />
        <span>Loading map…</span>
      </div>
    );
  }

  return (
    <div className="azd-map-container">
      <GoogleMap
        mapContainerClassName="azd-map"
        center={center}
        zoom={zoom}
        options={mapOptions}
        onLoad={map => setMapInstance(map)}
        onClick={handleMapClick}
      >
        {/* ── Circular preview ── */}
        {geofenceType === 'circular' && locationLatLng && (
          <>
            <MarkerF position={locationLatLng} />
            <CircleF
              center={locationLatLng}
              radius={radiusMetres}
              options={{
                strokeColor: '#6366f1', strokeOpacity: 0.9, strokeWeight: 2,
                fillColor: '#6366f1', fillOpacity: 0.15,
              }}
            />
          </>
        )}

        {/* ── In-progress draft polyline ── */}
        {geofenceType === 'polygon' && !isDone && draftPoints.length >= 2 && (
          <PolylineF
            path={draftPoints}
            options={{ strokeColor: '#6366f1', strokeOpacity: 0.9, strokeWeight: 2 }}
          />
        )}

        {/* ── Draft point markers ── */}
        {geofenceType === 'polygon' && !isDone && draftPoints.map((pt, i) => (
          <MarkerF
            key={i}
            position={pt}
            icon={{
              path: 'M 0,0 m -5,0 a 5,5 0 1,0 10,0 a 5,5 0 1,0 -10,0',
              fillColor: '#6366f1', fillOpacity: 1,
              strokeColor: '#ffffff', strokeWeight: 2, scale: 1,
            }}
          />
        ))}

        {/* ── Completed polygon ── */}
        {geofenceType === 'polygon' && isDone && (
          <PolygonF
            paths={polygonPath}
            options={{
              strokeColor: '#6366f1', strokeOpacity: 0.9, strokeWeight: 2,
              fillColor: '#6366f1', fillOpacity: 0.2,
            }}
          />
        )}
      </GoogleMap>

      {/* Drawing hint */}
      {geofenceType === 'polygon' && !isDone && (
        <div className="azd-drawing-hint">
          {draftPoints.length === 0
            ? '✏️ Click on the map to place points'
            : draftPoints.length < 3
              ? `📍 ${draftPoints.length} point${draftPoints.length > 1 ? 's' : ''} — need ${3 - draftPoints.length} more`
              : `📍 ${draftPoints.length} points placed — click "Finish Drawing" to save shape`}
        </div>
      )}

      {/* Success + clear */}
      {geofenceType === 'polygon' && isDone && (
        <>
          <div className="azd-drawing-hint azd-hint-success">
            ✅ {polygonPath.length} points — polygon ready
          </div>
          <div className="azd-poly-controls">
            <button type="button" className="azd-poly-btn azd-poly-clear" onClick={handleClear}>
              Clear &amp; Redraw
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ─── Main Drawer ────────────────────────────────────────────────────────────────
const AddZoneDrawer = ({ onClose, onSaved, prefillLatLng, editZone, mode = 'add' }) => {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries: GMAPS_LIBS,
  });

  const isEdit = mode === 'edit' && editZone;

  // draftPoints = in-progress clicks before user hits "Finish Drawing"
  const [draftPoints, setDraftPoints] = useState([]);
  const [locationText, setLocationText] = useState('');
  const [locationLatLng, setLocationLatLng] = useState(
    isEdit ? { lat: editZone.lat, lng: editZone.lng } : (prefillLatLng || null)
  );
  const [name, setName] = useState(isEdit ? editZone.name : '');
  const [geofenceType, setGeofenceType] = useState(isEdit ? editZone.geofenceType : '');
  const [radiusMetres, setRadiusMetres] = useState(isEdit ? editZone.radiusMetres : 500);
  const [alertOnEntry, setAlertOnEntry] = useState(isEdit ? editZone.alertConfig?.alertOnEntry : true);
  const [alertOnExit, setAlertOnExit] = useState(isEdit ? editZone.alertConfig?.alertOnExit : false);
  const [polygonPath, setPolygonPath] = useState(isEdit && editZone.polygonPath ? editZone.polygonPath : []);

  const [locationError, setLocationError] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Reverse-geocode prefilled lat/lng
  useEffect(() => {
    const targetLatLng = isEdit ? { lat: editZone.lat, lng: editZone.lng } : prefillLatLng;
    if (!targetLatLng || !isLoaded || !window.google) return;
    new window.google.maps.Geocoder().geocode(
      { location: targetLatLng },
      (results, status) => {
        if (status === 'OK' && results[0]) setLocationText(results[0].formatted_address);
      }
    );
  }, [prefillLatLng, isEdit, editZone, isLoaded]);

  const handleSuggestionSelect = useCallback((suggestion) => {
    setLocationText(suggestion.description);
    setLocationError(false);
    if (!window.google) return;
    new window.google.maps.Geocoder().geocode(
      { placeId: suggestion.place_id },
      (results, status) => {
        if (status === 'OK' && results[0]) {
          setLocationLatLng({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          });
        }
      }
    );
  }, []);

  const handleTypeChange = (val) => { setGeofenceType(val); setPolygonPath([]); setDraftPoints([]); };
  const handleClearShape = () => setPolygonPath([]);
  const handleClearDraft = () => setDraftPoints([]);
  const handleAddPoint = (pt) => setDraftPoints(prev => [...prev, pt]);
  const handleFinishDrawing = () => {
    if (draftPoints.length >= 3) {
      setPolygonPath(draftPoints);
      setDraftPoints([]);
    }
  };

  const getCentroid = () => {
    if (!polygonPath.length) return null;
    const lat = polygonPath.reduce((s, p) => s + p.lat, 0) / polygonPath.length;
    const lng = polygonPath.reduce((s, p) => s + p.lng, 0) / polygonPath.length;
    return { lat: +lat.toFixed(7), lng: +lng.toFixed(7) };
  };

  const canSave = name.trim() && geofenceType &&
    (geofenceType === 'polygon' ? polygonPath.length >= 3 : !!locationLatLng);

  const handleSave = async () => {
    let valid = true;
    if (!locationLatLng && geofenceType !== 'polygon') { setLocationError(true); valid = false; }
    if (!name.trim()) { setNameError(true); valid = false; }
    if (!geofenceType) { setSaveError('Please select a geofence type'); return; }
    if (geofenceType === 'polygon' && polygonPath.length < 3) {
      setSaveError('Please draw a polygon with at least 3 points'); return;
    }
    if (!valid) return;

    const centroid = geofenceType === 'polygon' ? getCentroid() : locationLatLng;
    if (!centroid) { setSaveError('Could not determine zone location'); return; }

    setSaving(true); setSaveError(null);
    try {
      const payload = {
        name: name.trim(),
        lat: centroid.lat, lng: centroid.lng,
        radiusMetres: geofenceType === 'circular' ? radiusMetres : 0,
        geofenceType,
        polygonPath: geofenceType === 'polygon' ? polygonPath : [],
        alertOnEntry, alertOnExit,
        cooldownMinutes: 0,
      };

      if (isEdit) {
        await GeofenceService.updateZone(editZone._id, payload);
      } else {
        await GeofenceService.createZone(payload);
      }
      onSaved();
    } catch (err) {
      setSaveError(err.message || 'Failed to save zone');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="azd-overlay" onClick={onClose}>
      <div className="azd-modal" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="azd-header">
          <h3 className="azd-title">{mode === 'edit' ? 'Edit Place' : 'Add Custom Zone'}</h3>
          <button className="azd-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        {/* ── Content ── */}
        <div className="azd-content">

          {/* Left form */}
          <div className="azd-form-col">
            {saveError && (
              <div className="azd-save-error"><AlertTriangle size={13} /> {saveError}</div>
            )}

            <label className="azd-label">Location</label>
            <LocationSearch
              isLoaded={isLoaded}
              value={locationText}
              onChange={(v) => { setLocationText(v); if (!v) setLocationLatLng(null); setLocationError(false); }}
              onSelect={handleSuggestionSelect}
              hasError={locationError}
            />

            <label className="azd-label">Name this place</label>
            <input
              className={`azd-input ${nameError ? 'azd-input-err' : ''}`}
              placeholder="e.g. Warehouse A"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(false); }}
            />
            {nameError && <p className="azd-error-msg">Name is required</p>}

            <label className="azd-label">Geofence Type</label>
            <GeoTypeSelect value={geofenceType} onChange={handleTypeChange} />

            {geofenceType === 'polygon' && polygonPath.length === 0 && (
              <div className="azd-poly-instructions">
                <p>🖱️ <strong>Click on the map</strong> to place points</p>
                <p>Points placed: <strong>{draftPoints.length}</strong></p>
                {draftPoints.length >= 3 && (
                  <button
                    type="button"
                    className="azd-finish-btn"
                    onClick={handleFinishDrawing}
                  >
                    ✅ Finish Drawing
                  </button>
                )}
                {draftPoints.length > 0 && draftPoints.length < 3 && (
                  <p className="azd-poly-note">Add {3 - draftPoints.length} more point{3 - draftPoints.length > 1 ? 's' : ''} to finish</p>
                )}
              </div>
            )}
            {geofenceType === 'polygon' && polygonPath.length >= 3 && (
              <div className="azd-poly-instructions azd-poly-done">
                <p>✅ Polygon ready — <strong>{polygonPath.length} points</strong></p>
              </div>
            )}

            {geofenceType === 'circular' && (
              <>
                <label className="azd-label">
                  Radius <span className="azd-radius-val">{radiusMetres} meters</span>
                </label>
                <input
                  className="azd-slider"
                  type="range" min="50" max="10000" step="50"
                  value={radiusMetres}
                  onChange={e => setRadiusMetres(parseInt(e.target.value, 10))}
                />
              </>
            )}

            {geofenceType && (
              <div className="azd-alerts-section">
                <label className="azd-label">Alert Settings</label>
                <label className="azd-check">
                  <input type="checkbox" checked={alertOnEntry} onChange={e => setAlertOnEntry(e.target.checked)} />
                  Alert on Entry
                </label>
                <label className="azd-check">
                  <input type="checkbox" checked={alertOnExit} onChange={e => setAlertOnExit(e.target.checked)} />
                  Alert on Exit
                </label>
              </div>
            )}
          </div>

          {/* Right map */}
          <div className="azd-map-col">
            <ZoneMapPreview
              isLoaded={isLoaded}
              locationLatLng={locationLatLng}
              geofenceType={geofenceType}
              radiusMetres={radiusMetres}
              polygonPath={polygonPath}
              draftPoints={draftPoints}
              onPolygonComplete={setPolygonPath}
              onClearShape={handleClearShape}
              onAddPoint={handleAddPoint}
              onClearDraft={handleClearDraft}
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="azd-footer">
          <button
            className={`azd-save-btn ${canSave ? 'azd-save-active' : ''}`}
            onClick={handleSave}
            disabled={saving || !canSave}
          >
            {saving && <RefreshCw size={13} className="azd-spin" />}
            {mode === 'edit' ? 'Update' : 'Save Zone'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddZoneDrawer;