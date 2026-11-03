import { describe, it, expect, vi } from 'vitest';
import { googleMapsUrl, openInGoogleMaps } from './googleMapsLink';

describe('googleMapsUrl', () => {
  it('prefers lat,lng as the query', () => {
    expect(googleMapsUrl({ lat: 28.6139, lng: 77.209, name: 'Delhi' })).toBe(
      'https://www.google.com/maps/search/?api=1&query=28.6139%2C77.209',
    );
  });

  it('falls back to the encoded name when coordinates are missing', () => {
    expect(googleMapsUrl({ name: 'Goa Toll Plaza' })).toBe(
      'https://www.google.com/maps/search/?api=1&query=Goa+Toll+Plaza',
    );
  });

  it('adds query_place_id when a placeId is given', () => {
    expect(googleMapsUrl({ lat: 1, lng: 2, placeId: 'ChIJabc' })).toBe(
      'https://www.google.com/maps/search/?api=1&query=1%2C2&query_place_id=ChIJabc',
    );
  });

  it('returns null when there is nothing to search for', () => {
    expect(googleMapsUrl({})).toBeNull();
    expect(googleMapsUrl(null)).toBeNull();
    expect(googleMapsUrl({ placeId: 'ChIJabc' })).toBeNull();
  });
});

describe('openInGoogleMaps', () => {
  it('opens a new tab with noopener and does nothing without a target', () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    expect(openInGoogleMaps({ lat: 1, lng: 2 })).toBe(true);
    expect(open).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=1%2C2',
      '_blank',
      'noopener,noreferrer',
    );
    open.mockClear();
    expect(openInGoogleMaps({})).toBe(false);
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });
});
