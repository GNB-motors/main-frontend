import { describe, it, expect } from 'vitest';
import { getVisibleNavItems, getVisibleNavChildren, SIDE_NAV_ITEMS } from './sideNavUtils';

const flags = (on) => (key) => on.includes(key);
const shows = (items, to) => items.some((item) => item.to === to);

const hasAnywhere = (isEnabled, path) => {
  const items = getVisibleNavItems(isEnabled);
  if (items.some((item) => item.to === path)) return true;
  return items.some((item) => {
    if (item.type === 'group') {
      const children = getVisibleNavChildren(item, isEnabled);
      return children.some((c) => c.to === path);
    }
    return false;
  });
};

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

describe('Trip Windows nav access', () => {
  it('never shows for a fleet-only org with Fleet Intelligence enabled (ERP disabled in superadmin)', () => {
    expect(
      hasAnywhere(
        flags(['fleetIntelligence', 'vehicleActivity', 'idlingConsole']),
        '/erp/trip-windows',
      ),
    ).toBe(false);
  });

  it('is never a child of Fleet Intelligence group', () => {
    const fleetIntelGroup = SIDE_NAV_ITEMS.find((item) => item.groupId === 'fleetIntelligence');
    expect(fleetIntelGroup.children.some((c) => c.to === '/erp/trip-windows')).toBe(false);
    expect(fleetIntelGroup.matchRoutes.includes('/erp/trip-windows')).toBe(false);
  });

  it('shows under Operations when both erpOperations and erpTripClose are enabled', () => {
    expect(hasAnywhere(flags(['erpOperations', 'erpTripClose']), '/erp/trip-windows')).toBe(true);
  });

  it('hides when ERP trips module (erpTripClose) is disabled in superadmin', () => {
    expect(hasAnywhere(flags(['erpOperations']), '/erp/trip-windows')).toBe(false);
  });

  it('hides when Operations (erpOperations) is disabled in superadmin', () => {
    expect(hasAnywhere(flags(['erpTripClose']), '/erp/trip-windows')).toBe(false);
  });

  it('hides when both fleet and other ERP modules are on, but ERP trips module is disabled', () => {
    expect(
      hasAnywhere(
        flags([
          'fleetIntelligence',
          'vehicleActivity',
          'erpOperations',
          'erpMasters',
          'erpBilling',
        ]),
        '/erp/trip-windows',
      ),
    ).toBe(false);
  });
});
