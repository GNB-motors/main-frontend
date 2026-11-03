import { describe, it, expect } from 'vitest';
import {
  defTileValues,
  fallbackNow,
  freshnessTone,
  fuelTileValues,
  legLabel,
  makeCode,
  makeLabel,
  modelLabel,
  statusLabel,
  trafficWord,
} from './vehiclePanelModel';

const releaseVehicle = {
  plate: 'WB11L8862',
  manufacturer: 'Tata',
  model: '4830TC',
  vin: 'MAT566011S3E16394',
  manufactureYear: 2021,
  status: 'moving',
  freshness: 'live',
  live: true,
  lastFixAt: '2026-11-02T20:48:00Z',
  ago: 0,
  fuel: 356.5,
  defLevel: 60.8,
  ignition: 'ON',
  speed: 26,
  hasFix: true,
  hasGpsFix: true,
  odo: 43478,
};

describe('makeLabel', () => {
  it('writes the make the way the owner does', () => {
    expect(makeLabel('TATA')).toBe('Tata');
    expect(makeLabel('Ashok Leyland')).toBe('Ashok Leyland');
  });

  it('is null for an unknown make', () => {
    expect(makeLabel(null)).toBeNull();
    expect(makeLabel('Volvo')).toBeNull();
  });
});

describe('makeCode', () => {
  it('codes the make the way the API does', () => {
    expect(makeCode('Tata')).toBe('TATA');
    expect(makeCode('ASHOK_LEYLAND')).toBe('ASHOK_LEYLAND');
  });

  it('is null for an unknown make', () => {
    expect(makeCode(null)).toBeNull();
  });
});

describe('modelLabel', () => {
  it('keeps a real model', () => {
    expect(modelLabel('4830TC')).toBe('4830TC');
    expect(modelLabel('Signa 3118')).toBe('Signa 3118');
  });

  it('hides a model that is only digits', () => {
    expect(modelLabel('5555')).toBeNull();
    expect(modelLabel('  4830  ')).toBeNull();
  });

  it('is null when there is no model', () => {
    expect(modelLabel(null)).toBeNull();
    expect(modelLabel('   ')).toBeNull();
  });
});

describe('legLabel', () => {
  it('names a loaded run', () => {
    expect(legLabel('DRIVING_LOADED', 'LADEN')).toBe('Loaded run');
  });

  it('names an empty run', () => {
    expect(legLabel('DRIVING_EMPTY', 'RETURN')).toBe('Empty run');
  });

  it('names a plant-to-plant run', () => {
    expect(legLabel('DRIVING_LOADED', 'REPOSITION')).toBe('Plant to plant');
  });

  it('takes the leg from the trip even when the truck is stopped', () => {
    expect(legLabel('LOADING', 'LADEN')).toBe('Loaded run');
    expect(legLabel('UNLOADING', 'RETURN')).toBe('Empty run');
  });

  it('falls back to the activity when there is no trip', () => {
    expect(legLabel('DRIVING_LOADED', null)).toBe('Loaded run');
    expect(legLabel('DRIVING_EMPTY', null)).toBe('Empty run');
  });

  it('never says "In transit"', () => {
    expect(legLabel('LOADING', null)).toBeNull();
    expect(legLabel('UNKNOWN', 'APPROACH')).toBeNull();
  });
});

describe('statusLabel', () => {
  it('capitalises the status', () => {
    expect(statusLabel('moving')).toBe('Moving');
    expect(statusLabel('offline')).toBe('Offline');
  });

  it('says Unknown when there is no status', () => {
    expect(statusLabel(null)).toBe('Unknown');
  });
});

describe('freshnessTone', () => {
  it('mutes a stale reading', () => {
    expect(freshnessTone('stale')).toBe('muted');
    expect(freshnessTone('never')).toBe('muted');
  });

  it('quiets a recent reading', () => {
    expect(freshnessTone('recent')).toBe('quiet');
  });

  it('leaves a live reading normal', () => {
    expect(freshnessTone('live')).toBe('normal');
  });
});

