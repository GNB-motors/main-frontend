import { describe, it, expect } from 'vitest';
import { getVisibleNavItems } from './sideNavUtils';

const flags = (on) => (key) => on.includes(key);
const shows = (items, to) => items.some((item) => item.to === to);

describe('Daily Digest nav access', () => {
  it('shows for a fleet-only org (Track access) with fleetIntelligence', () => {
    expect(
      shows(getVisibleNavItems(flags(['fleetIntelligence', 'vehicleActivity'])), '/digest'),
    ).toBe(true);
  });

  it('still shows when the org also has ERP', () => {
    expect(
      shows(getVisibleNavItems(flags(['fleetIntelligence', 'erpOperations'])), '/digest'),
    ).toBe(true);
  });

  it('hides without the fleetIntelligence flag its APIs are gated on', () => {
    expect(shows(getVisibleNavItems(flags(['vehicleActivity'])), '/digest')).toBe(false);
  });

  it('hides for an ERP-only org', () => {
    expect(shows(getVisibleNavItems(flags(['erpOperations'])), '/digest')).toBe(false);
  });
});
