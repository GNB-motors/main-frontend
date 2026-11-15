const KEY_FIELDS = [
  { key: 'TRUCK', label: 'Truck' },
  { key: 'LITRES', label: 'Litres' },
  { key: 'AMOUNT', label: 'Amount' },
  { key: 'FILL_TIME', label: 'Fill time' },
];

const text = (value) => String(value ?? '').trim();

const vehicleId = (value) => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return value._id || value.id || '';
  return '';
};

const hasPositiveNumber = (value) => {
  if (value === '' || value === null || value === undefined) return false;
  const number = Number(value);
  return Number.isFinite(number) && number > 0;
};

const hasTime = (value) => {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time);
};

/**
 * The identity fields a person must check before a receipt is published.
 * Current editor values win over the values already saved on the draft.
 */
export const missingKeyFields = (draft, edits) => {
  const row = draft || {};
  const current = edits || null;
  const truck = row.truck || null;
  const truckStatus = text(truck?.status).toUpperCase();
  const isMarket = row.market === true || truckStatus === 'MARKET';
  const isCertainTruck =
    truckStatus === 'EXACT' || truckStatus === 'SURE' || truck?.bucket === 'EXACT';

  const originalIds = new Set(
    [vehicleId(row.vehicleId), vehicleId(truck?.vehicleId)].filter(Boolean),
  );
  const originalPlate = text(truck?.plate || row.plateText);
  const selectedId = text(current?.vehicleId);
  const selectedPlate = text(current?.truckPlate);
  const hasSelectedTruck = Boolean(selectedId || selectedPlate);
  const truckCleared = current?.truckPicked === true && !hasSelectedTruck;
  const personChoseTruck =
    !truckCleared &&
    (current?.truckPicked === true ||
      (selectedId && !originalIds.has(selectedId)) ||
      (selectedPlate && selectedPlate !== originalPlate));

  const savedVehicle = vehicleId(row.vehicleId) || vehicleId(truck?.vehicleId);
  const truckFilled =
    isMarket ||
    (!truckCleared &&
      (isCertainTruck ||
        personChoseTruck ||
        (!truck && Boolean(savedVehicle || selectedId || selectedPlate))));

  const litresValue =
    current && Object.prototype.hasOwnProperty.call(current, 'litres')
      ? current.litres
      : row.litres;
  const amountValue =
    current && Object.prototype.hasOwnProperty.call(current, 'amount')
      ? current.amount
      : row.amount;

  const personSetTime =
    current?.time?.action === 'accept' ||
    (current?.time?.action === 'set' && hasTime(current.time.at));
  const fillTimeFilled = personSetTime || hasTime(row.time?.value);

  const missing = [];
  if (!truckFilled) missing.push(KEY_FIELDS[0]);
  if (!hasPositiveNumber(litresValue)) missing.push(KEY_FIELDS[1]);
  if (!hasPositiveNumber(amountValue)) missing.push(KEY_FIELDS[2]);
  if (!fillTimeFilled) missing.push(KEY_FIELDS[3]);
  return missing;
};
