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

describe('computeVisibleNav — the cut reports what it folded', () => {
  // Same shape the Sidebar renders from: the menu plus the folded entries,
  // each with its route and reason, so nothing is ever cut with no way back.
  const LEARNED = {
    state: 'LEARNED',
    learned: { engagementFloor: 10 },
    surfaces: [{ surfaceKey: '/digest', disposition: 'NEVER_OPENED', reason: 'not opened once' }],
  };
  const isEnabled = (key) => ['fleetIntelligence', 'vehicleActivity'].includes(key);

  it('folded entries come back grouped by job, with route and reason intact', () => {
    const { items, folded, foldedByJob } = computeVisibleNav(isEnabled, 'OWNER', LEARNED);
    expect(items.some((i) => i.to === '/digest')).toBe(false);
    expect(folded).toHaveLength(1);
    expect(folded[0].to).toBe('/digest');
    expect(folded[0].reason).toMatch(/not opened once/i);
    expect(Object.values(foldedByJob).flat()).toHaveLength(folded.length);
  });

  it('with no profile nothing folds and the folded lists are empty', () => {
    const { folded, foldedByJob, cutApplied } = computeVisibleNav(isEnabled, 'OWNER', null);
    expect(cutApplied).toBe(false);
    expect(folded).toHaveLength(0);
    expect(Object.keys(foldedByJob)).toHaveLength(0);
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
