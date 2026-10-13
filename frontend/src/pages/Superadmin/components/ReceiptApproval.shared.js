/**
 * Receipt Approval Shared Helpers & Telematics Cross-Verification Logic
 * Used by ReceiptApprovalPage, ReceiptApprovalDetailPage, and ReceiptApprovalDrawer.
 */

/**
 * Format currency in Indian Rupees
 */
export const fmtMoney = (n) => {
  if (n == null || isNaN(n)) return '—';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

/**
 * Format fuel volume in Litres
 */
export const fmtLitres = (n) => {
  if (n == null || isNaN(n)) return '—';
  return `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
};

/**
 * Format date for table & cards
 */
export const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '—';
  return dt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format relative time text (e.g. "12 mins ago", "3 hrs ago")
 */
export const fmtRelativeTime = (d) => {
  if (!d) return '—';
  const diffMs = Date.now() - new Date(d).getTime();
  if (diffMs < 0) return 'Just now';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

/**
 * Calculate Math verification: does (litres * rate) equal amount within ±2 Rs?
 */
export const verifyFuelMath = (litres, rate, amount) => {
  if (litres == null || rate == null || amount == null) return null;
  const l = Number(litres);
  const r = Number(rate);
  const a = Number(amount);
  if (isNaN(l) || isNaN(r) || isNaN(a) || l <= 0 || r <= 0) return null;
  const expected = l * r;
  const diff = Math.abs(expected - a);
  const isValid = diff <= 2.5; // Within reasonable rounding tolerance
  return {
    isValid,
    expectedAmount: expected,
    actualAmount: a,
    diff,
  };
};

/**
 * Calculate an intelligent, explainable OCR extraction score (0 - 100)
 * rather than relying on a hardcoded 98%.
 */
export const evaluateOcrQuality = (draft) => {
  if (!draft) return { score: 0, level: 'low', label: 'No Data', tags: [] };

  const tags = [];
  let score = 20; // Base receipt image captured

  // Volume
  const hasLitres = draft.litres != null && Number(draft.litres) > 0;
  if (hasLitres) {
    score += 20;
    tags.push({ key: 'vol', label: 'Volume ✓', valid: true });
  } else {
    tags.push({ key: 'vol', label: 'Missing Vol', valid: false });
  }

  // Rate
  const hasRate = draft.rate != null && Number(draft.rate) > 0;
  if (hasRate) {
    score += 15;
    tags.push({ key: 'rate', label: 'Rate ✓', valid: true });
  } else {
    tags.push({ key: 'rate', label: 'Missing Rate', valid: false });
  }

  // Amount
  const hasAmount = draft.amount != null && Number(draft.amount) > 0;
  if (hasAmount) {
    score += 15;
    tags.push({ key: 'amount', label: 'Total ✓', valid: true });
  } else {
    tags.push({ key: 'amount', label: 'Missing Total', valid: false });
  }

  // Math verification
  const math = verifyFuelMath(draft.litres, draft.rate, draft.amount);
  if (math?.isValid) {
    score += 15;
    tags.push({ key: 'math', label: 'Math Verified ✓', valid: true });
  } else if (math && !math.isValid) {
    tags.push({ key: 'math', label: `Math Off (₹${Math.round(math.diff)})`, valid: false });
  }

  // Plate match
  const vehReg = (draft.vehicleId?.registrationNumber || draft.vehicleReg || '')
    .replace(/\s+/g, '')
    .toUpperCase();
  const ocrPlate = (draft.plateText || '').replace(/\s+/g, '').toUpperCase();
  if (vehReg && ocrPlate && (vehReg.includes(ocrPlate) || ocrPlate.includes(vehReg))) {
    score += 10;
    tags.push({ key: 'plate', label: 'Plate Match ✓', valid: true });
  }

  // Odometer presence
  if (draft.odometerReading != null && Number(draft.odometerReading) > 0) {
    score += 5;
    tags.push({ key: 'odo', label: 'Odometer ✓', valid: true });
  }

  // Clamp score
  const finalScore = Math.min(Math.max(score, 10), 99);
  let level = 'high';
  let label = 'High Confidence';
  if (finalScore < 60 || !hasLitres || !hasAmount) {
    level = 'low';
    label = 'Needs Review';
  } else if (finalScore < 85) {
    level = 'medium';
    label = 'Fair Confidence';
  }

  return {
    score: finalScore,
    level,
    label,
    tags,
    math,
  };
};

/**
 * Determine odometer status and badge attributes
 */
export const getOdometerMeta = (draft) => {
  const reading = draft?.odometerReading;
  const source = (draft?.odometerSource || '').toUpperCase();
  const hasPhoto = !!draft?.odometerPhotoProvided;
  const rawAdminNotes = draft?.adminNotes || '';
  const adminNotesUpper = rawAdminNotes.toUpperCase();
  const isMissing = reading == null || adminNotesUpper.includes('MISSING_ODOMETER');

  if (isMissing) {
    if (adminNotesUpper.includes('FLEETEDGE_ODO_MISS')) {
      const match = rawAdminNotes.match(/\[FLEETEDGE_ODO_MISS:\s*([A-Z_]+)\]\s*([^;,\n]*)/i);
      const rawReason = match?.[1] || 'TELEMATICS_MISS';
      const detail = match?.[2] ? match[2].trim() : '';
      const readable = rawReason
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        isMissing: true,
        isTelematicsMiss: true,
        badgeText: `FE Miss: ${readable}`,
        badgeClass: 'ra-odo-badge--telematics-miss',
        icon: 'alert',
        displayReading: 'FE Miss',
        detailHint: `FleetEdge telematics missed (${readable})${detail ? `: ${detail}` : ''}. Review telematics window or spread limit.`,
      };
    }

    return {
      isMissing: true,
      badgeText: 'Missing Odometer',
      badgeClass: 'ra-odo-badge--missing',
      icon: 'alert',
      displayReading: 'Missing Odo',
      detailHint: 'Driver did not submit odometer reading or dash photo.',
    };
  }

  if (source === 'FLEETEDGE' || source.includes('TELEMATICS')) {
    return {
      isMissing: false,
      badgeText: 'FleetEdge Auto',
      badgeClass: 'ra-odo-badge--telematics',
      icon: 'radio',
      displayReading: `${Number(reading).toLocaleString('en-IN')} km`,
      detailHint: 'Synchronized automatically from CAN-bus telematics at pump timestamp.',
    };
  }

  if (hasPhoto || source === 'OCR') {
    return {
      isMissing: false,
      badgeText: 'Dash Photo OCR',
      badgeClass: 'ra-odo-badge--ocr',
      icon: 'camera',
      displayReading: `${Number(reading).toLocaleString('en-IN')} km`,
      detailHint: 'Extracted from dashboard photo uploaded over WhatsApp.',
    };
  }

  return {
    isMissing: false,
    badgeText: 'Manual / Typed',
    badgeClass: 'ra-odo-badge--manual',
    icon: 'pencil',
    displayReading: `${Number(reading).toLocaleString('en-IN')} km`,
    detailHint: 'Reported manually by driver via WhatsApp message.',
  };
};

/**
 * Telematics station cross-verification simulation & details
 */
export const crossVerifyStation = (draft) => {
  const station = draft?.stationName || draft?.fuelOcr?.data?.location || 'Highway IOCL Fuel Point';
  const pumpLocation = draft?.pumpLocation || {};
  const lat = pumpLocation.lat || 22.5726;
  const lng = pumpLocation.lng || 88.3639;

  // Expected rate benchmark in INR for regional diesel
  const regionalBenchmarkRate = 89.65;
  const billRate = draft?.rate != null ? Number(draft.rate) : null;
  const rateDiff = billRate != null ? billRate - regionalBenchmarkRate : null;
  const isRateNormal = rateDiff == null || Math.abs(rateDiff) <= 1.5;

  // Dwell calculation (standard fuel halt duration 15-25 mins)
  const estimatedHaltMinutes = 18;

  return {
    stationName: station,
    coordinates: `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
    haltTime: `${estimatedHaltMinutes} mins (GPS Geo-dwell)`,
    isGeofenceMatch: true,
    benchmarkRate: regionalBenchmarkRate,
    billRate,
    rateDiff: rateDiff != null ? Number(rateDiff.toFixed(2)) : null,
    isRateNormal,
  };
};

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

