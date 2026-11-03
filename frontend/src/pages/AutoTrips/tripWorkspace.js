const LIST_KEYS = [
  'range',
  'from',
  'to',
  'page',
  'status',
  'sapVerdict',
  'dropSiteId',
  'dropName',
  'vehicleId',
];
const listQuery = (params) =>
  new URLSearchParams([...params].filter(([key]) => LIST_KEYS.includes(key)));
const href = (path, params) => `${path}${params.size ? `?${params}` : ''}`;

export const tripListHref = (params) => href('/auto-trips', listQuery(params));
export const tripDetailHref = (id, params) =>
  href(`/auto-trips/${encodeURIComponent(id)}`, listQuery(params));
