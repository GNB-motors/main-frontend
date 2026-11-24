import { evaluateOcrQuality } from './receiptVerification';

/** Review warnings describe the bill, independently of its backend queue state. */
export function receiptReviewWarnings(draft) {
  if (!draft) return [];
  const warnings = [];
  const plate =
    draft.vehicleId?.registrationNumber ||
    draft.vehicleReg ||
    (['CONFIRMED', 'MATCHED', 'RESOLVED'].includes(draft.truck?.status) ? draft.truck?.plate : '');
  if (!plate || draft.market === true) warnings.push('Choose a truck from your fleet.');
  if (evaluateOcrQuality(draft).level === 'low')
    warnings.push('Check the bill details against the photo.');
  const mileage = draft.mileage;
  const value = Number(mileage?.computed);
  if (mileage?.vsAverage?.verdict === 'too_high' || (Number.isFinite(value) && value > 15))
    warnings.push('Unusually high km/L: check the distance and litres.');
  return warnings;
}
