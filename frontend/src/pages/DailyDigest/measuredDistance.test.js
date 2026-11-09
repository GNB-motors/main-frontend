import { describe, expect, it } from 'vitest';
import { missingPartsLabel, runningCoverageLine, runningDistance } from './measuredDistance';

describe('runningDistance', () => {
  // OLD response: both legs are numbers, the total is the total.
  it('adds both legs when both were measured', () => {
    expect(runningDistance(300, 120)).toMatchObject({
      complete: true,
      total: 420,
      knownLeg: 'loaded',
      missingLeg: null,
    });
  });

  // NEW response: one leg is not measured, so there is no total.
  it('publishes no total when one leg is missing', () => {
    expect(runningDistance(300, null)).toMatchObject({
      complete: false,
      total: null,
      knownLeg: 'loaded',
      missingLeg: 'empty',
    });
    expect(runningDistance(null, 120)).toMatchObject({
      complete: false,
      total: null,
      knownLeg: 'empty',
      missingLeg: 'loaded',
    });
  });

  it('keeps a measured zero a real zero', () => {
    expect(runningDistance(0, 0)).toMatchObject({ complete: true, total: 0 });
  });

  it('knows when nothing was measured at all', () => {
    expect(runningDistance(null, null)).toMatchObject({
      complete: false,
      total: null,
      knownLeg: null,
    });
  });
});

describe('runningCoverageLine', () => {
  it('names the known leg and says the other one was not measured', () => {
    expect(runningCoverageLine(runningDistance(300, null))).toBe(
      'Loaded 300 km · empty not measured',
    );
    expect(runningCoverageLine(runningDistance(null, 120))).toBe(
      'Empty 120 km · loaded not measured',
    );
  });

  it('says nothing when both legs are measured', () => {
    expect(runningCoverageLine(runningDistance(300, 120))).toBeNull();
    expect(runningCoverageLine(runningDistance(null, null))).toBeNull();
  });
});

describe('missingPartsLabel', () => {
  it('says which leg the digest could not measure', () => {
    expect(missingPartsLabel(['loaded'])).toBe('Loaded distance not measured');
    expect(missingPartsLabel(['empty'])).toBe('Empty distance not measured');
    expect(missingPartsLabel(['loaded', 'empty'])).toBe('Loaded and empty distance not measured');
  });

  it('says nothing when the old backend sends no missing parts', () => {
    expect(missingPartsLabel(undefined)).toBeNull();
    expect(missingPartsLabel([])).toBeNull();
  });
});
