import { describe, it, expect } from 'vitest';
import { getVisibleNavItems, getVisibleNavChildren, computeVisibleNav } from '../sideNavUtils';
import { SIDE_NAV_ITEMS } from '../sideNavItems';

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

  it('is never a child of Fleet Intelligence', () => {
    const fleetIntelItem = SIDE_NAV_ITEMS.find(
      (item) => item.groupId === 'fleetIntelligence' || item.to === '/route-hub',
    );
    if (fleetIntelItem?.children) {
      expect(fleetIntelItem.children.some((c) => c.to === '/erp/trip-windows')).toBe(false);
      expect(fleetIntelItem.matchRoutes?.includes('/erp/trip-windows')).toBe(false);
    }
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

describe('Fuel Management standalone navigation', () => {
  it('keeps all three pages directly accessible without Reports access', () => {
    const items = getVisibleNavItems(flags(['fuelIntegrity', 'vehicleActivity']));
    const fuel = items.find((item) => item.groupId === 'fuelManagement');
    expect(fuel.children.map((child) => child.to)).toEqual([
      '/mileage',
      '/fuel-integrity',
      '/def-ledger',
    ]);
    expect(shows(items, '/reports')).toBe(false);
  });
});

describe('Mileage hub nav access', () => {
  it.each(['fuelIntegrity', 'vehicleActivity', 'fuelComparison'])(
    'shows with only %s, the flag of one of the pages it replaced',
    (flag) => {
      expect(hasAnywhere(flags([flag]), '/mileage')).toBe(true);
    },
  );

  it('hides with none of those flags', () => {
    expect(hasAnywhere(flags(['fleetIntelligence']), '/mileage')).toBe(false);
  });
});

describe('Fleet Coverage nav access', () => {
  it('is no longer a sidebar entry — it opens from Profile', () => {
    expect(hasAnywhere(flags(['fleetIntelligence', 'vehicleActivity']), '/fleet-coverage')).toBe(
      false,
    );
  });
});

describe('sidebar destinations stay in their original groups regardless of usage', () => {
  const LEARNED = {
    state: 'LEARNED',
    learned: { engagementFloor: 10 },
    surfaces: [
      { surfaceKey: '/digest', disposition: 'NEVER_OPENED' },
      { surfaceKey: '/vehicles/service-intelligence', disposition: 'NEVER_OPENED' },
      { surfaceKey: '/access-control', disposition: 'BELOW_ORG_FLOOR' },
    ],
  };
  const isEnabled = flags(['fleetIntelligence', 'vehicleActivity', 'vehicles', 'drivers']);

  it('keeps Service Intelligence in Vehicles and User Management in Workforce', () => {
    const { items } = computeVisibleNav(isEnabled, 'OWNER', LEARNED);
    expect(items.find((item) => item.label === 'Vehicles')?.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ to: '/vehicles/service-intelligence' })]),
    );
    expect(items.find((item) => item.label === 'Workforce')?.children).toEqual(
      expect.arrayContaining([expect.objectContaining({ to: '/access-control' })]),
    );
  });

  it('keeps the whole permitted menu stable even with an old usage profile', () => {
    expect(getVisibleNavItems(isEnabled, 'OWNER', LEARNED)).toEqual(
      getVisibleNavItems(isEnabled, 'OWNER'),
    );
  });

  it('still hides groups when feature or role access is missing', () => {
    const items = getVisibleNavItems(flags(['vehicleActivity']), 'OWNER', LEARNED);
    expect(items.some((item) => item.label === 'Vehicles')).toBe(false);
    expect(items.some((item) => item.label === 'Workforce')).toBe(false);
  });
});

describe('Performance nav access', () => {
  it('is hidden while the performanceSection flag is off', () => {
    expect(hasAnywhere(flags(['fleetIntelligence', 'vehicleActivity']), '/performance')).toBe(
      false,
    );
  });

  it('shows when the performanceSection flag is on', () => {
    const { items } = computeVisibleNav(
      flags(['fleetIntelligence', 'vehicleActivity']),
      'OWNER',
      null,
      (key) => key === 'performanceSection',
    );
    expect(shows(items, '/performance')).toBe(true);
  });

  it('is gated on the org flag alone, not on an RBAC permission', () => {
    const { items } = computeVisibleNav(
      () => false,
      'OWNER',
      null,
      (key) => key === 'performanceSection',
    );
    expect(shows(items, '/performance')).toBe(true);
  });
});
