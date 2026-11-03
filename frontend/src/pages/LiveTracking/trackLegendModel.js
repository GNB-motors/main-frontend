/**
 * trackLegendModel.js — the rules of the Track page's floating legend.
 *
 * The legend is not decoration: it is the filter. Clicking a row hides that
 * group on the map and in the rail, a double-click shows only that group,
 * and the "All" button brings every row back. These rules live here, pure
 * and tested, so the map and the list can never disagree about what is on.
 *
 * Counts are always the FULL fleet count for a status. A count that changed
 * when you filtered would make the legend lie about the size of the fleet.
 */

/** The four truck states, in the order the owner reads them. */
export const TRUCK_STATUSES = ['moving', 'idling', 'stopped', 'offline'];

/** The words next to each dot. */
export const STATUS_LABELS = {
  moving: 'Moving',
  idling: 'Idling',
  stopped: 'Stopped',
  offline: 'Offline',
};

/** The colour token for each state. */
export const STATUS_TOKENS = {
  moving: 'var(--rd-moving)',
  idling: 'var(--rd-idling)',
  stopped: 'var(--rd-stopped)',
  offline: 'var(--rd-offline)',
};

/**
 * The place layers. `ourPlaces` is the fleet's own plants, sidings and
 * customers; the rest come from the map places endpoint.
 */
export const PLACE_LAYERS = [
  { id: 'ourPlaces', label: 'Our places', icon: 'Factory', defaultOn: true, zoomGated: false },
  { id: 'pumps', label: 'Pumps', icon: 'Fuel', defaultOn: true, zoomGated: true },
  { id: 'dhabas', label: 'Dhabas', icon: 'UtensilsCrossed', defaultOn: false, zoomGated: true },
  { id: 'hospitals', label: 'Hospitals', icon: 'Cross', defaultOn: false, zoomGated: true },
  { id: 'police', label: 'Police', icon: 'Shield', defaultOn: false, zoomGated: true },
  { id: 'workshops', label: 'Workshops & tyres', icon: 'Wrench', defaultOn: false, zoomGated: true },
  { id: 'dealers', label: 'Dealers (Tata / AL)', icon: 'BadgeCheck', defaultOn: false, zoomGated: true },
  { id: 'parking', label: 'Truck parking', icon: 'ParkingSquare', defaultOn: false, zoomGated: true },
  {
    id: 'tolls',
    label: 'Tolls & weighbridges',
    icon: 'Landmark',
    defaultOn: false,
    zoomGated: true,
  },
];

/**
 * The live layers of the control room: the places still waiting for an
 * answer, the routes the fleet runs, and the trucks idling right now.
 * They cost a request each, so they all start off.
 */
export const LIVE_LAYERS = [
  {
    id: 'reviewQueue',
    label: 'Places to confirm',
    icon: 'CircleHelp',
    color: 'var(--rd-stopped)',
    defaultOn: false,
  },
  {
    id: 'routes',
    label: 'Routes',
    icon: 'Route',
    color: 'var(--rd-brand-2)',
    defaultOn: false,
  },
  {
    id: 'idling',
    label: 'Trucks idling now',
    icon: 'Timer',
    color: 'var(--rd-idling)',
    defaultOn: false,
  },
];

/** The zoom at which the extra layers start loading. */
export const LAYER_MIN_ZOOM = 11;

/**
 * The layer names the API understands.
 * "Our places" is two API layers: the plants and the customer's sidings.
 */
export const LAYER_API_NAMES = {
  ourPlaces: 'plants,sites',
  pumps: 'pumps',
  dhabas: 'dhabas',
  hospitals: 'hospitals',
  police: 'police',
  workshops: 'workshops,tyres',
  dealers: 'dealers',
  parking: 'parking',
  tolls: 'tolls,weighbridges',
};

/** The API layer names for a set of legend layers. */
export function apiLayerNames(layerIds = []) {
  return layerIds
    .map((id) => LAYER_API_NAMES[id])
    .filter(Boolean)
    .join(',');
}

/** Every status starts on. */
export function defaultStatusSelection() {
  return TRUCK_STATUSES.reduce((acc, status) => ({ ...acc, [status]: true }), {});
}

/** Every layer starts at its own default. */
export function defaultLayerSelection() {
  return [...PLACE_LAYERS, ...LIVE_LAYERS].reduce(
    (acc, layer) => ({ ...acc, [layer.id]: layer.defaultOn }),
    {},
  );
}

/** Turn one row on or off. */
export function toggleSelection(selection, key) {
  if (!(key in selection)) return selection;
  return { ...selection, [key]: !selection[key] };
}

/**
 * "Only this": the double-click behaviour.
 * Clicking the row that is already alone brings every row back, so a
 * double-click never leaves the owner with an empty map.
 */
export function selectOnly(selection, key) {
  if (!(key in selection)) return selection;
  const isAlreadyAlone =
    selection[key] === true && Object.values(selection).filter(Boolean).length === 1;
  if (isAlreadyAlone) {
    return Object.keys(selection).reduce((acc, name) => ({ ...acc, [name]: true }), {});
  }
  return Object.keys(selection).reduce((acc, name) => ({ ...acc, [name]: name === key }), {});
}

/** True when every row is on, so the "All" button can hide itself. */
export function isAllSelected(selection) {
  return Object.values(selection).every(Boolean);
}

/**
 * The items that pass the filter.
 * `keyOf` maps an item to its row key, so the same function filters trucks
 * and makes.
 */
export function filterBySelection(items, selection, keyOf) {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => {
    const key = keyOf(item);
    if (!(key in selection)) return true;
    return selection[key];
  });
}

/**
 * The status rows of the legend.
 * `counts` is the full fleet count, never the filtered one.
 */
export function legendStatusRows(counts = {}) {
  return TRUCK_STATUSES.map((status) => ({
    key: status,
    label: STATUS_LABELS[status],
    color: STATUS_TOKENS[status],
    count: Number(counts[status] ?? 0),
  }));
}

/**
 * The make rows of the legend. Only the makes the fleet actually has —
 * we never show an empty row for a make the owner does not own.
 * Trucks with no make at all get one "Unclassified" row.
 */
export function legendMakeRows(manufacturers = [], vehicles = []) {
  const rows = manufacturers
    .filter(Boolean)
    .map((make) => ({
      key: make,
      label: make,
      count: vehicles.filter((vehicle) => vehicle.manufacturer === make).length,
    }));

  const unclassified = vehicles.filter((vehicle) => !vehicle.manufacturer).length;
  if (unclassified > 0) {
    rows.push({ key: 'Unclassified', label: 'Unclassified', count: unclassified });
  }
  return rows;
}

/**
 * The layers that may be requested at this zoom.
 * "Our places" is always allowed; the rest need the map to be zoomed in.
 */
export function layersForZoom(zoom, selection = defaultLayerSelection()) {
  const zoomedIn = Number(zoom) >= LAYER_MIN_ZOOM;
  return PLACE_LAYERS.filter((layer) => {
    if (!selection[layer.id]) return false;
    return zoomedIn || !layer.zoomGated;
  }).map((layer) => layer.id);
}

/** True when a zoom-gated layer is switched on but the map is too far out. */
export function isZoomGated(layerId, zoom) {
  const layer = PLACE_LAYERS.find((item) => item.id === layerId);
  if (!layer) return false;
  return layer.zoomGated && Number(zoom) < LAYER_MIN_ZOOM;
}
