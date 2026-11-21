// The ERP trip states the backend stores and filters on (main-backend erpTrip.constants.js).
export const ERP_TRIP_STATES = [
  ['PLANNED', 'Planned', 'neutral'],
  ['PLACED', 'Placed', 'info'],
  ['ADVANCE_PENDING', 'Advance pending', 'warn'],
  ['ADVANCE_PAID', 'Advance paid', 'info'],
  ['CN_PENDING', 'CN pending', 'warn'],
  ['CN_UPDATED', 'CN updated', 'info'],
  ['DISPATCHED', 'Dispatched', 'info'],
  ['TRIP_CLOSED', 'Trip closed', 'ok'],
  ['POD_RECEIVED', 'POD received', 'ok'],
  ['UNLOADED', 'Unloaded', 'ok'],
  ['BILLED', 'Billed', 'ok'],
  ['CANCELLED', 'Cancelled', 'bad'],
];

const BY_STATE = new Map(ERP_TRIP_STATES.map(([value, label, tone]) => [value, { label, tone }]));

const words = (state) => {
  const text = String(state).replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const tripStateLabel = (state) =>
  BY_STATE.get(state)?.label || (state ? words(state) : 'Placed');

export const tripStateTone = (state) => BY_STATE.get(state)?.tone || 'neutral';
