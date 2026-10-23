import { centroidOf } from './placeGeometry.js';

export const KIND_META = {
  WAREHOUSE: {
    label: 'Warehouse / yard',
    hint: 'Trips start and end here, and vehicles can be based here.',
    minRadius: 100,
    maxRadius: 50000,
    defaultRadius: 300,
    polygon: false,
  },
  ZONE: {
    label: 'Geofence zone',
    hint: 'Get an alert when a truck enters or leaves. Idling inside counts as legit.',
    minRadius: 50,
    maxRadius: 50000,
    defaultRadius: 500,
    polygon: true,
  },
  HOTSPOT: {
    label: 'Fuel risk hotspot',
    hint: 'Refuels and stops here are flagged for a fuel review.',
    minRadius: 50,
    maxRadius: 50000,
    defaultRadius: 500,
    polygon: false,
  },
};

export function newDraft(kind, seed = {}) {
  const meta = KIND_META[kind];
  return {
    mode: 'create',
    kind,
    sourceId: null,
    shape: 'circle',
    name: seed.name || '',
    code: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    center: seed.center || null,
    radiusM: meta.defaultRadius,
    polygon: [],
    polygonDone: false,
    alertOnEntry: true,
    alertOnExit: false,
  };
}

/** An editable draft for a place that already exists, or null if it can't be edited here. */
export function draftFromPlace(place) {
  if (!place || place.readOnly) return null;
  const center = { lat: place.lat, lng: place.lng };
  if (place.source === 'warehouse') {
    const w = place.raw;
    return {
      ...newDraft('WAREHOUSE'),
      mode: 'edit',
      sourceId: place.sourceId,
      name: w.name || '',
      code: w.code || '',
      address: w.address || '',
      city: w.city || '',
      state: w.state || '',
      pincode: w.pincode || '',
      center,
      radiusM: Number(w.geofenceRadiusM) || KIND_META.WAREHOUSE.defaultRadius,
    };
  }
  if (place.source === 'zone') {
    return {
      ...newDraft('ZONE'),
      mode: 'edit',
      sourceId: place.sourceId,
      name: place.name,
      center,
      shape: place.polygon ? 'polygon' : 'circle',
      radiusM: place.radiusM || KIND_META.ZONE.defaultRadius,
      polygon: place.polygon || [],
      polygonDone: Boolean(place.polygon),
      alertOnEntry: place.alerts.entry,
      alertOnExit: place.alerts.exit,
    };
  }
  if (place.provenance && place.provenance !== 'network') {
    return {
      ...newDraft('HOTSPOT'),
      mode: 'edit',
      sourceId: place.sourceId,
      name: place.name,
      center,
      radiusM: place.radiusM,
    };
  }
  return null;
}

const inIndia = (p) => p && p.lat >= 6 && p.lat <= 38 && p.lng >= 68 && p.lng <= 98;

export function validateDraft(d) {
  const meta = KIND_META[d.kind];
  const errors = {};
  if (!d.name.trim()) errors.name = 'Give the place a name';
  else if (d.name.trim().length > (d.kind === 'HOTSPOT' ? 120 : 200))
    errors.name = 'Name is too long';
  if (d.kind === 'WAREHOUSE' && d.code.trim().length > 20)
    errors.code = 'Code is at most 20 characters';

  if (d.shape === 'polygon') {
    if (d.polygon.length < 3) errors.shape = 'Click at least 3 points on the map';
    else if (!d.polygonDone) errors.shape = 'Finish the outline first';
  } else {
    const r = Number(d.radiusM);
    if (!d.center) errors.shape = 'Click the map or search to drop a pin';
    else if (!inIndia(d.center)) errors.shape = 'The pin must be inside India';
    if (!Number.isFinite(r) || r < meta.minRadius || r > meta.maxRadius) {
      errors.radiusM = `Radius must be ${meta.minRadius.toLocaleString('en-IN')}–${meta.maxRadius.toLocaleString('en-IN')} m`;
    }
  }
  return errors;
}

/** The request body each store's own API expects. */
export function payloadFor(d) {
  const radius = Math.round(Number(d.radiusM));
  if (d.kind === 'WAREHOUSE') {
    return {
      name: d.name.trim(),
      code: d.code.trim().toUpperCase(),
      address: d.address.trim(),
      city: d.city.trim(),
      state: d.state.trim(),
      pincode: d.pincode.trim(),
      lat: d.center.lat,
      lng: d.center.lng,
      geofenceRadiusM: radius,
    };
  }
  if (d.kind === 'ZONE') {
    const polygon = d.shape === 'polygon';
    const at = polygon ? centroidOf(d.polygon) : d.center;
    return {
      name: d.name.trim(),
      lat: at.lat,
      lng: at.lng,
      radiusMetres: polygon ? 0 : radius,
      geofenceType: polygon ? 'polygon' : 'circular',
      polygonPath: polygon ? d.polygon : [],
      alertOnEntry: d.alertOnEntry,
      alertOnExit: d.alertOnExit,
      cooldownMinutes: 0,
    };
  }
  return {
    name: d.name.trim(),
    centerLat: d.center.lat,
    centerLng: d.center.lng,
    radiusM: radius,
  };
}

/** Address fields from a Google geocoder result, for prefilling a warehouse. */
export function addressParts(result) {
  const parts = result?.address_components || [];
  const pick = (type) => parts.find((p) => (p.types || []).includes(type))?.long_name || '';
  return {
    address: result?.formatted_address || '',
    city:
      pick('locality') ||
      pick('administrative_area_level_3') ||
      pick('administrative_area_level_2'),
    state: pick('administrative_area_level_1'),
    pincode: pick('postal_code'),
  };
}
