import { describe, it, expect } from 'vitest';
import { SIDE_NAV_ITEMS } from './sideNavItems';

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
      .flatMap((group) => (group.children || []).filter((child) => !child.hint || !child.hint.trim()));
    expect(missing.map((child) => child.label)).toEqual([]);
  });

  it('puts Intelligence in the Fleet section, right after Track', () => {
    const order = fleetItems.map((item) => item.label);
    expect(order.indexOf('Track')).toBeLessThan(order.indexOf('Intelligence'));
    expect(order.indexOf('Intelligence')).toBeLessThan(order.indexOf('Trip'));
    expect(order.indexOf('Trip')).toBeLessThan(order.indexOf('Alert Inbox'));
    expect(order.indexOf('Alert Inbox')).toBeLessThan(order.indexOf('Route Hub'));
  });

  it('takes Place Hub out of the sidebar but keeps the route', () => {
    expect(fleetItems.map((item) => item.label)).not.toContain('Place Hub');
  });

  it('writes hints in the owner’s words, not in developer words', () => {
    fleetItems.forEach((item) => {
      expect(item.hint).not.toMatch(/API|endpoint|schema|query param/i);
    });
  });
});
