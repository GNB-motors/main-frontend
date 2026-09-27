import { describe, it, expect } from 'vitest';
import {
  typeLabel,
  suggestion,
  impactSummary,
  gateRows,
  minutesLabel,
  confidencePct,
  endpointLabel,
  isImpactGate,
  messageOf,
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
});
