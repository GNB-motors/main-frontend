import { hasErpAccess, hasFleetAccess, satisfiesAccess } from './moduleAccess.js';
import { SIDE_NAV_ITEMS } from './sideNavItems.js';

/** Saare dropdown groups (open/close state isi se chalti hai). */
export const SIDE_NAV_GROUPS = SIDE_NAV_ITEMS.filter((item) => item.type === 'group');

/** Stable id for group expand/collapse state. */
export const getNavGroupId = (group) => group.groupId || group.key;

/** Children visible for the current org's feature flags. */
export const getVisibleNavChildren = (group, isEnabled) =>
  (group.children || []).filter((child) => {
    if (child.anyKey) return child.anyKey.some((k) => isEnabled(k));
    if (!child.key) return true;
    if (Array.isArray(child.key)) return child.key.every((k) => isEnabled(k));
    return isEnabled(child.key);
  });

/**
 * Top-level items visible for the current org's feature flags.
 *
 * Teen pass hote hain:
 *  1. flag/module se gated items hatao,
 *  2. single-module org ke liye uska home top par hoist karo,
 *  3. woh section headings hatao jinke neeche kuch bacha hi nahi (hoisting ke
 *     baad ek section khaali ho sakta hai, isliye ye pass last me chalta hai).
 */
export const getVisibleNavItems = (isEnabled) => {
  const access = { erp: hasErpAccess(isEnabled), fleet: hasFleetAccess(isEnabled) };

  const soleModule =
    access.erp && !access.fleet ? 'erp' : access.fleet && !access.erp ? 'fleet' : null;

  let items = SIDE_NAV_ITEMS.filter((item) => {
    if (!satisfiesAccess(item.access, access)) return false;
    if (item.type === 'section') return true;
    if (item.key && !isEnabled(item.key)) return false;
    if (item.type === 'group') return getVisibleNavChildren(item, isEnabled).length > 0;
    return true;
  });

  if (soleModule) {
    const i = items.findIndex((item) => item.hoistWhenSole === soleModule);
    if (i > -1) items = [items[i], ...items.slice(0, i), ...items.slice(i + 1)];
  }

  return items.filter((item, i) => {
    if (item.type !== 'section') return true;
    const next = items[i + 1];
    return !!next && next.type !== 'section';
  });
};

/**
 * Pehla navigable route jispe current org ke flags ke hisaab se user ki access hai.
 *
 * Sidebar ke visible items ko order me dekhta hai: pehla `link` uska `to`, ya
 * pehla `group` ka pehla visible child. Location switch ke baad user ko yahin
 * land karaya jaata hai (LocationSwitcher). `/profile` hamesha visible hai isliye
 * guaranteed fallback ke roop me kaam karta hai.
 */
export const getFirstNavPath = (isEnabled) => {
  const items = getVisibleNavItems(isEnabled);
  for (const item of items) {
    if (item.type === 'link') return item.to;
    if (item.type === 'group') {
      const children = getVisibleNavChildren(item, isEnabled);
      if (children.length) return children[0].to;
    }
  }
  return '/profile';
};

/**
 * Kya current path is group ke andar aata hai? (exact match ya sub-route)
 * Group ko auto-expand / auto-close karne ke liye use hota hai.
 */
export const isGroupActive = (group, pathname) =>
  (group.matchRoutes || []).some((r) => pathname === r || pathname.startsWith(`${r}/`));
