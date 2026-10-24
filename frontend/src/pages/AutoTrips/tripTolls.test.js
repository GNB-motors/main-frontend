import { describe, expect, it } from 'vitest';
import {
  fareText,
  justPassed,
  tollClassText,
  tollMarks,
  tollSummary,
  withTollPasses,
} from './tripTolls';

const pass = (iso, extra = {}) => ({
  at: iso,
  lat: 22.6988,
  lng: 88.2888,
  placeId: 'p1',
  name: 'Dankuni Toll Plaza',
  fareInr: 410,
  ...extra,
});

const plan = {
  items: [
    {
      type: 'step',
      id: 'pickup',
      kind: 'loading',
      at: '2026-10-20T04:00:00Z',
      leftAt: '2026-10-20T06:00:00Z',
    },
    { type: 'leg', id: 'leg-s1', driveMin: 60 },
    {
      type: 'step',
      id: 's1',
      kind: 'unknown',
      at: '2026-10-20T07:00:00Z',
      leftAt: '2026-10-20T07:20:00Z',
    },
    { type: 'leg', id: 'leg-d', driveMin: 120 },
    {
      type: 'step',
      id: 'd',
      kind: 'drop',
      at: '2026-10-20T09:20:00Z',
      leftAt: '2026-10-20T10:00:00Z',
    },
  ],
};

describe('withTollPasses', () => {
  it('puts a drive-through pass between the drive and the stop that came after it', () => {
    const out = withTollPasses(plan, [pass('2026-10-20T08:30:00Z')]);
    expect(out.items.map((it) => (it.type === 'toll' ? 'toll' : it.id))).toEqual([
      'pickup',
      'leg-s1',
      's1',
      'leg-d',
      'toll',
      'd',
    ]);
    expect(out.items[4].playAt).toBe('2026-10-20T08:30:00Z');
  });

  it('a pass while the truck stood at a stop belongs to that stop', () => {
    const out = withTollPasses(plan, [pass('2026-10-20T07:10:00Z')]);
    expect(out.items.filter((it) => it.type === 'toll')).toHaveLength(0);
    expect(out.items.find((it) => it.id === 's1').tollPass.name).toBe('Dankuni Toll Plaza');
  });

  it('never folds a pass into the plant or the drop, and keeps passes after the last step', () => {
    const out = withTollPasses(plan, [pass('2026-10-20T09:25:00Z'), pass('2026-10-20T11:00:00Z')]);
    expect(out.items.slice(-2).map((it) => it.type)).toEqual(['toll', 'toll']);
    expect(out.items.find((it) => it.id === 'd').tollPass).toBeUndefined();
  });

  it('leaves the plan untouched with no passes', () => {
    expect(withTollPasses(plan, [])).toBe(plan);
  });
});

describe('tollSummary and fareText', () => {
  it('counts plazas, the known rupees and the unpriced ones', () => {
    expect(tollSummary({ passes: [{}, {}, {}], total: { inr: 825, priced: 2, unknown: 1 } })).toBe(
      '3 toll plazas · ₹825 · 1 unpriced',
    );
    expect(tollSummary({ passes: [{}], total: null })).toBe('1 toll plaza');
    expect(tollSummary({ status: 'FALLBACK', passes: [{}], total: { inr: 590, priced: 1 } })).toBe(
      '1 toll plaza · ₹590 · road not matched yet',
    );
    expect(tollSummary({ passes: [] })).toBeNull();
  });
  it('an unpriced pass says so instead of ₹0', () => {
    expect(fareText({ fareInr: 410 })).toBe('₹410');
    expect(fareText({ fareInr: 205, fareBasis: 'RETURN' })).toBe('₹205 return');
    expect(fareText({ fareInr: null, unknownReason: 'NO_TOLL_PLACE' })).toBe('fare unknown');
    expect(fareText({})).toBeNull();
  });
});

describe('tollMarks', () => {
  it('marks the plazas the replay has already passed', () => {
    const marks = tollMarks(
      [
        pass('2026-10-20T08:30:00Z'),
        pass('2026-10-20T09:00:00Z', { name: null, evidence: 'GPS', fareInr: null }),
      ],
      '2026-10-20T08:45:00Z',
    );
    expect(marks.map((m) => m.passed)).toEqual([true, false]);
    expect(marks[1].title).toBe('Toll booth · from GPS — road not matched yet');
    expect(new Set(marks.map((m) => m.id)).size).toBe(2);
  });
});

describe('justPassed', () => {
  it('names the plaza the replay crossed in the last few minutes, and nothing after', () => {
    const passes = [pass('2026-10-20T08:30:00Z')];
    expect(justPassed(passes, '2026-10-20T08:32:00Z')).toBe('Dankuni Toll Plaza');
    expect(justPassed(passes, '2026-10-20T08:29:00Z')).toBeNull();
    expect(justPassed(passes, '2026-10-20T08:40:00Z')).toBeNull();
  });
});

describe('tollClassText', () => {
  const tolls = (vehicleGroup) => ({ passes: [{}], total: { inr: 590 }, vehicleGroup });
  it('says what the truck was priced as and where that came from', () => {
    expect(
      tollClassText(tolls({ group: 'axle_4_6', source: 'MODEL_GVW', basis: 'LPT 4830 (48 t)' })),
    ).toBe('priced as 4–6 axle (LPT 4830 (48 t))');
  });
  it('asks for the axle class when nothing on the vehicle places it', () => {
    expect(tollClassText(tolls({ group: null, source: null, basis: 'TATA ACE' }))).toBe(
      'not priced: set this truck’s axle class or model',
    );
  });
  it('says nothing to a driver, who gets no fares', () => {
    expect(tollClassText({ passes: [{}], total: null })).toBeNull();
  });
});
