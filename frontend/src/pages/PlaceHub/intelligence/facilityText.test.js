import { describe, it, expect } from 'vitest';
import { dropLabel, evidenceLines, poiText, roleText } from './facilityText';

describe('facilityText', () => {
  it('names a drop by place, else by its area, else by what is known', () => {
    expect(dropLabel({ name: 'COSSIPORE' })).toBe('COSSIPORE');
    expect(dropLabel({ name: null, areaName: 'SALMARI' })).toBe('SALMARI area');
    expect(dropLabel({ source: 'UNKNOWN' })).toBe('drop not found');
    expect(dropLabel({ source: 'INFERRED_TURNAROUND' })).toBe('unnamed place');
    expect(dropLabel(null)).toBe('—');
  });

  it('says whether a role is the manager’s answer or learned, and how sure', () => {
    expect(roleText({ roles: ['PICKUP'], typeSource: 'INFERRED', pPickup: 0.904 })).toBe(
      'Pickup (learned, 90%)',
    );
    expect(roleText({ roles: ['PICKUP', 'DROP'], typeSource: 'MANAGER' })).toBe(
      'Pickup & drop (your answer)',
    );
    expect(roleText({ roles: [] })).toBe('Not a pickup or drop');
  });

  it('turns evidence bins and the map match into sentences', () => {
    const f = { why: { bins: { PICKUP: { fleet: 'LOW', poi: 'PLANT', register: 'MAPPED' } } } };
    expect(evidenceLines(f)).toEqual([
      'trucks rarely load/unload here',
      'the map shows a plant or factory here',
      'your register’s plant/town names point here',
    ]);
    expect(poiText({ match: { name: 'JK Cement Works', inside: true, source: 'OSM' } })).toBe(
      'JK Cement Works — inside (OpenStreetMap)',
    );
  });
});
