import React, { useEffect, useRef, useState } from 'react';
import { X, MapPin, Save } from 'lucide-react';
import { GoogleMap, MarkerF, CircleF } from '@react-google-maps/api';
import { validateWarehouse } from './warehouseLogic.js';
import { DEFAULT_RADIUS_M } from './warehouseConstants.js';

const MAP_STYLE = { width: '100%', height: '100%' };
const MAP_OPTIONS = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  draggableCursor: 'crosshair',
};

const blank = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  lat: null,
  lng: null,
  geofenceRadiusM: DEFAULT_RADIUS_M,
};

/**
 * Create / edit drawer. The map is the primary input — a yard without an accurate
 * pin is worse than no yard at all, because trip anchoring will silently attach
 * departures to the wrong place.
 */
export default function WarehouseDrawer({ open, mode, initial, isMapLoaded, onClose, onSave }) {
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(mode === 'edit' && initial ? { ...blank, ...initial } : blank);
  }, [open, mode, initial]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const placePin = (e) => {
    if (!e?.latLng) return;
    set('lat', Number(e.latLng.lat().toFixed(6)));
    set('lng', Number(e.latLng.lng().toFixed(6)));
  };

  const submit = async () => {
    const errs = validateWarehouse(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        code: (form.code || '').trim().toUpperCase(),
        address: form.address || '',
        city: form.city || '',
        state: form.state || '',
        pincode: form.pincode || '',
        lat: Number(form.lat),
        lng: Number(form.lng),
        geofenceRadiusM: Number(form.geofenceRadiusM),
      });
    } finally {
      setSaving(false);
    }
  };

  const centre =
    form.lat != null && form.lng != null
      ? { lat: form.lat, lng: form.lng }
      : { lat: 22.5, lng: 82 };

  return (
    <div className="vwh-drawer-backdrop" role="dialog" aria-modal="true">
      <aside className="vwh-drawer">
        <header className="vwh-drawer-head">
          <h2>{mode === 'edit' ? 'Edit warehouse' : 'New warehouse'}</h2>
          <button type="button" className="vwh-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="vwh-drawer-body">
          <div className="vwh-map-pick">
            {isMapLoaded ? (
              <GoogleMap
                mapContainerStyle={MAP_STYLE}
                center={centre}
                zoom={form.lat != null ? 15 : 5}
                options={MAP_OPTIONS}
                onClick={placePin}
                onLoad={(m) => {
                  mapRef.current = m;
                }}
              >
                {form.lat != null && form.lng != null && (
                  <>
                    <MarkerF
                      position={{ lat: form.lat, lng: form.lng }}
                      draggable
                      onDragEnd={placePin}
                    />
                    <CircleF
                      center={{ lat: form.lat, lng: form.lng }}
                      radius={Number(form.geofenceRadiusM) || DEFAULT_RADIUS_M}
                      options={{
                        strokeColor: '#2563eb',
                        strokeWeight: 1.5,
                        fillColor: '#2563eb',
                        fillOpacity: 0.12,
                      }}
                    />
                  </>
                )}
              </GoogleMap>
            ) : (
              <div className="vwh-map-loading">Loading map…</div>
            )}
            <p className="vwh-map-hint">
              <MapPin size={13} /> Click the map to drop the yard gate, drag to fine-tune.
            </p>
          </div>

          <div className="vwh-field-grid">
            <label className="vwh-field vwh-field--wide">
              <span>Name *</span>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                aria-label="Warehouse name"
                placeholder="Bhiwandi Yard"
              />
              {errors.name && <em className="vwh-err">{errors.name}</em>}
            </label>

            <label className="vwh-field">
              <span>Code</span>
              <input
                value={form.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                aria-label="Warehouse code"
                placeholder="BHW"
                maxLength={20}
              />
            </label>

            <label className="vwh-field">
              <span>Geofence radius (m) *</span>
              <input
                type="number"
                min={100}
                max={50000}
                step={50}
                value={form.geofenceRadiusM}
                onChange={(e) => set('geofenceRadiusM', e.target.value)}
                aria-label="Geofence radius in metres"
              />
              {errors.geofenceRadiusM && <em className="vwh-err">{errors.geofenceRadiusM}</em>}
            </label>

            <label className="vwh-field vwh-field--wide">
              <span>Address</span>
              <input
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                aria-label="Address"
              />
            </label>

            <label className="vwh-field">
              <span>City</span>
              <input
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                aria-label="City"
              />
            </label>

            <label className="vwh-field">
              <span>State</span>
              <input
                value={form.state}
                onChange={(e) => set('state', e.target.value)}
                aria-label="State"
              />
            </label>

            <label className="vwh-field">
              <span>Pincode</span>
              <input
                value={form.pincode}
                onChange={(e) => set('pincode', e.target.value)}
                aria-label="Pincode"
                maxLength={6}
              />
            </label>

            <div className="vwh-field">
              <span>Coordinates</span>
              <div className="vwh-coords">
                {form.lat != null ? `${form.lat}, ${form.lng}` : 'No pin dropped yet'}
              </div>
              {(errors.lat || errors.lng) && (
                <em className="vwh-err">{errors.lat || errors.lng}</em>
              )}
            </div>
          </div>
        </div>

        <footer className="vwh-drawer-foot">
          <button type="button" className="vwh-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className="vwh-btn vwh-btn--primary"
            onClick={submit}
            disabled={saving}
          >
            <Save size={15} />
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Create warehouse'}
          </button>
        </footer>
      </aside>
    </div>
  );
}
