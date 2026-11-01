import { formatInIST } from '../../utils/dateUtils';

export const toRefuelLocal = (instant = new Date()) =>
  formatInIST(instant, 'YYYY-MM-DD[T]HH:mm') || '';

/** A datetime-local field is always an IST wall clock, regardless of browser timezone. */
export function toRefuelISO(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value || '')) return null;
  const date = new Date(`${value}+05:30`);
  if (!Number.isFinite(date.getTime()) || toRefuelLocal(date) !== value.slice(0, 16)) return null;
  return date.toISOString();
}

export function validateFuelEntry(values, vehicle, driver, lastLog, now = new Date()) {
  if (!vehicle || !driver) return 'Please select a vehicle and a driver.';
  const at = toRefuelISO(values.refuelTime);
  if (!at) return 'Enter a valid refuelling date and time in IST.';
  if (new Date(at) > now) return 'Refuelling time cannot be in the future.';
  if (!['PARTIAL', 'FULL_TANK'].includes(values.fillingType))
    return 'Select whether the tank was full after filling.';
  if (!(Number(values.litres) > 0) || !Number.isFinite(Number(values.litres)))
    return 'Enter diesel litres greater than zero.';
  if (values.rate !== '' && (!(Number(values.rate) > 0) || !Number.isFinite(Number(values.rate))))
    return 'Enter a rate greater than zero, or leave it blank.';
  if (values.fillingType === 'FULL_TANK') {
    const odo = Number(values.odometerReading);
    if (values.odometerReading === '' || !Number.isFinite(odo) || odo < 0)
      return 'Enter the odometer at refuelling for a full-tank fill.';
    // The latest log can be AFTER a backdated entry; it is then not a predecessor.
    if (
      lastLog?.odometerReading != null &&
      new Date(lastLog.refuelTime) < new Date(at) &&
      odo <= lastLog.odometerReading
    ) {
      return `Odometer must be greater than the previous reading (${lastLog.odometerReading} km).`;
    }
  }
  return null;
}

export function fuelEntryPayload(values, vehicle, driver) {
  return {
    vehicleId: vehicle.id,
    driverId: driver.id,
    fuelType: 'DIESEL',
    fillingType: values.fillingType,
    litres: Number(values.litres),
    refuelTime: toRefuelISO(values.refuelTime),
    ...(values.rate !== '' && { rate: Number(values.rate) }),
    ...(values.fillingType === 'FULL_TANK' && { odometerReading: Number(values.odometerReading) }),
  };
}

/** OCR only suggests values the operator has not edited; dates remain visible before saving. */
export function fuelOcrPatch(data, docType, edited = new Set()) {
  const patch = {};
  if (docType === 'fuel') {
    for (const [field, value] of Object.entries({
      litres: data.volume,
      rate: data.rate,
    })) {
      if (value != null && !edited.has(field)) patch[field] = String(value);
    }
    const raw = String(data.datetime || data.extractedData?.datetime || '')
      .trim()
      .replace(' ', 'T');
    const iso = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw) ? raw : toRefuelISO(raw);
    if (iso && !edited.has('refuelTime')) {
      const local = toRefuelLocal(iso);
      if (local) patch.refuelTime = local;
    }
  } else if (data.reading != null && !edited.has('odometerReading')) {
    const reading = Number(String(data.reading).replace(/[^\d.]/g, ''));
    if (Number.isFinite(reading)) patch.odometerReading = String(reading);
  }
  return patch;
}
