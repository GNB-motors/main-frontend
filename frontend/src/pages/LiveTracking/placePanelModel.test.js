import { describe, it, expect } from 'vitest';
import { placeApiId, isOurPlace, placePanelStats } from './placePanelModel.js';

describe('place ids', () => {
  it('strips the source prefix the APIs do not know', () => {
    expect(placeApiId({ source: 'site', sourceId: 'site:abc' })).toBe('abc');
    expect(placeApiId({ source: 'warehouse', sourceId: 'warehouse:w1' })).toBe('w1');
    expect(placeApiId({ source: 'zone', sourceId: 'zone:z1' })).toBe('z1');
  });

  it('leaves a bare id alone and has no answer for nothing', () => {
    expect(placeApiId({ id: 'abc' })).toBe('abc');
    expect(placeApiId(null)).toBeNull();
    expect(placeApiId({})).toBeNull();
  });
});

describe('our places', () => {
  it('claims a warehouse, a zone and a confirmed site', () => {
    expect(isOurPlace({ source: 'warehouse' })).toBe(true);
    expect(isOurPlace({ source: 'zone' })).toBe(true);
    expect(isOurPlace({ source: 'site', status: 'CONFIRMED' })).toBe(true);
  });

  it('leaves a proposed site and map landmarks to the map', () => {
    expect(isOurPlace({ source: 'site', status: 'PROPOSED' })).toBe(false);
    expect(isOurPlace({ source: 'landmark', type: 'FUEL_STATION' })).toBe(false);
    expect(isOurPlace({ type: 'SITE' })).toBe(true);
    expect(isOurPlace(null)).toBe(false);
  });
});

describe('place stats', () => {
  it('prefers the site report', () => {
    const stats = placePanelStats(
      { raw: { visitCount: 3 } },
      { visits: 41, vehicles: 7, dwellP50Min: 55 },
    );
    expect(stats.visits).toBe(41);
    expect(stats.vehicles).toBe(7);
    expect(stats.usualDwellMin).toBe(55);
  });

  it('falls back to what the place record carries', () => {
    const stats = placePanelStats({
      raw: { visitCount: 3, distinctVehicleCount: 2, medianDwellMin: 25 },
    });
    expect(stats.visits).toBe(3);
    expect(stats.vehicles).toBe(2);
    expect(stats.usualDwellMin).toBe(25);
  });

  it('has no answer rather than a zero when nothing is known', () => {
    const stats = placePanelStats({ raw: null });
    expect(stats.visits).toBeNull();
    expect(stats.vehicles).toBeNull();
    expect(stats.usualDwellMin).toBeNull();
  });
});
