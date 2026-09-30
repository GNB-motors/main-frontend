import { describe, it, expect } from 'vitest';
import {
  canAddPlaces,
  placesProblem,
  clampRadius,
  canSaveNewPlace,
  declarePayload,
  suggestedName,
  placeMapUrl,
  DEFAULT_RADIUS_M,
} from './doPlaces.js';

describe('canAddPlaces', () => {
  it('lets the roles that can create a depot add places', () => {
    expect(canAddPlaces('OWNER')).toBe(true);
    expect(canAddPlaces('MANAGER')).toBe(true);
    expect(canAddPlaces('SUPER_ADMIN')).toBe(true);
  });

  it('keeps KAM and ops to picking saved places', () => {
    expect(canAddPlaces('KAM')).toBe(false);
    expect(canAddPlaces('OPS_EXECUTIVE')).toBe(false);
    expect(canAddPlaces(null)).toBe(false);
  });
});

describe('placesProblem', () => {
  it('asks for each missing end in order', () => {
    expect(placesProblem({})).toBe('Choose the pickup point');
    expect(placesProblem({ pickupSiteId: 'a' })).toBe('Choose the drop point');
  });

  it('refuses the same place at both ends', () => {
    expect(placesProblem({ pickupSiteId: 'a', dropSiteId: 'a' })).toMatch(/different/);
  });

  it('is null when both ends are set and differ', () => {
    expect(placesProblem({ pickupSiteId: 'a', dropSiteId: 'b' })).toBeNull();
  });
});

describe('new place', () => {
  const pin = { lat: 27.4728, lng: 94.912, address: 'Balaji Plant, NH-37, Dibrugarh' };

  it('needs a name and a pin', () => {
    expect(canSaveNewPlace({ name: 'Balaji', location: pin })).toBe(true);
    expect(canSaveNewPlace({ name: 'B', location: pin })).toBe(false);
    expect(canSaveNewPlace({ name: 'Balaji', location: null })).toBe(false);
  });

  it('keeps the fence inside what the server accepts', () => {
    expect(clampRadius(10)).toBe(50);
    expect(clampRadius(9000)).toBe(5000);
    expect(clampRadius('abc')).toBe(DEFAULT_RADIUS_M);
  });

  it('builds the declare body from the form', () => {
    expect(declarePayload({ name: '  Balaji Plant ', location: pin, radiusM: '750' })).toEqual({
      name: 'Balaji Plant',
      lat: 27.4728,
      lng: 94.912,
      radiusM: 750,
      address: 'Balaji Plant, NH-37, Dibrugarh',
    });
  });

  it('suggests a name from the picked address', () => {
    expect(suggestedName(pin)).toBe('Balaji Plant');
    expect(suggestedName(null)).toBe('');
  });
});

describe('placeMapUrl', () => {
  it('links a populated site to its pin', () => {
    expect(placeMapUrl({ centroidLat: 27.47, centroidLng: 94.91 })).toBe(
      'https://www.google.com/maps?q=27.47,94.91',
    );
  });

  it('is null for a bare id or an older DO without points', () => {
    expect(placeMapUrl('6abd...')).toBeNull();
    expect(placeMapUrl(null)).toBeNull();
  });
});
