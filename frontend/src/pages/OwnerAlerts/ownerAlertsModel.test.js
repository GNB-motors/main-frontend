// Tests for ownerAlertsModel — pure view/summary logic extracted from
// OwnerAlertsPage (rule 21). Run as TZ=UTC; the model pins Asia/Kolkata itself.
import { describe, it, expect } from 'vitest';
import {
  computeView,
  buildSummary,
  cleanMsg,
  formatIST,
  formatRelativeIST,
  sevOf,
  catOf,
  titleOf,
  LIMIT,
  CHIPS,
  SINCE,
  SORTS,
} from './ownerAlertsModel.js';

const mk = (over) => ({
  id: over.id,
  type: over.type,
  at: over.at,
  acknowledged: over.acknowledged ?? false,
  vehicleNumber: over.vehicleNumber ?? null,
  message: over.message ?? '',
});

// Four severities/categories covered: CRITICAL, WARNING (subscription),
// WARNING (data), INFO. Mixed ack states and vehicles for sort tests.
const ALERTS = [
  mk({
    id: 'a1',
    type: 'FUEL_SIPHON_SUSPECTED',
    at: '2026-09-01T10:00:00Z',
    vehicleNumber: 'KA01AB1234',
  }),
  mk({ id: 'a2', type: 'FLEETEDGE_SUBSCRIPTION_EXPIRED', at: '2026-09-02T10:00:00Z' }),
  mk({
    id: 'a3',
    type: 'REFUEL_ESTIMATED',
    at: '2026-09-03T10:00:00Z',
    vehicleNumber: 'KA01AB1234',
    acknowledged: true,
  }),
  mk({
    id: 'a4',
    type: 'FLEETEDGE_ALERT_OVERSPEED',
    at: '2026-09-04T10:00:00Z',
    vehicleNumber: 'MH02CD5678',
  }),
  mk({ id: 'a5', type: 'EV_LOW_SOC', at: '2026-09-05T10:00:00Z' }),
];

describe('enrichment', () => {
  it('maps severity, category, title and typeLabel onto each alert', () => {
    const view = computeView(ALERTS, 'all', 'newest');
    const siphon = view.find((a) => a.id === 'a1');
    expect(siphon.severity).toBe('CRITICAL');
    expect(siphon.category).toBe('other');
    expect(siphon.title).toBe('Fuel loss suspected');
    expect(siphon.typeLabel).toBe('Fuel loss — please review');
    const sub = view.find((a) => a.id === 'a2');
    expect(sub.category).toBe('subscription');
    expect(sub.title).toBe('Subscription expired');
  });

  it('adds absolute and relative IST timestamps', () => {
    const view = computeView(ALERTS, 'all', 'newest');
    const a1 = view.find((a) => a.id === 'a1');
    expect(a1.detectedAbs).toMatch(/IST$/);
    expect(a1.detectedRel).toBeTruthy();
  });

  it('does not mutate the input array or its items', () => {
    const before = JSON.parse(JSON.stringify(ALERTS));
    const order = ALERTS.map((a) => a.id);
    computeView(ALERTS, 'critical', 'vehicle');
    expect(ALERTS.map((a) => a.id)).toEqual(order);
    expect(ALERTS).toEqual(before);
  });
});

describe('computeView refine branches', () => {
  const ids = (list) => list.map((a) => a.id);

  it('all returns every alert', () => {
    expect(computeView(ALERTS, 'all', 'newest')).toHaveLength(5);
  });

  it('critical keeps only CRITICAL', () => {
    const view = computeView(ALERTS, 'critical', 'newest');
    expect(ids(view)).toEqual(['a1']);
  });

  it('warning keeps only WARNING', () => {
    const view = computeView(ALERTS, 'warning', 'newest');
    expect(ids(view).sort()).toEqual(['a2', 'a4', 'a5']);
  });

  it('subscription keeps only the subscription category', () => {
    const view = computeView(ALERTS, 'subscription', 'newest');
    expect(ids(view)).toEqual(['a2']);
  });

  it('data keeps only the data category', () => {
    const view = computeView(ALERTS, 'data', 'newest');
    expect(ids(view)).toEqual(['a3']);
  });
});

