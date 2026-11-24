import { expect, it } from 'vitest';
import { receiptReviewWarnings } from './receiptReview';
const good = { vehicleReg: 'WB11T0662', litres: 100, rate: 90, amount: 9000 };
it('flags implausible mileage, missing trucks and weak reads without calling them ready', () => {
  expect(receiptReviewWarnings({ ...good, mileage: { computed: 31.92 } })).toContain(
    'Unusually high km/L: check the distance and litres.',
  );
  expect(receiptReviewWarnings({ litres: 10 })).toContain('Choose a truck from your fleet.');
  expect(receiptReviewWarnings({ litres: 10 })).toContain(
    'Check the bill details against the photo.',
  );
  expect(receiptReviewWarnings(good)).toEqual([]);
});
