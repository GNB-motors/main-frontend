/**
 * Delivery-order constants and helpers.
 *
 * Plain .js so react-refresh stays happy — a component file may only export
 * components, and both the page and the drawer need these.
 */

export const DO_TYPES = [
  { value: 'KL_DO', label: 'KL (volume)', unit: 'KL' },
  { value: 'WT_DO', label: 'MT (weight)', unit: 'MT' },
  { value: 'VEHICLE_COUNT_DO', label: 'Vehicle count', unit: 'VEHICLE' },
];

/** A sure order's unit is the DO's qtyUnit, so it maps straight to a doType. */
export const DO_TYPE_FOR_UNIT = { KL: 'KL_DO', MT: 'WT_DO', VEHICLE: 'VEHICLE_COUNT_DO' };

export const unitFor = (doType) => DO_TYPES.find((d) => d.value === doType)?.unit || '';

export const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

export const todayInput = () => new Date().toISOString().slice(0, 10);

export const shortDate = (v) =>
  (v
    ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—');

export const EMPTY_FORM = {
  sourceCallTaskId: null,
  partyId: '',
  routeId: '',
  material: '',
  doDate: todayInput(),
  doType: 'KL_DO',
  qty: '',
  vehicleCapacity: '',
  useManualRate: false,
  sbRate: '',
  sbRateUnit: 'PER_KL',
  rateRemark: '',
  expiryDate: '',
};

/**
 * Build the form for a sure order won on a call.
 *
 * The whole point: material and quantity were agreed on the phone and stored on
 * the call task, so operations never re-enters them. Only what the call could
 * not know — route, DO date, expiry — is left to fill in.
 */
export const formFromCall = (task) => ({
  ...EMPTY_FORM,
  sourceCallTaskId: task._id,
  partyId: task.partyId?._id || task.partyId,
  material: task.orderMaterial || '',
  qty: task.orderQty != null ? String(task.orderQty) : '',
  doType: DO_TYPE_FOR_UNIT[task.orderQtyUnit] || 'KL_DO',
});

/**
 * Where an order sits in the operations pipeline.
 *
 * Derived, not stored: a DO's own status plus `liftedQty` already say this.
 * PENDING with nothing lifted is waiting for a vehicle; PARTIAL means placement
 * has started and the quantity is drawing down. Storing a separate "stage" field
 * would need invalidating on every placement and could disagree with the
 * balance, which is the number people actually trust.
 */
export const STAGES = {
  PENDING_APPROVAL: { label: 'Awaiting approval', tone: 'warning', step: 0 },
  PENDING: { label: 'Ready for placement', tone: 'info', step: 1 },
  PARTIAL: { label: 'Placement in progress', tone: 'purple', step: 2 },
  COMPLETED: { label: 'Completed', tone: 'success', step: 3 },
  EXPIRED: { label: 'Expired', tone: 'neutral', step: -1 },
  CANCELLED: { label: 'Cancelled', tone: 'danger', step: -1 },
};

export const stageOf = (order) =>
  STAGES[order?.status] || { label: order?.status || '—', tone: 'neutral', step: -1 };

/** The four steps a delivery order moves through, for the detail drawer. */
export const LIFECYCLE = [
  { key: 'do', label: 'Delivery order' },
  { key: 'placement', label: 'Placement' },
  { key: 'trip', label: 'Trip' },
  { key: 'done', label: 'Completed' },
];