describe('computeView sort branches', () => {
  const ids = (list) => list.map((a) => a.id);

  it('newest sorts by date descending', () => {
    expect(ids(computeView(ALERTS, 'all', 'newest'))).toEqual(['a5', 'a4', 'a3', 'a2', 'a1']);
  });

  it('oldest sorts by date ascending', () => {
    expect(ids(computeView(ALERTS, 'all', 'oldest'))).toEqual(['a1', 'a2', 'a3', 'a4', 'a5']);
  });

  it('vehicle sorts by vehicle number, missing numbers last', () => {
    const view = computeView(ALERTS, 'all', 'vehicle');
    const withVehicles = view.filter((a) => a.vehicleNumber).map((a) => a.vehicleNumber);
    expect(withVehicles).toEqual([...withVehicles].sort((x, y) => x.localeCompare(y)));
    expect(view.slice(withVehicles.length).every((a) => !a.vehicleNumber)).toBe(true);
  });

  it('triage (default) orders unacknowledged first, then severity, then newest', () => {
    // a3 is acknowledged INFO -> always last. Among the rest: a1 CRITICAL first,
    // then WARNINGs by date desc (a5, a4, a2). EV_LOW_SOC is WARNING, not INFO.
    expect(ids(computeView(ALERTS, 'all', 'triage'))).toEqual(['a1', 'a5', 'a4', 'a2', 'a3']);
  });

  it('triage puts severity ahead of recency within the same ack state', () => {
    const alerts = [
      mk({ id: 'old-crit', type: 'FUEL_SIPHON_SUSPECTED', at: '2026-09-01T10:00:00Z' }),
      mk({ id: 'new-warn', type: 'EV_LOW_SOC', at: '2026-09-05T10:00:00Z' }),
    ];
    expect(computeView(alerts, 'all', 'triage').map((a) => a.id)).toEqual(['old-crit', 'new-warn']);
  });
});

describe('buildSummary', () => {
  it('derives counts from the page of alerts plus the server unacknowledged count', () => {
    const s = buildSummary(ALERTS, 12);
    expect(s.toReview).toBe(12);
    expect(s.critical).toBe(1);
    expect(s.subscription).toBe(1);
    expect(s.vehicles).toBe(2); // KA01AB1234, MH02CD5678
  });

  it('counts unique vehicles only', () => {
    const alerts = [
      mk({ id: 'x1', type: 'EV_LOW_SOC', vehicleNumber: 'KA01AB1234' }),
      mk({ id: 'x2', type: 'EV_LOW_SOC', vehicleNumber: 'KA01AB1234' }),
    ];
    expect(buildSummary(alerts, 0).vehicles).toBe(1);
  });
});

describe('small helpers', () => {
  it('cleanMsg strips the "Please review:" prefix, case-insensitive', () => {
    expect(cleanMsg('Please review: fuel drop')).toBe('fuel drop');
    expect(cleanMsg('please review:  fuel drop')).toBe('fuel drop');
    expect(cleanMsg('no prefix')).toBe('no prefix');
    expect(cleanMsg(null)).toBe('');
  });

  it('formatIST pins Asia/Kolkata regardless of process TZ', () => {
    expect(formatIST('2026-09-01T10:00:00Z')).toBe('01 Sep 2026, 03:30 PM IST');
    expect(formatIST(null)).toBe('—');
  });

  it('formatRelativeIST returns null for missing input', () => {
    expect(formatRelativeIST(null)).toBeNull();
  });

  it('sevOf/catOf/titleOf fall back sensibly for unknown types', () => {
    expect(sevOf('NOPE')).toBe('WARNING');
    expect(catOf('NOPE')).toBe('other');
    expect(titleOf('NOPE')).toBe('NOPE');
  });

  it('exports the constants the page consumes', () => {
    expect(LIMIT).toBe(20);
    expect(CHIPS.map((c) => c.key)).toContain('acknowledged');
    expect(SINCE.map((s) => s.key)).toContain('30');
    expect(SORTS.map((s) => s.key)).toContain('triage');
  });
});
