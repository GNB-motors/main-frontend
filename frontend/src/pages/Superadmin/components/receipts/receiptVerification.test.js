import { describe, it, expect } from 'vitest';
import {
  verifyFuelMath,
  evaluateOcrQuality,
  getOdometerMeta,
  crossVerifyStation,
  checkFacts,
} from './receiptVerification';

describe('verifyFuelMath', () => {
  it('accepts a bill whose litres times rate equals the amount', () => {
    const math = verifyFuelMath(100, 90, 9000);
    expect(math.isValid).toBe(true);
    expect(math.expectedAmount).toBe(9000);
  });

  it('reports a bill whose math does not add up', () => {
    const math = verifyFuelMath(100, 90, 8000);
    expect(math.isValid).toBe(false);
    expect(math.diff).toBe(1000);
  });

  it('says nothing when a number is missing', () => {
    expect(verifyFuelMath(null, 90, 9000)).toBeNull();
    expect(verifyFuelMath(100, null, 9000)).toBeNull();
    expect(verifyFuelMath(100, 90, null)).toBeNull();
  });
});

describe('evaluateOcrQuality', () => {
  it('scores nothing when there is no photo', () => {
    expect(evaluateOcrQuality(null)).toEqual({
      score: 0,
      level: 'low',
      label: 'No Data',
      tags: [],
    });
  });

  it('says a receipt needs review when the total is missing', () => {
    const result = evaluateOcrQuality({ litres: 100, rate: 90 });
    expect(result.level).toBe('low');
    expect(result.label).toBe('Needs Review');
    expect(result.tags.map((t) => t.label)).toContain('Missing Total');
  });

  it('confirms a receipt with all the numbers on it', () => {
    const result = evaluateOcrQuality({
      litres: 100,
      rate: 90,
      amount: 9000,
      odometerReading: 42000,
      photos: [{ url: 'https://example.com/pump.jpg' }],
    });
    expect(result.level).toBe('high');
    expect(result.tags.map((t) => t.label)).toContain('Math Verified ✓');
  });

  it('spec 8: gives the photo base only when the row really has a photo', () => {
    const withoutPhoto = evaluateOcrQuality({ litres: 100, rate: 90, amount: 9000 });
    const withPhoto = evaluateOcrQuality({
      litres: 100,
      rate: 90,
      amount: 9000,
      photos: [{ url: 'https://example.com/pump.jpg' }],
    });

    expect(withPhoto.score - withoutPhoto.score).toBe(20);
  });

  it('spec 8: counts a fuel image or an odometer image as a photo', () => {
    const base = { litres: 100, rate: 90, amount: 9000 };
    const withFuel = evaluateOcrQuality({ ...base, fuelImageUrl: 'https://example.com/f.jpg' });
    const withOdo = evaluateOcrQuality({ ...base, odometerImageUrl: 'https://example.com/o.jpg' });

    expect(withFuel.score - evaluateOcrQuality(base).score).toBe(20);
    expect(withOdo.score - evaluateOcrQuality(base).score).toBe(20);
  });

  it('spec 8: an empty photo url is not a photo', () => {
    const result = evaluateOcrQuality({
      litres: 100,
      rate: 90,
      amount: 9000,
      photos: [{ url: '  ' }],
      fuelImageUrl: '',
    });

    expect(result.score).toBe(65);
  });

  it('spec 8: keeps the ten point floor for a row without a photo', () => {
    const result = evaluateOcrQuality({});

    expect(result.score).toBe(10);
    expect(result.label).toBe('Needs Review');
  });
});

describe('getOdometerMeta', () => {
  it('says the odometer is missing when there is no reading', () => {
    const meta = getOdometerMeta({});
    expect(meta.isMissing).toBe(true);
    expect(meta.badgeText).toBe('Missing Odometer');
    expect(meta.displayReading).toBe('Odometer missing');
  });

  it('names a telematics miss in plain words', () => {
    const meta = getOdometerMeta({
      adminNotes: '[FLEETEDGE_ODO_MISS:NO_SIGNAL] signal lost for 20 min',
    });
    expect(meta.isMissing).toBe(true);
    expect(meta.isTelematicsMiss).toBe(true);
    expect(meta.badgeText).toBe('FE Miss: No Signal');
  });

  it('shows the reading when the photo gave one', () => {
    const meta = getOdometerMeta({ odometerReading: 123456, odometerSource: 'OCR' });
    expect(meta.isMissing).toBe(false);
    expect(meta.displayReading).toBe('1,23,456 km');
  });
});

describe('crossVerifyStation', () => {
  it('shows only the station facts the draft carries', () => {
    const result = crossVerifyStation({ stationName: 'Jhargram Pump', rate: 88.5 });
    expect(result.stationName).toBe('Jhargram Pump');
    expect(result.billRate).toBe(88.5);
  });

  it('does not invent a halt, a geofence match or a benchmark', () => {
    const result = crossVerifyStation({ stationName: 'Jhargram Pump', rate: 88.5 });
    expect(result.coordinates).toBeNull();
    expect(result.haltTime).toBeNull();
    expect(result.isGeofenceMatch).toBeNull();
    expect(result.benchmarkRate).toBeNull();
    expect(result.benchmarkPlace).toBeNull();
    expect(result.benchmarkEffectiveDate).toBeNull();
    expect(result).not.toHaveProperty('isRateNormal');
    expect(result).not.toHaveProperty('rateDiff');
  });

  it('leaves the station empty when the photo gave none', () => {
    const result = crossVerifyStation({});
    expect(result.stationName).toBeNull();
    expect(result.billRate).toBeNull();
  });
});

describe('checkFacts', () => {
  it('an explicit unknown wins over ok: true or a pass status', () => {
    const arr = checkFacts({ checks: [{ name: 'TRUCK', result: 'unknown', ok: true }] });
    const keyed = checkFacts({ checks: { TRUCK: { status: 'pass', result: 'unknown' } } });

    for (const facts of [arr, keyed]) {
      expect(facts.unknown).toBe(1);
      expect(facts.needs).toBe(0);
      expect(facts.rows[0].status).toBe('UNKNOWN');
    }
  });

  it('a boolean-only check gets a normalised result', () => {
    const facts = checkFacts({ checks: { MATH: { ok: false }, ODO: { valid: true } } });

    expect(facts.rows.map((r) => r.status)).toEqual(['FAIL', 'PASS']);
    expect(facts.needs).toBe(1);
    expect(facts.unknown).toBe(0);
  });

  it('a bad result is still flagged when another field says pass', () => {
    const facts = checkFacts({ checks: { LITRES: { status: 'pass', result: 'mismatch' } } });

    expect(facts.rows[0]).toMatchObject({ bad: true, status: 'MISMATCH' });
  });
});