describe('fallbackNow', () => {
  it('maps the release row onto the new view model', () => {
    const now = fallbackNow(releaseVehicle);
    expect(now.registrationNumber).toBe('WB11L8862');
    expect(now.identity.make).toBe('TATA');
    expect(now.identity.model).toBe('4830TC');
    expect(now.view.speedKmh).toBe(26);
    expect(now.readings.fuel.litres.value).toBe(356.5);
    expect(now.readings.def.pct.value).toBe(60.8);
    expect(now.readings.odometerKm.value).toBe(43478);
  });

  it('leaves what it does not know as null, never zero', () => {
    const now = fallbackNow({ ...releaseVehicle, fuel: null, defLevel: null, odo: null });
    expect(now.readings.fuel.litres).toBeNull();
    expect(now.readings.def.pct).toBeNull();
    expect(now.readings.odometerKm).toBeNull();
  });

  it('leaves the sections that need the new endpoint empty', () => {
    const now = fallbackNow(releaseVehicle);
    expect(now.place).toBeNull();
    expect(now.activity).toBeNull();
    expect(now.trip).toBeNull();
    expect(now.chips).toEqual([]);
    expect(now.issues).toEqual([]);
  });

  it('is null without a truck', () => {
    expect(fallbackNow(null)).toBeNull();
  });

  it('carries the driver when there is one', () => {
    const now = fallbackNow(releaseVehicle, { driverId: 'd1', name: 'Ramesh Yadav' });
    expect(now.driver.name).toBe('Ramesh Yadav');
  });
});

describe('fallbackNow fuel unit', () => {
  it('never calls an unproven fuel number litres', () => {
    const now = fallbackNow({ ...releaseVehicle, fuel: 32, fuelUnit: null });
    expect(now.readings.fuel.litres).toBeNull();
    expect(now.readings.fuel.unitless.value).toBe(32);
    expect(fuelTileValues(now.readings).main).toEqual({ kind: 'unitless', value: 32 });
  });

  it('keeps litres when the unit is proven', () => {
    const now = fallbackNow({ ...releaseVehicle, fuel: 32, fuelUnit: 'L' });
    expect(now.readings.fuel.litres.value).toBe(32);
  });
});

describe('fuelTileValues', () => {
  it('shows litres when we have them', () => {
    const values = fuelTileValues({
      fuel: { litres: { value: 356.5 }, pct: { value: 98 }, tankL: 365 },
    });
    expect(values.main).toEqual({ kind: 'litres', value: 356.5 });
  });

  it('shows the percentage when we only have that', () => {
    const values = fuelTileValues({
      fuel: { litres: null, pct: { value: 98 }, tankL: 365 },
    });
    expect(values.main).toEqual({ kind: 'pct', value: 98 });
  });

  it('has no main value when we have neither', () => {
    const values = fuelTileValues({ fuel: { litres: null, pct: null, tankL: null } });
    expect(values.main).toBeNull();
  });
});

describe('defTileValues', () => {
  it('shows the percentage and the litres', () => {
    const values = defTileValues({
      def: { pct: { value: 60.8 }, litres: { value: 14.6 }, tankL: 24, tankSource: 'VENDOR' },
    });
    expect(values.main).toEqual({ kind: 'pct', value: 60.8 });
    expect(values.secondary).toBe('14.6 L of 24 L');
    expect(values.learned).toBe(false);
  });

  it('says the litres are learned when the tank is not known yet', () => {
    const values = defTileValues({
      def: { pct: { value: 60.8 }, litres: { value: 14.6 }, tankL: null, tankSource: null },
    });
    expect(values.secondary).toBe('Litres after the first DEF top-up');
    expect(values.learned).toBe(true);
  });

  it('has no main value when the percentage is unknown', () => {
    const values = defTileValues({ def: { pct: null, litres: null, tankL: null } });
    expect(values.main).toBeNull();
  });
});

describe('trafficWord', () => {
  it('says light, normal and heavy', () => {
    expect(trafficWord('LIGHT')).toBe('light');
    expect(trafficWord('USUAL')).toBe('normal');
    expect(trafficWord('HEAVY')).toBe('heavy');
  });

  it('says nothing when there is no traffic reading', () => {
    expect(trafficWord(null)).toBeNull();
  });
});
