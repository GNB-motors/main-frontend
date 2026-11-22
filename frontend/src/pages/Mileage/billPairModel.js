/**
 * billPairModel — the rules for a slip and its odometer photo.
 *
 * The office uploads pump slips and dashboard photos together, in any order.
 * The server pairs them and keeps the pair as one fill. The person reads the
 * pair before the bill is confirmed, so every rule here is about what the
 * person is shown and what is sent with the bill.
 */

/** True when the capture is an odometer photo and not a bill slip. */
export const isOdometerCapture = (capture) =>
  capture?.kind === 'ODOMETER' || /ODOMETER/i.test(capture?.docType || '');

/**
 * The pairs of a list of captures, by capture id. A slip and its odometer
 * photo lead to each other, so both ids point at the same pair. A capture
 * keeps the pair written for its own role: the slip's pair carries the truck
 * and the reading, the odometer's own pair only says which slip it is with.
 */
export const pairsById = (captures) => {
  const map = new Map();
  const list = Array.isArray(captures) ? captures : [];
  list.forEach((capture) => {
    if (capture?.id && capture.pair) map.set(capture.id, capture.pair);
  });
  // A partner that is not in the list still leads to its pair.
  list.forEach((capture) => {
    const pair = capture?.pair;
    if (!pair) return;
    if (pair.slipCaptureId && !map.has(pair.slipCaptureId)) map.set(pair.slipCaptureId, pair);
    if (pair.odometerCaptureId && !map.has(pair.odometerCaptureId))
      map.set(pair.odometerCaptureId, pair);
  });
  return map;
};

/**
 * The truck of a pair the server is sure about. A pair that still asks
 * ("ASK") has no truck to offer: the person has to look at the photos.
 */
export const pairTruck = (pair) => {
  if (!pair || pair.role !== 'SLIP') return '';
  if (!['AUTO', 'PERSON'].includes(pair.decision)) return '';
  return pair.trucks?.[0]?.registrationNumber || '';
};

/** The link the confirmation endpoint expects for one bill. */
export const linkFor = (capture, registrationNumber, pair, via) => {
  const link = {
    captureId: capture?.id,
    registrationNumber,
    reason: null,
    via,
  };
  // Only a pair that is still proposed travels with the bill.
  if (pair?.role === 'SLIP' && pair.state === 'PROPOSED') {
    link.odometerCaptureId = pair.odometerCaptureId;
  }
  return link;
};

/**
 * What the pair says, in words. The parts that are not known are left out
 * instead of being guessed.
 */
export const pairSummary = (pair) => {
  if (!pair) return [];
  const parts = [];
  const km = pair.odometerKm;
  if (km !== null && km !== undefined && km !== '') {
    const reading = Number(km);
    parts.push(`Odometer ${Number.isFinite(reading) ? reading.toLocaleString('en-IN') : km} km`);
  }
  const gap = pair.gapMin;
  if (gap !== null && gap !== undefined && gap !== '') parts.push(`${gap} min from the slip`);
  const lines = parts.length ? [parts.join(' · ')] : [];
  if (pair.odometerKmSource === 'RAW') {
    lines.push('The reader was unsure of these digits. Check the photo.');
  }
  return lines;
};
