import { describe, it, expect } from 'vitest';
import {
  toIST,
  formatIST,
  formatRelativeIST,
  sevOf,
  catOf,
  titleOf,
  cleanMsg,
  computeView,
  buildSummary,
  CHIPS,
  SINCE,
  SORTS,
} from './ownerAlertsModel';

describe('ownerAlertsModel', () => {
  describe('date helpers', () => {
    it('toIST returns a dayjs object in Asia/Kolkata or null', () => {
      expect(toIST(null)).toBeNull();
      expect(toIST(undefined)).toBeNull();
      const d = toIST('2026-09-06T12:00:00Z');
      expect(d).not.toBeNull();
      // UTC 12:00 -> IST 17:30
      expect(d.format('HH:mm')).toBe('17:30');
    });

    it('formatIST returns formatted IST string or dash', () => {
      expect(formatIST(null)).toBe('—');
      expect(formatIST('2026-09-06T12:00:00Z')).toBe('06 Sep 2026, 05:30 PM IST');
    });

    it('formatRelativeIST returns fromNow string or null', () => {
      expect(formatRelativeIST(null)).toBeNull();
      expect(typeof formatRelativeIST('2026-09-06T12:00:00Z')).toBe('string');
    });
  });

  describe('alert metadata helpers', () => {
    it('sevOf maps alert types to severity', () => {
      expect(sevOf('FUEL_SIPHON_SUSPECTED')).toBe('CRITICAL');
      expect(sevOf('FLEETEDGE_ALERT_FUEL_DRAIN')).toBe('CRITICAL');
      expect(sevOf('FLEETEDGE_SUBSCRIPTION_EXPIRED')).toBe('WARNING');
      expect(sevOf('FLEETEDGE_ALERT_REFUEL')).toBe('INFO');
      expect(sevOf('UNKNOWN_ALERT_TYPE')).toBe('WARNING');
    });

    it('catOf categorizes alert types', () => {
      expect(catOf('FLEETEDGE_SUBSCRIPTION_EXPIRED')).toBe('subscription');
      expect(catOf('FLEETEDGE_REAUTH_REQUIRED')).toBe('data');
      expect(catOf('FUEL_SIPHON_SUSPECTED')).toBe('other');
    });

    it('titleOf resolves alert titles or falls back to label/type', () => {
      expect(titleOf('FLEETEDGE_SUBSCRIPTION_EXPIRED')).toBe('Subscription expired');
      expect(titleOf('FUEL_SIPHON_SUSPECTED')).toBe('Fuel loss suspected');
      expect(titleOf('CUSTOM_NEW_TYPE')).toBe('CUSTOM_NEW_TYPE');
    });

    it('cleanMsg strips leading "Please review:"', () => {
      expect(cleanMsg('Please review: Tank level dropped suddenly')).toBe(
        'Tank level dropped suddenly',
      );
      expect(cleanMsg('please review: speed exceeded')).toBe('speed exceeded');
      expect(cleanMsg('Normal message')).toBe('Normal message');
      expect(cleanMsg('')).toBe('');
    });
  });

  describe('computeView', () => {
    const mockAlerts = [
      {
        id: '1',
        type: 'FLEETEDGE_ALERT_REFUEL',
        at: '2026-09-06T10:00:00Z',
        vehicleNumber: 'KA01AB1234',
        acknowledged: false,
      },
      {
        id: '2',
        type: 'FUEL_SIPHON_SUSPECTED',
        at: '2026-09-06T12:00:00Z',
        vehicleNumber: 'MH02CD5678',
        acknowledged: false,
      },
      {
        id: '3',
        type: 'FLEETEDGE_SUBSCRIPTION_EXPIRED',
        at: '2026-09-06T08:00:00Z',
        vehicleNumber: 'DL01EF9999',
        acknowledged: true,
      },
      {
        id: '4',
        type: 'FLEETEDGE_REAUTH_REQUIRED',
        at: '2026-09-06T09:00:00Z',
        vehicleNumber: 'KA01AB1234',
        acknowledged: false,
      },
    ];

    it('enriches alerts with severity, category, title, detectedRel, and detectedAbs', () => {
      const view = computeView(mockAlerts, 'all', 'newest');
      expect(view).toHaveLength(4);
      expect(view[0].detectedAbs).toContain('IST');
      expect(view.find((a) => a.id === '2').severity).toBe('CRITICAL');
    });

    it('filters by critical refine', () => {
      const view = computeView(mockAlerts, 'critical', 'newest');
      expect(view).toHaveLength(1);
      expect(view[0].id).toBe('2');
    });

    it('filters by warning refine', () => {
      const view = computeView(mockAlerts, 'warning', 'newest');
      expect(view).toHaveLength(2);
      expect(view.map((a) => a.id)).toEqual(expect.arrayContaining(['3', '4']));
    });

    it('filters by subscription refine', () => {
      const view = computeView(mockAlerts, 'subscription', 'newest');
      expect(view).toHaveLength(1);
      expect(view[0].id).toBe('3');
    });

    it('filters by data refine', () => {
      const view = computeView(mockAlerts, 'data', 'newest');
      expect(view).toHaveLength(1);
      expect(view[0].id).toBe('4');
    });

    it('sorts by newest', () => {
      const view = computeView(mockAlerts, 'all', 'newest');
      expect(view[0].id).toBe('2'); // 12:00
      expect(view[view.length - 1].id).toBe('3'); // 08:00
    });

    it('sorts by oldest', () => {
      const view = computeView(mockAlerts, 'all', 'oldest');
      expect(view[0].id).toBe('3'); // 08:00
      expect(view[view.length - 1].id).toBe('2'); // 12:00
    });

    it('sorts by vehicle', () => {
      const view = computeView(mockAlerts, 'all', 'vehicle');
      expect(view[0].vehicleNumber).toBe('DL01EF9999');
      expect(view[view.length - 1].vehicleNumber).toBe('MH02CD5678');
    });

    it('sorts by triage (unacknowledged first, highest severity first)', () => {
      const view = computeView(mockAlerts, 'all', 'triage');
      // id: 2 is CRITICAL and unacknowledged
      expect(view[0].id).toBe('2');
      // id: 3 is acknowledged, should be last
      expect(view[view.length - 1].id).toBe('3');
    });
  });

  describe('buildSummary', () => {
    it('summarizes unacknowledged, critical, subscription, and affected vehicles', () => {
      const alerts = [
        { type: 'FUEL_SIPHON_SUSPECTED', vehicleNumber: 'KA01' },
        { type: 'FLEETEDGE_SUBSCRIPTION_EXPIRED', vehicleNumber: 'KA01' },
        { type: 'FLEETEDGE_ALERT_REFUEL', vehicleNumber: 'MH02' },
      ];
      const summary = buildSummary(alerts, 5);
      expect(summary).toEqual({
        toReview: 5,
        critical: 1,
        subscription: 1,
        vehicles: 2,
      });
    });
  });

  describe('constants', () => {
    it('defines chips, since, and sorts options', () => {
      expect(CHIPS.length).toBeGreaterThan(0);
      expect(SINCE.length).toBeGreaterThan(0);
      expect(SORTS.length).toBeGreaterThan(0);
    });
  });
});
