import { describe, it, expect } from 'vitest';
import { SIDE_NAV_ITEMS } from './sideNavItems';
import { getVisibleNavItems } from './sideNavUtils';

/**
 * The owner asked for hover help on every menu item. These tests make sure
 * a new item cannot be added without a hint, and that the hints that do
 * exist say something useful.
 */
describe('side nav hints', () => {
  const fleetItems = SIDE_NAV_ITEMS.filter(
    (item) => item.access === 'fleet' && item.type !== 'section',
  );

  it('gives every top-level Fleet item a non-empty hint', () => {
    const missing = fleetItems.filter((item) => !item.hint || !item.hint.trim());
    expect(missing.map((item) => item.label)).toEqual([]);
  });

  it('gives every child of a Fleet group a hint', () => {
    const missing = fleetItems
      .filter((item) => item.type === 'group')
      .flatMap((group) =>
        (group.children || []).filter((child) => !child.hint || !child.hint.trim()),
      );
    expect(missing.map((child) => child.label)).toEqual([]);
  });

  it('orders the requested Fleet items with trips and alerts first', () => {
    const requested = [
      'Trip',
      'Alert Inbox',
      'Intelligence',
      'Fuel Management',
      'Route Hub',
      'Places & Routes',
      'Approvals',
    ];
    const order = fleetItems.map((item) => item.label);
    expect(order.filter((label) => requested.includes(label))).toEqual(requested);
    expect(order.indexOf('Track')).toBeLessThan(order.indexOf('Trip'));
  });

  it('takes Place Hub out of the sidebar but keeps the route', () => {
    expect(fleetItems.map((item) => item.label)).not.toContain('Place Hub');
  });

  it('offers Places & Routes, pointing at Place Hub', () => {
    const item = fleetItems.find((i) => i.to === '/place-hub');
    expect(item).toBeTruthy();
    expect(item.label).toBe('Places & Routes');
    expect(item.access).toBe('fleet');
  });

  it('keeps Challans out of the sidebar (the route stays)', () => {
    expect(fleetItems.map((item) => item.to)).not.toContain('/challans');
  });

  it('gates Tolls behind the tolls flag, like the page itself', () => {
    const tolls = fleetItems.find((item) => item.to === '/tolls');
    expect(tolls).toBeTruthy();
    expect(tolls.key).toBe('tolls');
    expect(tolls.access).toBe('fleet');
  });

  it('writes hints in the owner’s words, not in developer words', () => {
    fleetItems.forEach((item) => {
      expect(item.hint).not.toMatch(/API|endpoint|schema|query param/i);
    });
  });
});

/**
 * Data Imports (/data-imports) — the page and the route exist, but the sidebar
 * had no entry for it, so owners could not find it. The backend route is
 * authorize('OWNER','MANAGER'), so the menu entry must carry the same gate.
 */
describe('data imports nav entry', () => {
  const item = SIDE_NAV_ITEMS.find((i) => i.to === '/data-imports');
  const navFor = (role) => getVisibleNavItems(() => true, role);

  it('points at the data imports page', () => {
    expect(item).toBeTruthy();
    expect(item.type).toBe('link');
    expect(item.label).toBe('Data imports');
    expect(item.icon).toBeTruthy();
  });

  it('is shown to an owner and to a manager', () => {
    expect(navFor('OWNER').some((i) => i.to === '/data-imports')).toBe(true);
    expect(navFor('MANAGER').some((i) => i.to === '/data-imports')).toBe(true);
  });

  it('is hidden from a driver', () => {
    expect(navFor('DRIVER').some((i) => i.to === '/data-imports')).toBe(false);
  });
});
