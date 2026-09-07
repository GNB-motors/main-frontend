import { describe, it, expect } from 'vitest';
import {
  cleanMsg,
  buildActionItems,
  buildActivityItems,
  buildUpcomingItems,
  summarizeActionSeverity,
} from './dailyDigestLogic';

describe('cleanMsg', () => {
  it('strips a leading "Please review:" prefix', () => {
    expect(cleanMsg('Please review: tank is low')).toBe('tank is low');
  });

  it('returns other text unchanged, and an empty string for nothing', () => {
    expect(cleanMsg('Something else')).toBe('Something else');
    expect(cleanMsg(null)).toBe('');
  });
});

describe('buildActionItems', () => {
  it('returns nothing when every input is empty', () => {
    expect(buildActionItems({})).toEqual([]);
  });

  it('flags suspected fuel siphoning ahead of a plain theft-loss figure', () => {
    const actions = buildActionItems({
      totals: { siphonSuspectedLossL: 40, siphonSuspectedLossInr: 4000 },
      m: { theftLossInr: 999 },
    });
    expect(actions).toHaveLength(1);
    expect(actions[0].id).toBe('siphon');
  });

  it('sorts by severity rank, most severe first', () => {
    const actions = buildActionItems({
      documents: [{ registrationNumber: 'A', docType: 'RC', daysLeft: -2 }], // HIGH
      m: { billFraudSuspectInr: 500 }, // CRITICAL
    });
    expect(actions.map((a) => a.sev)).toEqual(['CRITICAL', 'HIGH']);
  });

  it('keeps unacknowledged owner alerts as individual cards below the group threshold', () => {
    const records = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      type: 'EV_LOW_SOC',
      acknowledged: false,
    }));
    const actions = buildActionItems({ alerts: { records } });
    expect(actions.filter((a) => a.id.startsWith('alert-'))).toHaveLength(3);
    expect(actions.some((a) => a.id === 'alert-group-EV_LOW_SOC')).toBe(false);
  });

  it('collapses unacknowledged alerts of the same type into one card once past the threshold, and skips acknowledged ones', () => {
    const records = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      type: 'EV_LOW_SOC',
      acknowledged: i < 2,
      vehicleNumber: `V${i}`,
    }));
    const actions = buildActionItems({ alerts: { records } });
    expect(actions).toHaveLength(1);
    expect(actions[0].id).toBe('alert-group-EV_LOW_SOC');
    expect(actions[0].desc).toContain('8 vehicles affected');
  });

  it('collapses overdue service and expired documents into one card each once past the threshold', () => {
    const documents = Array.from({ length: 6 }, (_, i) => ({
      registrationNumber: `V${i}`,
      docType: 'RC',
      daysLeft: -1,
    }));
    const serviceVehicles = Array.from({ length: 5 }, (_, i) => ({
      registrationNumber: `V${i}`,
      risk: 'OVERDUE',
      daysUntilDue: -3,
    }));
    const actions = buildActionItems({ documents, serviceVehicles });
    expect(actions.filter((a) => a.id === 'doc-group')).toHaveLength(1);
    expect(actions.filter((a) => a.id === 'svc-group')).toHaveLength(1);
  });

  it('keeps overdue service and expired documents as individual cards below the threshold', () => {
    const documents = [
      { registrationNumber: 'A', docType: 'RC', daysLeft: -1 },
      { registrationNumber: 'B', docType: 'RC', daysLeft: -2 },
    ];
    const serviceVehicles = [{ registrationNumber: 'C', risk: 'OVERDUE', daysUntilDue: -3 }];
    const actions = buildActionItems({ documents, serviceVehicles });
    expect(actions.filter((a) => a.id.startsWith('doc-'))).toHaveLength(2);
    expect(actions.filter((a) => a.id.startsWith('svc-'))).toHaveLength(1);
  });
});

describe('summarizeActionSeverity', () => {
  it('reports all clear when there is nothing to review', () => {
    expect(summarizeActionSeverity([])).toBe('All clear');
  });

  it('breaks down critical vs. the rest', () => {
    expect(summarizeActionSeverity([{ sev: 'CRITICAL' }, { sev: 'HIGH' }])).toBe(
      '1 critical · 1 to review',
    );
    expect(summarizeActionSeverity([{ sev: 'CRITICAL' }, { sev: 'CRITICAL' }])).toBe('2 critical');
    expect(summarizeActionSeverity([{ sev: 'MEDIUM' }])).toBe('1 to review');
  });
});

describe('buildActivityItems', () => {
  it('returns nothing when every money figure is 0 or absent', () => {
    expect(buildActivityItems(undefined)).toEqual([]);
    expect(buildActivityItems({ fuelCostInr: 0 })).toEqual([]);
  });

  it('includes only the money lines that are actually positive', () => {
    const items = buildActivityItems({ fuelCostInr: 100, idlingWasteInr: 0, detourWasteInr: 50 });
    expect(items.map((i) => i.id)).toEqual(['fuel', 'detour']);
  });
});

describe('buildUpcomingItems', () => {
  it('separates non-overdue service from overdue, and future-expiring docs from expired', () => {
    const items = buildUpcomingItems({
      serviceVehicles: [
        { registrationNumber: 'A', risk: 'DUE_SOON', daysUntilDue: 5 },
        { registrationNumber: 'B', risk: 'OVERDUE', daysUntilDue: -3 },
      ],
      documents: [
        { registrationNumber: 'C', docType: 'RC', daysLeft: 10 },
        { registrationNumber: 'D', docType: 'RC', daysLeft: -1 },
      ],
    });
    expect(items.map((i) => i.id)).toEqual(['up-svc-A', 'up-doc-C-RC']);
  });
});
