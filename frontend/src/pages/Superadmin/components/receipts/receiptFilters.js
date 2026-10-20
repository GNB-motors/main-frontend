import { evaluateOcrQuality, getOdometerMeta } from './receiptVerification';

/**
 * Filter drafts by date preset
 */
export const filterByDatePreset = (items, preset) => {
  if (!preset || preset === 'ALL') return items;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return items.filter((d) => {
    const rawDate = d.billDatetime || d.fuelOcr?.data?.datetime || d.createdAt;
    if (!rawDate) return false;
    const time = new Date(rawDate).getTime();
    if (isNaN(time)) return false;

    if (preset === 'TODAY') {
      return time >= startOfDay;
    }
    if (preset === 'YESTERDAY') {
      const yesterdayStart = startOfDay - 86400000;
      return time >= yesterdayStart && time < startOfDay;
    }
    if (preset === '7DAYS') {
      return time >= now.getTime() - 7 * 86400000;
    }
    if (preset === '30DAYS') {
      return time >= now.getTime() - 30 * 86400000;
    }
    return true;
  });
};

/**
 * The from/to window (ISO strings) a date preset stands for, on the same
 * browser-local day boundaries filterByDatePreset uses. `to` is exclusive.
 */
export const datePresetRange = (preset, now = new Date()) => {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const iso = (t) => new Date(t).toISOString();
  if (preset === 'TODAY') return { from: iso(startOfDay) };
  if (preset === 'YESTERDAY') return { from: iso(startOfDay - 86400000), to: iso(startOfDay) };
  if (preset === '7DAYS') return { from: iso(now.getTime() - 7 * 86400000) };
  if (preset === '30DAYS') return { from: iso(now.getTime() - 30 * 86400000) };
  return {};
};

/** The inbox filters as GET /api/whatsapp/admin/drafts query params ('ALL' and '' are left out). */
export const draftListParams = (
  { status, page, limit, query, dateFilter, odoFilter, anomalyFilter, sortDirection },
  now = new Date(),
) => {
  const params = { status, page, limit, order: sortDirection, ...datePresetRange(dateFilter, now) };
  const q = (query || '').trim();
  if (q) params.q = q;
  if (odoFilter && odoFilter !== 'ALL') params.odometer = odoFilter;
  if (anomalyFilter && anomalyFilter !== 'ALL') params.review = anomalyFilter;
  return params;
};

/**
 * The inbox's filters and sort applied in the browser. Only for a backend that
 * predates server-side filtering (its response has no totalPages); the server
 * applies the same rules (main-backend whatsapp.draftQuery.js).
 */
export const filterDraftsLocally = (
  items,
  { query, dateFilter, odoFilter, anomalyFilter, sortDirection },
) => {
  let result = filterByDatePreset(items, dateFilter);

  if (odoFilter === 'MISSING') {
    result = result.filter(
      (d) =>
        d.odometerReading == null || (d.adminNotes && d.adminNotes.includes('MISSING_ODOMETER')),
    );
  } else if (odoFilter === 'TELEMATICS') {
    result = result.filter((d) => (d.odometerSource || '').toUpperCase().includes('FLEETEDGE'));
  } else if (odoFilter === 'PHOTO') {
    result = result.filter((d) => d.odometerPhotoProvided || d.odometerSource === 'OCR');
  }

  if (anomalyFilter === 'NEEDS_REVIEW') {
    result = result.filter((d) => {
      const ocr = evaluateOcrQuality(d);
      const odo = getOdometerMeta(d);
      return ocr.level === 'low' || odo.isMissing || (ocr.math && !ocr.math.isValid);
    });
  } else if (anomalyFilter === 'MATH_VERIFIED') {
    result = result.filter((d) => evaluateOcrQuality(d).math?.isValid);
  }

  const q = (query || '').trim().toLowerCase();
  if (q) {
    result = result.filter((d) => {
      const veh = d.vehicleId?.registrationNumber || d.vehicleReg || '';
      const org = d.orgId?.companyName || '';
      const plate = d.plateText || '';
      const driver = `${d.userId?.firstName || ''} ${d.userId?.lastName || ''}`.trim();
      const phone = d.phoneE164 || d.waId || '';
      const station = d.stationName || d.fuelOcr?.data?.location || '';
      return [veh, org, plate, driver, phone, station].some((v) => v.toLowerCase().includes(q));
    });
  }

  // Sort by refuel date (billDatetime), falling back to OCR datetime and createdAt
  const refuelTime = (d) =>
    new Date(d.billDatetime || d.fuelOcr?.data?.datetime || d.createdAt || 0).getTime();
  return [...result].sort((a, b) =>
    sortDirection === 'asc' ? refuelTime(a) - refuelTime(b) : refuelTime(b) - refuelTime(a),
  );
};
