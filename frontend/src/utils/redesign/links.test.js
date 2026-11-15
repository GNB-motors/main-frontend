import { describe, it, expect } from 'vitest';
import { intelligenceLink, toIstIso, trackLink, tripLink, tripsHistoryLink } from './links';

describe('toIstIso', () => {
  it('keeps the IST wall-clock time and writes the offset', () => {
    expect(toIstIso('2026-11-01T13:00:00Z')).toBe('2026-11-01T18:30:00+05:30');
  });
  it('is null for nothing', () => {
    expect(toIstIso(null)).toBeNull();
  });
});

describe('trackLink', () => {
  it('writes the truck, the range and the playhead', () => {
    const link = trackLink({
      reg: 'WB11J7062',
      from: '2026-11-01T13:00:00Z',
      to: '2026-11-01T14:45:00Z',
      at: '2026-11-01T13:20:12Z',
    });
    expect(link).toBe(
      '/live-tracking?v=WB11J7062&from=2026-11-01T18%3A30%3A00%2B05%3A30' +
        '&to=2026-11-01T20%3A15%3A00%2B05%3A30&at=2026-11-01T18%3A50%3A12%2B05%3A30',
    );
  });
  it('drops what it was not given', () => {
    expect(trackLink({ reg: 'WB11J7062' })).toBe('/live-tracking?v=WB11J7062');
  });
  it('falls back to the plain page', () => {
    expect(trackLink()).toBe('/live-tracking');
  });
});

describe('intelligenceLink', () => {
  it('writes the tab and the vehicle', () => {
    expect(intelligenceLink({ tab: 'vehicles', vehicle: 'WB11L8862' })).toBe(
      '/intelligence?tab=vehicles&vehicle=WB11L8862',
    );
  });
  it('drops empty values', () => {
    expect(intelligenceLink({ tab: 'issues' })).toBe('/intelligence?tab=issues');
  });
  it('falls back to the plain page', () => {
    expect(intelligenceLink()).toBe('/intelligence');
  });
});

describe('tripLink', () => {
  it('writes the trip id', () => {
    expect(tripLink('abc123')).toBe('/auto-trips/abc123');
  });
  it('falls back to the list', () => {
    expect(tripLink(null)).toBe('/auto-trips');
  });
});

describe('tripsHistoryLink', () => {
  it('always asks for the history tab', () => {
    expect(tripsHistoryLink({ site: 'site-1' })).toBe('/auto-trips?tab=history&site=site-1');
  });
});
