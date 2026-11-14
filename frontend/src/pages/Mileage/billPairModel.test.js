import { describe, expect, it } from 'vitest';
import { isOdometerCapture, linkFor, pairSummary, pairTruck, pairsById } from './billPairModel';

const SLIP_PAIR = {
  role: 'SLIP',
  slipCaptureId: 'slip-1',
  odometerCaptureId: 'odo-1',
  state: 'PROPOSED',
  decision: 'AUTO',
  gapMin: 7,
  reasons: ['the odometer photo was taken after the slip'],
  trucks: [{ vehicleId: 'v1', registrationNumber: 'MH12AB1234' }],
  odometerKm: 122704.7,
  odometerKmSource: 'READ',
};

describe('the odometer photos', () => {
  it('knows an odometer photo from its kind or from its doc type', () => {
    expect(isOdometerCapture({ kind: 'ODOMETER' })).toBe(true);
    expect(isOdometerCapture({ docType: 'ODOMETER_PHOTO' })).toBe(true);
    expect(isOdometerCapture({ docType: 'DIESEL_SLIP' })).toBe(false);
    expect(isOdometerCapture({ kind: 'SLIP' })).toBe(false);
    expect(isOdometerCapture(null)).toBe(false);
  });
});

describe('the pairs of a list of captures', () => {
  const slip = { id: 'slip-1', kind: 'SLIP', pair: SLIP_PAIR };
  const odometer = {
    id: 'odo-1',
    kind: 'ODOMETER',
    pair: { role: 'ODOMETER', slipCaptureId: 'slip-1', odometerCaptureId: 'odo-1' },
  };

  it('points both roles at the pair that belongs to them', () => {
    const pairs = pairsById([slip, odometer]);
    expect(pairs.get('slip-1')).toBe(SLIP_PAIR);
    expect(pairs.get('odo-1')).toBe(odometer.pair);
  });

  it('leads to the partner of a capture that is not in the list', () => {
    const pairs = pairsById([odometer]);
    expect(pairs.get('slip-1')).toBe(odometer.pair);
  });

  it('has no pair for a capture on its own', () => {
    expect(pairsById([{ id: 'slip-2' }]).size).toBe(0);
    expect(pairsById(null).size).toBe(0);
  });
});

describe('the truck of a pair', () => {
  it('gives the truck when the server is sure of it', () => {
    expect(pairTruck(SLIP_PAIR)).toBe('MH12AB1234');
    expect(pairTruck({ ...SLIP_PAIR, decision: 'PERSON' })).toBe('MH12AB1234');
  });

  it('has no truck when the pair still asks or is not a slip', () => {
    expect(pairTruck({ ...SLIP_PAIR, decision: 'ASK' })).toBe('');
    expect(pairTruck({ ...SLIP_PAIR, role: 'ODOMETER' })).toBe('');
    expect(pairTruck(null)).toBe('');
  });
});

describe('the link of a bill', () => {
  it('takes the odometer photo along while the pair is only proposed', () => {
    expect(linkFor({ id: 'slip-1' }, 'MH12AB1234', SLIP_PAIR, 'UPLOAD')).toEqual({
      captureId: 'slip-1',
      registrationNumber: 'MH12AB1234',
      reason: null,
      via: 'UPLOAD',
      odometerCaptureId: 'odo-1',
    });
  });

  it('leaves the odometer photo out when there is no proposed pair', () => {
    expect(linkFor({ id: 'slip-1' }, 'MH12AB1234', null, 'UPLOAD')).toEqual({
      captureId: 'slip-1',
      registrationNumber: 'MH12AB1234',
      reason: null,
      via: 'UPLOAD',
    });
    expect(
      linkFor({ id: 'slip-1' }, 'MH12AB1234', { ...SLIP_PAIR, state: 'CONFIRMED' }, 'UPLOAD'),
    ).toEqual({
      captureId: 'slip-1',
      registrationNumber: 'MH12AB1234',
      reason: null,
      via: 'UPLOAD',
    });
  });
});

describe('what the pair says', () => {
  it('says the reading and the gap', () => {
    expect(pairSummary(SLIP_PAIR)).toEqual(['Odometer 1,22,704.7 km · 7 min from the slip']);
  });

  it('leaves out the parts that are not known', () => {
    expect(pairSummary({ odometerKm: 122704.7 })).toEqual(['Odometer 1,22,704.7 km']);
    expect(pairSummary({ gapMin: 7 })).toEqual(['7 min from the slip']);
    expect(pairSummary({})).toEqual([]);
    expect(pairSummary(null)).toEqual([]);
  });

  it('warns when the reader was unsure of the digits', () => {
    expect(pairSummary({ ...SLIP_PAIR, odometerKmSource: 'RAW' })).toEqual([
      'Odometer 1,22,704.7 km · 7 min from the slip',
      'The reader was unsure of these digits. Check the photo.',
    ]);
  });
});
