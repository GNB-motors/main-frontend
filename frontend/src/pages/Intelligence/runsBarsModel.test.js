import { describe, it, expect } from 'vitest';
import {
  classifiedTotal,
  isPartialRow,
  loadedShare,
  runBarsByTruck,
  tripKmParts,
  unknownKmOf,
  unknownKmText,
  unknownKmTruckNote,
} from './runsBarsModel';

describe('tripKmParts', () => {
  it('never counts a plant-to-plant run as empty', () => {
    const parts = tripKmParts({ flags: ['PICKUP_TO_PICKUP'], km: { laden: 300, return: 280 } });
    expect(parts).toEqual({ loadedKm: 0, emptyKm: 280, repositionKm: 300 });
  });

  it('splits a loaded trip into loaded and empty km', () => {
    const parts = tripKmParts({ drop: { name: 'OCL' }, km: { laden: 420, return: 400 } });
    expect(parts).toEqual({ loadedKm: 420, emptyKm: 400, repositionKm: 0 });
  });

  it('keeps a leg that was not measured unknown', () => {
    const parts = tripKmParts({ drop: { name: 'OCL' }, km: { laden: null, return: 400 } });
    expect(parts).toEqual({ loadedKm: null, emptyKm: 400, repositionKm: 0 });
  });

  it('does not read an empty string as a measured leg', () => {
    const parts = tripKmParts({ drop: { name: 'OCL' }, km: { laden: '', return: '' } });
    expect(parts).toEqual({ loadedKm: null, emptyKm: null, repositionKm: 0 });
  });

  it('keeps a leg that does not apply to the trip kind a true 0', () => {
    const parts = tripKmParts({ leg: 'RETURN', km: { laden: 0, return: 30 } });
    expect(parts).toEqual({ loadedKm: 0, emptyKm: 30, repositionKm: 0 });
  });

  it('counts the approach as empty running too', () => {
    const parts = tripKmParts({
      drop: { name: 'OCL' },
      km: { laden: 420, approach: 40, return: null },
    });
    expect(parts).toEqual({ loadedKm: 420, emptyKm: 40, repositionKm: 0 });
  });

  it('adds the approach and the return for the empty running', () => {
    const parts = tripKmParts({
      drop: { name: 'OCL' },
      km: { laden: 420, approach: 40, return: 30 },
    });
    expect(parts).toEqual({ loadedKm: 420, emptyKm: 70, repositionKm: 0 });
  });

  it('keeps the empty running unknown when neither leg was measured', () => {
    const parts = tripKmParts({
      drop: { name: 'OCL' },
      km: { laden: 420, approach: null, return: null },
    });
    expect(parts).toEqual({ loadedKm: 420, emptyKm: null, repositionKm: 0 });
  });

  it('counts the approach and the return of a plant-to-plant run as well', () => {
    const parts = tripKmParts({
      flags: ['PICKUP_TO_PICKUP'],
      km: { laden: 300, approach: 10, return: 280 },
    });
    expect(parts).toEqual({ loadedKm: 0, emptyKm: 290, repositionKm: 300 });
  });
});

describe('classifiedTotal', () => {
  it('adds up the classified distance', () => {
    expect(classifiedTotal({ loadedKm: 100, emptyKm: 50, repositionKm: 50 })).toBe(200);
  });

  it('leaves out the legs that were not measured', () => {
    expect(classifiedTotal({ loadedKm: 100, emptyKm: null, repositionKm: null })).toBe(100);
  });

  it('has no distance at all when nothing was measured', () => {
    expect(classifiedTotal({ loadedKm: null, emptyKm: null })).toBeNull();
    expect(classifiedTotal(null)).toBeNull();
  });
});

describe('loadedShare', () => {
  it('shares the classified distance when both legs were measured', () => {
    expect(loadedShare({ loadedKm: 100, emptyKm: 50, repositionKm: 50 })).toBe(50);
  });

  it('has no share when the empty running was not measured', () => {
    expect(loadedShare({ loadedKm: 42180, emptyKm: null, repositionKm: 12600 })).toBeNull();
  });

  it('has no share when the loaded km were not measured', () => {
    expect(loadedShare({ loadedKm: null, emptyKm: 8420 })).toBeNull();
  });
});

