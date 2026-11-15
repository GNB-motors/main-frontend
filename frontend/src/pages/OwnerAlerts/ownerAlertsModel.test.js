import { describe, it, expect } from 'vitest';
import {
  formatIST,
  formatRelativeIST,
  severityOf,
  catOf,
  titleOf,
  cleanMsg,
  computeView,
  countsOf,
  viewParams,
  CHIPS,
  SINCE,
  SORTS,
} from './ownerAlertsModel';

describe('ownerAlertsModel', () => {
  describe('date helpers', () => {
    it('formatIST returns formatted IST string or dash', () => {
      expect(formatIST(null)).toBe('—');
      expect(formatIST('2026-09-06T12:00:00Z')).toBe('06 Sep 2026, 05:30 PM IST');
    });

    it('formatRelativeIST returns a relative "ago" string or null', () => {
      expect(formatRelativeIST(null)).toBeNull();
      expect(typeof formatRelativeIST('2026-09-06T12:00:00Z')).toBe('string');
    });
  });

  describe('alert metadata helpers', () => {
    it('severityOf reads the severity the backend sent, and invents none', () => {
      expect(severityOf({ type: 'FUEL_SIPHON_SUSPECTED', severity: 'critical' })).toBe('CRITICAL');
      expect(severityOf({ type: 'FUEL_SIPHON_SUSPECTED', severity: 'WARNING' })).toBe('WARNING');
      // The server before B0b sends no severity: none is guessed from the type.
      expect(severityOf({ type: 'FUEL_SIPHON_SUSPECTED' })).toBeNull();
    });

    it('keeps no severity table in the frontend (F13)', async () => {
      const model = await import('./ownerAlertsModel');
      expect(model.sevOf).toBeUndefined();
      expect(model.SEVERITY_BY_TYPE).toBeUndefined();
    });

    it('calls a warning-level fuel row "Fuel to check", never loss or theft', () => {
      expect(titleOf('FUEL_SIPHON_SUSPECTED', 'WARNING')).toBe('Fuel to check');
      expect(titleOf('FUEL_SIPHON_SUSPECTED', 'CRITICAL')).toBe('Fuel loss suspected');
      expect(titleOf('FUEL_DATA_REVIEW')).not.toMatch(/theft/i);
    });

    it('catOf categorizes alert types', () => {
      expect(catOf('FLEETEDGE_SUBSCRIPTION_EXPIRED')).toBe('subscription');
      expect(catOf('FLEETEDGE_REAUTH_REQUIRED')).toBe('data');
      expect(catOf('FUEL_SIPHON_SUSPECTED')).toBe('other');
      // iALERT codes
      expect(catOf('IALERT_REAUTH_REQUIRED')).toBe('data');
      expect(catOf('IALERT_RELINK_DUE')).toBe('data');
      expect(catOf('IALERT_SUBSCRIPTION_EXPIRED')).toBe('subscription');
      expect(catOf('IALERT_SUBSCRIPTION_EXPIRING')).toBe('subscription');
    });

    it('titleOf resolves alert titles or falls back to label/type', () => {
      expect(titleOf('FLEETEDGE_SUBSCRIPTION_EXPIRED')).toBe('Subscription expired');
      expect(titleOf('FUEL_SIPHON_SUSPECTED')).toBe('Fuel loss suspected');
      expect(titleOf('CUSTOM_NEW_TYPE')).toBe('CUSTOM_NEW_TYPE');
      // iALERT codes
      expect(titleOf('IALERT_REAUTH_REQUIRED')).toBe('iALERT re-connect needed');
      expect(titleOf('IALERT_RELINK_DUE')).toBe('iALERT re-link due');
      expect(titleOf('IALERT_SUBSCRIPTION_EXPIRED')).toBe('iALERT plan expired');
      expect(titleOf('IALERT_SUBSCRIPTION_EXPIRING')).toBe('iALERT plan expiring');
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
        severity: 'CRITICAL',
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

    it('enriches alerts with severity, category, title, typeLabel, detectedRel, and detectedAbs', () => {
      const view = computeView(mockAlerts, 'newest');
      expect(view).toHaveLength(4);
      expect(view[0].detectedAbs).toContain('IST');
      const siphon = view.find((a) => a.id === '2');
      expect(siphon.severity).toBe('CRITICAL');
      expect(siphon.category).toBe('other');
      expect(siphon.title).toBe('Fuel loss suspected');
      expect(siphon.typeLabel).toBe('Fuel loss — please review');
      expect(view.find((a) => a.id === '3').category).toBe('subscription');
      expect(view.find((a) => a.id === '3').title).toBe('Subscription expired');
    });

    it('does not mutate the input array or its items', () => {
      const before = JSON.parse(JSON.stringify(mockAlerts));
      const order = mockAlerts.map((a) => a.id);
      computeView(mockAlerts, 'vehicle');
      expect(mockAlerts.map((a) => a.id)).toEqual(order);
      expect(mockAlerts).toEqual(before);
    });

    it('never drops a row: the server filtered by severity already', () => {
      expect(computeView(mockAlerts, 'newest')).toHaveLength(4);
    });

    it('sorts by newest', () => {
      const view = computeView(mockAlerts, 'newest');
      expect(view[0].id).toBe('2'); // 12:00
      expect(view[view.length - 1].id).toBe('3'); // 08:00
    });

    it('sorts by oldest', () => {
      const view = computeView(mockAlerts, 'oldest');
      expect(view[0].id).toBe('3'); // 08:00
      expect(view[view.length - 1].id).toBe('2'); // 12:00
    });

    it('sorts by vehicle', () => {
      const view = computeView(mockAlerts, 'vehicle');
      expect(view[0].vehicleNumber).toBe('DL01EF9999');
      expect(view[view.length - 1].vehicleNumber).toBe('MH02CD5678');
    });

    it('sorts by triage (unacknowledged first, highest severity first)', () => {
      const view = computeView(mockAlerts, 'triage');
      // id: 2 is CRITICAL and unacknowledged
      expect(view[0].id).toBe('2');
      // id: 3 is acknowledged, should be last
      expect(view[view.length - 1].id).toBe('3');
    });
  });

  describe('server counts and views', () => {
    it('reads meta.counts, never the page of rows', () => {
      expect(
        countsOf({ meta: { counts: { critical: 3, warning: 140, trucksCritical: 2 } } }),
      ).toEqual({
        critical: 3,
        warning: 140,
        trucks: 2,
      });
      // The server before B0b sends no counts: nothing is claimed.
      expect(countsOf({ records: [], total: 451 })).toBeNull();
    });

    it('asks the server for critical by default', () => {
      expect(CHIPS[0].key).toBe('critical');
      expect(viewParams('critical')).toEqual({ acknowledged: false, severity: 'critical' });
      expect(viewParams('warning')).toEqual({ acknowledged: false, severity: 'warning' });
      expect(viewParams('all')).toEqual({ acknowledged: false });
      expect(viewParams('acknowledged')).toEqual({ acknowledged: true });
    });
  });

  describe('constants', () => {
    it('defines chips, since, and sorts options', () => {
      expect(CHIPS.length).toBeGreaterThan(0);
      expect(SINCE.length).toBeGreaterThan(0);
      expect(SORTS.length).toBeGreaterThan(0);
    });
  });

  describe('refuel bill check', () => {
    it('carries a loss alert bill verdict onto the row', () => {
      const [a] = computeView(
        [
          {
            id: '1',
            type: 'FUEL_SIPHON_SUSPECTED',
            at: '2026-10-11T03:39:00Z',
            billCheck: { verdict: 'CONFIRMED', reason: 'r' },
          },
        ],
        'newest',
      );
      expect(a.bill).toMatchObject({ label: 'Bill confirms loss', tone: 'critical', reason: 'r' });
      const [b] = computeView(
        [{ id: '2', type: 'IDLING_BURN_HIGH', at: '2026-10-11T03:39:00Z' }],
        'newest',
      );
      expect(b.bill).toBeNull();
    });

    it('a fuel data review is a data issue, not theft', () => {
      expect(catOf('FUEL_DATA_REVIEW')).toBe('data');
      expect(titleOf('FUEL_DATA_REVIEW')).toBe('Fuel data review');
    });
  });
});
