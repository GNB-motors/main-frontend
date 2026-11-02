import { describe, it, expect } from 'vitest';
import { INTELLIGENCE_TABS, INSTANCE_TABS, resolveIntelligenceTab } from './intelligenceTabs';

describe('the Intelligence tabs', () => {
  it('has the eleven tabs the spec asks for, in order', () => {
    expect(INTELLIGENCE_TABS.map((tab) => tab.id)).toEqual([
      'issues',
      'vehicles',
      'drivers',
      'runs',
      'idling',
      'cruise',
      'overspeed',
      'mileage',
      'fuel',
      'detours',
      'places',
    ]);
  });

  it('gives every tab an icon and a hint', () => {
    INTELLIGENCE_TABS.forEach((tab) => {
      expect(tab.icon).toBeTruthy();
      expect(tab.hint).toBeTruthy();
    });
  });

  it('maps the instance tabs to the kinds the API knows', () => {
    expect(INSTANCE_TABS).toEqual({
      idling: 'idle',
      cruise: 'cruise',
      overspeed: 'overspeed',
      fuel: 'fuel_unexplained',
      detours: 'detour',
    });
  });
});

describe('resolveIntelligenceTab', () => {
  it('keeps a tab the URL asked for', () => {
    expect(resolveIntelligenceTab('mileage', 0)).toBe('mileage');
  });

  it('opens on the issues when something needs the owner', () => {
    expect(resolveIntelligenceTab(null, 2)).toBe('issues');
  });

  it('opens on the trucks when nothing needs the owner', () => {
    expect(resolveIntelligenceTab(null, 0)).toBe('vehicles');
  });

  it('waits on the issues while the count is still unknown', () => {
    expect(resolveIntelligenceTab(null, null)).toBe('issues');
  });

  it('never lands on a tab that does not exist', () => {
    expect(INTELLIGENCE_TABS.some((tab) => tab.id === resolveIntelligenceTab('nope', 0))).toBe(true);
  });
});