describe('unknownKmTruckNote', () => {
  it('says one truck', () => {
    expect(unknownKmTruckNote(1)).toBe('1 truck has unknown km.');
  });

  it('says several trucks', () => {
    expect(unknownKmTruckNote(2)).toBe('2 trucks have unknown km.');
  });

  it('says nothing when every truck was measured', () => {
    expect(unknownKmTruckNote(0)).toBeNull();
  });
});

describe('the unknown km of a runs row', () => {
  it('reads a normal value', () => {
    expect(unknownKmOf({ unknownKm: 120 })).toBe(120);
    expect(unknownKmText({ unknownKm: 120 })).toBe('120 km not attributed');
  });

  it('is null when the field is null, as the server may send it', () => {
    expect(unknownKmOf({ unknownKm: null })).toBeNull();
    expect(unknownKmText({ unknownKm: null })).toBeNull();
  });

  it('is null when the field is absent, as on the old backend', () => {
    expect(unknownKmOf({})).toBeNull();
    expect(unknownKmText({})).toBeNull();
    expect(unknownKmText(undefined)).toBeNull();
  });

  it('says nothing when the whole distance was attributed', () => {
    expect(unknownKmText({ unknownKm: 0 })).toBeNull();
  });

  it('knows a partly measured row whichever backend sent it', () => {
    expect(isPartialRow({ partial: true })).toBe(true);
    expect(isPartialRow({ kmPartial: true })).toBe(true);
    expect(isPartialRow({ partial: false, kmPartial: false })).toBe(false);
    expect(isPartialRow({})).toBe(false);
  });
});

describe('runBarsByTruck', () => {
  // OLD backend: every leg is a number.
  const oldTrips = [
    { registrationNumber: 'WB11L8862', drop: { name: 'OCL' }, km: { laden: 100, return: 90 } },
    { registrationNumber: 'WB11L8862', leg: 'REPOSITION', km: { laden: 50, return: 40 } },
    { registrationNumber: 'WB11F6762', leg: 'RETURN', km: { laden: 0, return: 30 } },
  ];

  it('adds up the km of each truck', () => {
    const bars = runBarsByTruck(oldTrips);
    expect(bars[0].registrationNumber).toBe('WB11L8862');
    expect(bars[0]).toMatchObject({ loadedKm: 100, emptyKm: 130, repositionKm: 50, totalKm: 280 });
    expect(bars[0].partial).toBe(false);
  });

  it('keeps only the top trucks', () => {
    expect(runBarsByTruck(oldTrips, { limit: 1 })).toHaveLength(1);
  });

  // NEW backend: a leg that was not measured comes as null.
  it('keeps a truck whose km were not measured, with no km of its own', () => {
    const bars = runBarsByTruck([
      { registrationNumber: 'WB11L8862', drop: { name: 'OCL' }, km: { laden: null, return: null } },
    ]);
    expect(bars[0].totalKm).toBeNull();
    expect(bars[0].partial).toBe(true);
  });

  it('adds only the measured km of a partly measured truck', () => {
    const bars = runBarsByTruck([
      { registrationNumber: 'WB11L8862', drop: { name: 'OCL' }, km: { laden: 100, return: null } },
    ]);
    expect(bars[0]).toMatchObject({ loadedKm: 100, emptyKm: null, totalKm: 100, partial: true });
  });

  it('sorts a truck with no km last', () => {
    const bars = runBarsByTruck([
      { registrationNumber: 'WB11F6762', drop: { name: 'OCL' }, km: { laden: null, return: null } },
      { registrationNumber: 'WB11L8862', drop: { name: 'OCL' }, km: { laden: 100, return: 90 } },
    ]);
    expect(bars.map((bar) => bar.registrationNumber)).toEqual(['WB11L8862', 'WB11F6762']);
  });
});
