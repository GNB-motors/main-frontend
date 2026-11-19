const reasons = {
  REFUEL_HISTORY_MISSING: 'No earlier refuelling evidence',
  REFUEL_LOCATION_MISSING: 'Last refuelling location unavailable',
  STATE_AMBIGUOUS: 'Refuelling state is ambiguous',
  STATE_UNKNOWN: 'Refuelling state unavailable',
  STATE_HISTORY_MISSING: 'No stored diesel price for this state and date',
  PRICE_LOOKUP_FAILED: 'Price lookup unavailable',
  PRICE_LOOKUP_MISSING: 'Price lookup unavailable',
  VEHICLE_OR_DATE_MISSING: 'Truck or event date unavailable',
  VENDOR_DAY_PRICE_ALLOCATION_UNKNOWN: 'Refuelling changed within a vendor daily total',
};
export const priceReason = (reason) => reasons[reason] || 'Diesel price unavailable';
