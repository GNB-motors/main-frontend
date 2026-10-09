import { describe, it, expect } from 'vitest';
import {
  tripDropNote,
  typeLabel,
  suggestion,
  impactSummary,
  gateRows,
  minutesLabel,
  confidencePct,
  endpointLabel,
  isImpactGate,
  messageOf,
  effectiveType,
  placeState,
  placeTitle,
  placeSubtitle,
  evidenceLines,
  purposeShares,
  placeStats,
  filterPlaces,
  groupBreaks,
  boundsOf,
  bboxAround,
  hoursLabel,
  kmLabel,
  aType,
  riskSentence,
} from './placeIntelligenceModel';

describe('placeIntelligenceModel', () => {
  it('labels known and unknown types', () => {
    expect(typeLabel('FUEL_PUMP')).toBe('Fuel pump');
    expect(typeLabel('NEW_THING')).toBe('new thing');
    expect(typeLabel(null)).toBe('Unknown');
  });

  it('only suggests a type when the engine is more than guessing', () => {
    expect(
      suggestion({
        site: { engine: { siteType: 'FUEL_PUMP', evidenceLevel: 'LIKELY', confidence: 0.61 } },
      }),
    ).toEqual({
      siteType: 'FUEL_PUMP',
      confidence: 61,
      level: 'LIKELY',
    });
    expect(
      suggestion({ site: { engine: { siteType: 'FUEL_PUMP', evidenceLevel: 'UNCORROBORATED' } } }),
    ).toBeNull();
    expect(
      suggestion({ site: { engine: { siteType: 'UNKNOWN', evidenceLevel: 'LIKELY' } } }),
    ).toBeNull();
    expect(suggestion({ site: {} })).toBeNull();
  });

  it('explains warehouse impact in plain words', () => {
    expect(impactSummary({ openTripsAffected: 0, frozenTripsUnaffected: 0, vehicles: 0 })).toBe(
      'No open trips use this place.',
    );
    const s = impactSummary({ openTripsAffected: 2, frozenTripsUnaffected: 5, vehicles: 1 });
    expect(s).toMatch(/2 open trips of 1 vehicle may re-anchor/);
    expect(s).toMatch(/trip cost does not/);
    expect(s).toMatch(/5 closed-tour trips stay frozen/);
  });

  it('lists every reader gate, missing ones as not ready', () => {
    const rows = gateRows({ gates: { places: true } });
    expect(rows).toHaveLength(6);
    expect(rows.find((r) => r.reader === 'places').ready).toBe(true);
    expect(rows.find((r) => r.reader === 'segmentation').ready).toBe(false);
  });

  it('keeps real site names and translates bare types', () => {
    expect(endpointLabel('Howrah Yard')).toBe('Howrah Yard');
    expect(endpointLabel('FUEL_PUMP')).toBe('Fuel pump');
    expect(endpointLabel(null)).toBe('—');
  });

  it('recognises the warehouse impact gate and reads typed error messages', () => {
    expect(isImpactGate({ status: 409, body: { impact: { openTripsAffected: 1 } } })).toBe(true);
    expect(isImpactGate({ status: 409, body: { message: 'conflict' } })).toBe(false);
    expect(isImpactGate({ status: 404 })).toBe(false);
    expect(messageOf({ displayMessage: 'Site not found' }, 'x')).toBe('Site not found');
    expect(messageOf(null, 'fallback')).toBe('fallback');
  });

  it('formats minutes and confidence', () => {
    expect(minutesLabel(45)).toBe('45 min');
    expect(minutesLabel(125)).toBe('2 h 5 min');
    expect(minutesLabel(120)).toBe('2 h');
    expect(minutesLabel(null)).toBe('—');
    expect(confidencePct(0.456)).toBe(46);
  });

  it('shows the manager’s answer first, then the engine, its lean, then legacy', () => {
    expect(
      effectiveType({
        status: 'CONFIRMED',
        siteType: 'WAREHOUSE',
        engine: { siteType: 'PARKING' },
      }),
    ).toEqual({ type: 'WAREHOUSE', source: 'you' });
    // A Kaaran-confirmed place carries no type — the engine's answer fills it.
    expect(
      effectiveType({
        status: 'CONFIRMED',
        siteType: 'UNKNOWN',
        engine: { siteType: 'UNLOADING' },
      }),
    ).toEqual({ type: 'UNLOADING', source: 'engine' });
    expect(
      effectiveType({
        status: 'PROPOSED',
        siteType: 'UNKNOWN',
        engine: { siteType: 'UNKNOWN', leaning: 'DHABA' },
      }),
    ).toEqual({ type: 'DHABA', source: 'leaning' });
    expect(effectiveType({ status: 'PROPOSED', siteType: 'VEHICLE_HABIT' })).toEqual({
      type: 'VEHICLE_HABIT',
      source: 'legacy',
    });
    expect(
      effectiveType({
        status: 'PROPOSED',
        siteType: 'UNEXPLAINED',
        engine: { siteType: 'UNKNOWN' },
      }).type,
    ).toBe('UNKNOWN');
  });

  it('names states in plain words with reserved tones', () => {
    expect(placeState({ status: 'PROPOSED' })).toMatchObject({ key: 'review', tone: 'warn' });
    expect(placeState({ status: 'CONFIRMED' })).toMatchObject({ label: 'Confirmed', tone: 'ok' });
    expect(
      placeState({ status: 'CONFIRMED', engine: { evidenceLevel: 'CONFLICT' } }).label,
    ).toMatch(/disagrees/);
    expect(placeState({ status: 'REJECTED' })).toMatchObject({ label: 'Not a place' });
  });

  it('titles a place by name, else by type and town — never by raw status', () => {
    expect(placeTitle({ name: 'Howrah Yard' })).toBe('Howrah Yard');
    expect(
      placeTitle({
        status: 'PROPOSED',
        engine: { siteType: 'FUEL_PUMP' },
        address: { locality: 'Kolaghat' },
      }),
    ).toBe('Fuel pump, Kolaghat');
    expect(placeTitle({ status: 'PROPOSED', siteType: 'UNEXPLAINED' })).toBe('Unnamed stop');
    expect(placeSubtitle({ address: { formatted: 'AH45, Kolaghat' } })).toBe('AH45, Kolaghat');
    expect(placeSubtitle({ centroidLat: 22.35, centroidLng: 87.25 })).toBe('22.3500, 87.2500');
  });

  it('turns engine evidence into sentences, hard proof first', () => {
    const lines = evidenceLines({
      evidence: [
        { purpose: 'LOAD', group: 'G1', stops: 5 },
        { purpose: 'FUEL', group: 'G5', stops: 28 },
        { purpose: 'FUEL', group: 'G2', stops: 1 },
        { purpose: 'OTHER', group: 'G1', stops: 0 },
      ],
      unexplainedStops: 4,
    });
    expect(lines.map((l) => l.text)).toEqual([
      'Tank level rose on 1 stop',
      '28 fuel bills were logged here',
      '5 stops had the length and hours of loading',
      '4 stops nothing explains',
    ]);
    expect(lines.map((l) => l.kind)).toEqual(['sensor', 'record', 'pattern', 'gap']);
    expect(evidenceLines(null)).toEqual([]);
  });

  it('shares out what trucks do here and drops slivers', () => {
    const shares = purposeShares({ purposeAlpha: { FUEL: 90, LOAD: 8, REST: 2 } });
    expect(shares.map((s) => s.purpose)).toEqual(['FUEL', 'LOAD']);
    expect(shares[0].share).toBeCloseTo(0.9);
    expect(purposeShares({})).toEqual([]);
    // Nine equal shares is the prior, not a pattern.
    const flat = Object.fromEntries(
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map((k) => [k, 0.5]),
    );
    expect(purposeShares({ purposeAlpha: flat })).toEqual([]);
  });

  it('prefers engine stats and falls back to legacy fields', () => {
    expect(
      placeStats({ visitCount: 3, engine: { stats: { visits: 56, trucks: 4 } } }),
    ).toMatchObject({ visits: 56, trucks: 4 });
    expect(placeStats({ visitCount: 3, medianDwellMin: 9 })).toMatchObject({
      visits: 3,
      medianDwellMin: 9,
      trucks: null,
    });
  });

  it('filters by status, risk and free text', () => {
    const sites = [
      { _id: 'a', status: 'CONFIRMED', name: 'Howrah Yard' },
      {
        _id: 'b',
        status: 'PROPOSED',
        engine: { siteType: 'FUEL_PUMP' },
        risk: { theftIncidents: 3 },
      },
      { _id: 'c', status: 'REJECTED', name: 'Ghost' },
    ];
    expect(filterPlaces(sites, 'all').map((s) => s._id)).toEqual(['a', 'b']);
    expect(filterPlaces(sites, 'confirmed').map((s) => s._id)).toEqual(['a']);
    expect(filterPlaces(sites, 'risk').map((s) => s._id)).toEqual(['b']);
    expect(filterPlaces(sites, 'rejected').map((s) => s._id)).toEqual(['c']);
    expect(filterPlaces(sites, 'all', 'fuel').map((s) => s._id)).toEqual(['b']);
  });

  it('groups unproductive stops by place, worst first', () => {
    const groups = groupBreaks([
      {
        _id: '1',
        orgSiteId: 's1',
        registrationNumber: 'A',
        dwellMinutes: 50,
        lat: 22,
        lng: 88,
        startAt: '2026-09-01',
      },
      {
        _id: '2',
        orgSiteId: 's1',
        registrationNumber: 'B',
        dwellMinutes: 40,
        lat: 22,
        lng: 88,
        startAt: '2026-09-02',
        humanReason: { purpose: 'REST' },
      },
      {
        _id: '3',
        registrationNumber: 'A',
        dwellMinutes: 60,
        lat: 23.00001,
        lng: 87,
        startAt: '2026-09-03',
      },
    ]);
    expect(groups.map((g) => g.key)).toEqual(['site:s1', 'cell:23.000,87.000']);
    expect(groups[0]).toMatchObject({ minutes: 90, trucks: ['A', 'B'], answered: 1 });
    expect(groups[0].stops.map((s) => s._id)).toEqual(['2', '1']);
  });

  it('fits bounds and builds a capped bbox for the global layer', () => {
    expect(boundsOf([])).toBeNull();
    expect(
      boundsOf([
        { lat: 1, lng: 2 },
        { lat: 3, lng: 0 },
      ]),
    ).toEqual({ north: 3, south: 1, east: 2, west: 0 });
    expect(bboxAround([{ lat: 22, lng: 88 }], 0.5)).toBe('87.5000,21.5000,88.5000,22.5000');
    const wide = bboxAround([
      { lat: 10, lng: 70 },
      { lat: 30, lng: 90 },
    ])
      .split(',')
      .map(Number);
    expect(wide[2] - wide[0]).toBeLessThanOrEqual(5);
    expect(wide[3] - wide[1]).toBeLessThanOrEqual(5);
  });

  it('words fuel risk with correct plurals', () => {
    expect(riskSentence({})).toBeNull();
    expect(riskSentence({ theftIncidents: 1 })).toMatch(/^1 fuel theft report here\./);
    expect(
      riskSentence({ theftIncidents: 3, unauthRefuelIncidents: 2, lastIncidentAt: 'D' }),
    ).toMatch(/^3 fuel theft reports and 2 unauthorised refuels here, last on D\./);
  });

  it('puts the right article before a type', () => {
    expect(aType('UNLOADING')).toBe('an unloading point');
    expect(aType('FUEL_PUMP')).toBe('a fuel pump');
  });

  it('formats hours and km, never inventing a zero', () => {
    expect(hoursLabel(1296)).toBe('21.6 h');
    expect(hoursLabel(7200)).toBe('120 h');
    expect(hoursLabel(90)).toBe('1.5 h');
    expect(kmLabel(null)).toBe('—');
    expect(kmLabel(48.3)).toBe('48 km');
    expect(kmLabel(4.25)).toBe('4.3 km');
  });
});

describe('tripDropNote', () => {
  it('asks about the place auto trips turned around at', () => {
    expect(tripDropNote({ tripDrops: { trips: 9, from: ['AMBUJA SANKRAIL'] } })).toBe(
      '9 trips from AMBUJA SANKRAIL turned around here — is this a drop?',
    );
    expect(tripDropNote({ tripDrops: { trips: 1, from: [] } })).toBe(
      '1 trip turned around here — is this a drop?',
    );
    expect(tripDropNote({})).toBeNull();
  });
});
