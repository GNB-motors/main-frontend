export const SITE_TYPE_LABEL = {
  FUEL_PUMP: 'Fuel pump',
  LOADING: 'Loading point',
  UNLOADING: 'Unloading point',
  PLANT: 'Plant',
  WAREHOUSE: 'Warehouse',
  YARD: 'Own yard',
  PARKING: 'Parking',
  VEHICLE_HABIT: 'A driver’s regular spot',
  WORKSHOP: 'Workshop',
  SERVICE: 'Service point',
  TOLL: 'Toll plaza',
  CHECKPOST: 'Checkpost',
  DHABA: 'Dhaba / rest stop',
  UNEXPLAINED: 'Unexplained',
  UNKNOWN: 'Unknown',
};

/** Types a manager can answer with, most common first. */
export const ANSWER_TYPES = [
  'FUEL_PUMP',
  'LOADING',
  'UNLOADING',
  'PLANT',
  'WAREHOUSE',
  'YARD',
  'PARKING',
  'WORKSHOP',
  'DHABA',
  'TOLL',
  'CHECKPOST',
];

export const PURPOSE_LABEL = {
  FUEL: 'Refuelling',
  LOAD: 'Loading',
  UNLOAD: 'Unloading',
  REST: 'Rest / meal',
  OVERNIGHT: 'Overnight',
  SERVICE: 'Service / repair',
  TOLL: 'Toll / checkpost',
  QUEUE: 'Waiting in queue',
  UNEXPLAINED: 'Unexplained',
};

/** Colours for the "what trucks do here" bar — one per purpose. */
export const PURPOSE_COLOR = {
  FUEL: '#d97706',
  LOAD: '#2563eb',
  UNLOAD: '#7c3aed',
  REST: '#15803d',
  OVERNIGHT: '#334155',
  SERVICE: '#be123c',
  TOLL: '#0891b2',
  QUEUE: '#94a3b8',
  UNEXPLAINED: '#d4d4d8',
};

/** How far to trust the engine, in words a manager uses. */
export const EVIDENCE_LABEL = {
  CONFIRMED: 'Sure — two kinds of proof agree',
  LIKELY: 'Likely',
  CONFLICT: 'The evidence disagrees',
  UNCORROBORATED: 'Only one weak clue so far',
  INSUFFICIENT_DATA: 'Too few visits to say',
};

export const REASON_LABEL = {
  PROPOSED: 'Needs an answer',
  CONFLICT: 'Evidence disagrees',
  AUDIT: 'Spot check',
  TRIP_DROP: 'Trips turned around here',
  MERGE_CONFLICT: 'Two answers disagree',
  LABEL_REVIEW: 'The data disagrees with an answer',
};
