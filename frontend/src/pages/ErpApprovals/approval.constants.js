/**
 * Approval display metadata, mirroring the backend's erpApproval.constants.js.
 */

export const APPROVAL_TYPE_LABELS = {
  DO_MANUAL_RATE: 'Manual sale rate',
  DO_CREDIT_LIMIT: 'Credit limit exceeded',
  PLACEMENT_DRIVER_SHORTAGE: 'Driver shortage over limit',
  PLACEMENT_PENDING_POD: 'Pending PODs over limit',
  PLACEMENT_MANUAL_PB_RATE: 'Manual purchase rate',
  PLACEMENT_SB_PB_GAP: 'Sale/purchase rate gap',
  PLACEMENT_VENDOR_POD_AGING: 'Vendor POD ageing',
  ADVANCE_OVER_BUDGET: 'Advance over budget',
  ADVANCE_SHORTAGE_NOT_RECOVERED: 'Shortage not recovered',
  ADVANCE_HIRE_65_CAP: 'Hire advance over 65%',
  UNLOADING_RATE_CHANGE: 'Rate changed at unloading',
  SALE_BILL_APPROVAL: 'Sale bill approval',
  PURCHASE_BILL_APPROVAL: 'Purchase bill approval',
  BILLING_RATE_EDIT: 'Rate edited at billing',
  VENDOR_PAYMENT_FINAL: 'Vendor payment release',
};

export const ENTITY_TYPE_LABELS = {
  DO: 'Delivery Order',
  PLACEMENT: 'Placement',
  ADVANCE: 'Advance',
  SALE_BILL: 'Sale Bill',
  PURCHASE_BILL: 'Purchase Bill',
  VENDOR_PAYMENT: 'Vendor Payment',
};

export const STATUS_TONE = {
  PENDING: 'open',
  APPROVED: 'success',
  REJECTED: 'danger',
};

/** Types currently reachable — the later stages are declared but not raised yet. */
export const ACTIVE_APPROVAL_TYPES = ['DO_MANUAL_RATE', 'DO_CREDIT_LIMIT'];

const CURRENCY_KEYS = [
  'creditLimit',
  'exposure',
  'overBy',
  'enteredRate',
  'masterRate',
  'sbRate',
  'budget',
  'requested',
];

/** Render the `reason` blob as readable rows without hardcoding every type. */
export const formatReason = (reason = {}) =>
  Object.entries(reason)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([key, value]) => ({
      key,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .trim(),
      value:
        typeof value === 'number' && CURRENCY_KEYS.includes(key)
          ? `₹${value.toLocaleString('en-IN')}`
          : String(value),
    }));
