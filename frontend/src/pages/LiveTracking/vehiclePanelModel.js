/**
 * vehiclePanelModel — the rules of the vehicle panel, and the fallback.
 *
 * The new `/now` endpoint does not exist on prod yet, so the panel must be
 * able to render from the release's position row. This module maps that old
 * row onto the SAME view model the new endpoint returns, so every section
 * of the panel has exactly one shape to read and nothing has to care where
 * the data came from.
 *
 * Two rules hold everywhere:
 * 1. A missing value is null, never 0.
 * 2. A model that is only digits ("5555") is not a model. We hide it.
 */

/** The make names the API uses. */
const MAKE_CODES = {
  tata: 'TATA',
  'ashok leyland': 'ASHOK_LEYLAND',
};

/** The make names the owner reads. */
const MAKE_LABELS = {
  TATA: 'Tata',
  ASHOK_LEYLAND: 'Ashok Leyland',
};

/** The make as the owner reads it, from either the new code or the old name. */
export function makeLabel(make) {
  if (!make) return null;
  const key = String(make).trim().toUpperCase();
  if (MAKE_LABELS[key]) return MAKE_LABELS[key];
  const code = MAKE_CODES[String(make).trim().toLowerCase()];
  return code ? MAKE_LABELS[code] : null;
}

/** The make as the API codes it, from either the new code or the old name. */
export function makeCode(make) {
  if (!make) return null;
  const key = String(make).trim().toUpperCase();
  if (key === 'TATA' || key === 'ASHOK_LEYLAND') return key;
  return MAKE_CODES[String(make).trim().toLowerCase()] ?? null;
}

/**
 * The model as the owner reads it.
 * A model that is only digits is a fleet number, not a model, so it is
 * hidden. null means "Model not known".
 */
export function modelLabel(model) {
  if (!model) return null;
  const text = String(model).trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) return null;
  return text;
}

/**
 * The word for the leg of the journey.
 * The trip's own leg is the authority; the activity only fills the gap
 * when there is no trip. Never "In transit" — a trip state comes from the
 * trip data, not from the truck's speed.
 */
export function legLabel(activityKind, tripLeg) {
  if (tripLeg === 'REPOSITION') return 'Plant to plant';
  if (tripLeg === 'LADEN') return 'Loaded run';
  if (tripLeg === 'RETURN') return 'Empty run';
  if (activityKind === 'DRIVING_LOADED') return 'Loaded run';
  if (activityKind === 'DRIVING_EMPTY') return 'Empty run';
  return null;
}

/** The status words for the header pill. */
export function statusLabel(status) {
  if (!status) return 'Unknown';
  const text = String(status);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The tone of a reading, from its freshness.
 * A stale reading is greyed, a recent one is quiet, a live one is normal.
 */
export function freshnessTone(freshness) {
  if (freshness === 'stale' || freshness === 'never') return 'muted';
  if (freshness === 'recent') return 'quiet';
  return 'normal';
}

/** A reading built from a plain value and the truck's own fix time. */
function readingFrom(value, { at, ageMin, freshness, source = 'FLEETEDGE' }) {
  if (value === null || value === undefined) return null;
  return { value, at: at ?? null, ageMin: ageMin ?? null, freshness, source };
}

/**
 * The panel's view model, built from a release position row.
 * This is the fallback used while `/now` is not deployed: everything the
 * old row knows is filled in, everything it does not know is null, and the
 * sections that need it say so.
 */
export function fallbackNow(vehicle, driver = null) {
  if (!vehicle) return null;

  const freshness = vehicle.freshness || 'never';
  const at = vehicle.lastFixAt ?? null;
  const ageMin = vehicle.ago ?? null;
  const ignitionValue = vehicle.ignition === 'ON' ? true : vehicle.ignition === 'OFF' ? false : null;

  return {
    registrationNumber: vehicle.plate ?? null,
    identity: {
      make: makeCode(vehicle.manufacturer),
      model: modelLabel(vehicle.model),
      modelLine: null,
      vin: vehicle.vin ?? null,
      year: vehicle.manufactureYear ?? null,
      service: null,
    },
    view: {
      status: vehicle.status ?? null,
      isOffline: vehicle.live === false,
      freshness,
      lastFixAt: at,
      ageMin,
      hasPosition: Boolean(vehicle.hasFix),
      hasGpsFix: Boolean(vehicle.hasGpsFix),
      speedKmh: vehicle.speed ?? null,
      ignition: vehicle.ignition ?? null,
      offlineAfterMin: null,
      movingSpeedKmh: null,
      rule: null,
    },
    readings: {
      fuel: {
        litres: readingFrom(vehicle.fuel ?? null, { at, ageMin, freshness }),
        pct: null,
        tankL: null,
      },
      def: {
        pct: readingFrom(vehicle.defLevel ?? null, { at, ageMin, freshness }),
        litres: null,
        tankL: null,
        tankSource: null,
      },
      odometerKm: readingFrom(vehicle.odo ?? null, { at, ageMin, freshness }),
      ignition: ignitionValue === null
        ? null
        : { value: ignitionValue, at, ageMin, freshness, source: 'FLEETEDGE' },
      gps: { at, ageMin, freshness, satellites: null },
    },
    place: null,
    activity: null,
    trip: null,
    driver: driver
      ? {
          driverId: driver.driverId ?? driver._id ?? null,
          name: driver.name ?? '—',
          phone: driver.phone ?? null,
          source: driver.source ?? 'MANUAL',
          since: driver.since ?? null,
        }
      : null,
    chips: [],
    nearbyHelp: [],
    issues: [],
  };
}

/**
 * The fuel tile's two lines.
 * Litres when we have them, otherwise the percentage. When we have neither,
 * the honest words — never "0 L".
 */
export function fuelTileValues(readings) {
  const litres = readings?.fuel?.litres ?? null;
  const pct = readings?.fuel?.pct ?? null;
  const tankL = readings?.fuel?.tankL ?? null;

  if (litres?.value != null) {
    const secondary = tankL != null && pct?.value != null ? `${tankL} L tank` : null;
    return { main: { kind: 'litres', value: litres.value }, secondary, reading: litres };
  }
  if (pct?.value != null) {
    return { main: { kind: 'pct', value: pct.value }, secondary: null, reading: pct };
  }
  return { main: null, secondary: null, reading: null };
}

/**
 * The DEF tile's two lines.
 * The litres are a LEARNED number until the first top-up, and the panel
 * must say so rather than pretend it came off the truck.
 */
export function defTileValues(readings) {
  const pct = readings?.def?.pct ?? null;
  const litres = readings?.def?.litres ?? null;
  const tankL = readings?.def?.tankL ?? null;
  const tankSource = readings?.def?.tankSource ?? null;

  if (pct?.value == null) {
    return { main: null, secondary: null, reading: null, learned: false };
  }

  let secondary = null;
  let learned = false;
  if (litres?.value != null && tankL != null) {
    secondary = `${litres.value} L of ${tankL} L`;
    learned = tankSource === 'LEARNED';
  } else if (litres?.value != null) {
    secondary = 'Litres after the first DEF top-up';
    learned = true;
  }
  return { main: { kind: 'pct', value: pct.value }, secondary, reading: pct, learned };
}

/**
 * The traffic word for an ETA.
 * LIGHT → "light", USUAL → "normal", HEAVY → "heavy".
 */
export function trafficWord(congestion) {
  if (congestion === 'LIGHT') return 'light';
  if (congestion === 'HEAVY') return 'heavy';
  if (congestion === 'USUAL') return 'normal';
  return null;
}
