import { describe, it, expect } from 'vitest';
import {
  INTELLIGENCE_SECTIONS,
  INTELLIGENCE_TABS,
  INSTANCE_TABS,
  MOVED_TABS,
  movedTabDestination,
  resolveIntelligenceTab,
  sectionOfTab,
} from './intelligenceTabs';

describe('the Intelligence tabs', () => {
  it('has the tabs the spec asks for, in order', () => {
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
      'perfVehicles',
      'perfDrivers',
      'leaderboards',
    ]);
  });

  it('gives every tab an icon and a hint', () => {
    INTELLIGENCE_TABS.forEach((tab) => {
      expect(tab.icon).toBeTruthy();
      expect(tab.hint).toBeTruthy();
    });
  });

  it('puts every tab in exactly one section or on its own page, so none is dropped', () => {
    const placed = [
      ...INTELLIGENCE_SECTIONS.flatMap((section) => section.tabs),
      ...Object.keys(MOVED_TABS),
    ];
    expect([...placed].sort()).toEqual(INTELLIGENCE_TABS.map((tab) => tab.id).sort());
    expect(new Set(placed).size).toBe(placed.length);
    expect(sectionOfTab('overspeed').id).toBe('driving');
    expect(sectionOfTab('nope').id).toBe('issues');
  });

  it('sends links to the moved tabs to their Fuel Management pages with every filter', () => {
    const at = (query) => movedTabDestination(new URLSearchParams(query));
    expect(
      at('tab=idling&vehicle=WB11S6162&from=2026-11-23&to=2026-11-23&idleSubview=instances'),
    ).toBe('/idling?vehicle=WB11S6162&from=2026-11-23&to=2026-11-23&idleSubview=instances');
    expect(at('tab=fuel&fuelView=drain')).toBe('/fuel-checks?fuelView=drain');
    expect(at('tab=mileage')).toBe('/mileage-def');
    expect(at('tab=overspeed')).toBeNull();
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
    expect(INTELLIGENCE_TABS.some((tab) => tab.id === resolveIntelligenceTab('nope', 0))).toBe(
      true,
    );
  });
});