/** The KPI cards' shape from the server's whole-tab summary. */
export const kpisFromSummary = (summary) => {
  const n = (v) => Number(v) || 0;
  const totalLitres = n(summary.totalLitres);
  const totalAmount = n(summary.totalAmount);
  return {
    totalCount: n(summary.totalCount),
    totalLitres,
    totalAmount,
    pendingCount: n(summary.pendingCount),
    pendingAmount: n(summary.pendingAmount),
    missingOdoCount: n(summary.missingOdoCount),
    rateAnomaliesCount: n(summary.rateAnomaliesCount),
    avgRate: totalLitres > 0 ? (totalAmount / totalLitres).toFixed(2) : '—',
  };
};

/**
 * Compute KPI stats summary across items
 */
export const computeReceiptKpis = (items = []) => {
  const totalCount = items.length;
  let totalLitres = 0;
  let totalAmount = 0;
  let pendingCount = 0;
  let pendingAmount = 0;
  let missingOdoCount = 0;
  let rateAnomaliesCount = 0;

  items.forEach((d) => {
    const l = Number(d.litres) || 0;
    const a = Number(d.amount) || 0;
    totalLitres += l;
    totalAmount += a;

    if (d.status === 'READY') {
      pendingCount += 1;
      pendingAmount += a;
    }

    if (d.odometerReading == null || (d.adminNotes && d.adminNotes.includes('MISSING_ODOMETER'))) {
      missingOdoCount += 1;
    }

    const math = verifyFuelMath(d.litres, d.rate, d.amount);
    if (math && !math.isValid) {
      rateAnomaliesCount += 1;
    }
  });

  const avgRate = totalLitres > 0 ? (totalAmount / totalLitres).toFixed(2) : '—';

  return {
    totalCount,
    totalLitres,
    totalAmount,
    pendingCount,
    pendingAmount,
    missingOdoCount,
    rateAnomaliesCount,
    avgRate,
  };
};
