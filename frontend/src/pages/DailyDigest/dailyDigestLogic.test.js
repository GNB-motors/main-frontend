import { describe, it, expect } from 'vitest';
import {
  cleanMsg,
  buildActionItems,
  buildActivityItems,
  buildUpcomingItems,
  nextServiceLabel,
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

  it('caps unacknowledged owner alerts at 6 and skips acknowledged ones', () => {
    const records = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      type: 'EV_LOW_SOC',
      acknowledged: i < 2,
    }));
    const actions = buildActionItems({ alerts: { records } });
    expect(actions).toHaveLength(6);
  });

  it('caps overdue service and expired documents at their own limits', () => {
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
    expect(actions.filter((a) => a.id.startsWith('doc-'))).toHaveLength(4);
    expect(actions.filter((a) => a.id.startsWith('svc-'))).toHaveLength(3);
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

describe('nextServiceLabel', () => {
  it('returns a dash when nothing has a due date', () => {
    expect(nextServiceLabel([])).toEqual({ nextSvc: undefined, label: '—' });
  });

  it('labels a negative days-until-due as Overdue', () => {
    expect(nextServiceLabel([{ daysUntilDue: -2 }]).label).toBe('Overdue');
  });

  it('picks the soonest due date and formats it in days', () => {
    const result = nextServiceLabel([{ daysUntilDue: 10 }, { daysUntilDue: 3 }]);
    expect(result.nextSvc).toBe(3);
    expect(result.label).toBe('3 days');
  });
});
