import { hasErpAccess, hasFleetAccess, satisfiesAccess } from './moduleAccess.js';
import { SIDE_NAV_ITEMS } from './sideNavItems.js';
import { applyUsageCut, surfaceKeysFromNav } from './navCut.js';

/** Saare dropdown groups (open/close state isi se chalti hai). */
export const SIDE_NAV_GROUPS = SIDE_NAV_ITEMS.filter((item) => item.type === 'group');

/** Stable id for group expand/collapse state. */
export const getNavGroupId = (group) => group.groupId || group.key;

/** Children visible for the current org's feature flags. */
export const getVisibleNavChildren = (group, isEnabled, access = null) =>
  (group.children || []).filter((child) => {
    if (access && !satisfiesAccess(child.access, access)) return false;
    if (child.anyKey) return child.anyKey.some((k) => isEnabled(k));
    if (!child.key) return true;
    if (Array.isArray(child.key)) return child.key.every((k) => isEnabled(k));
    return isEnabled(child.key);
  });

/**
 * Top-level items visible for the current org's feature flags.
 *
 * Paanch pass hote hain:
 *  1. flag/module/role se gated items hatao,
 *  2. `mergeInto` se duplicate entries hatao — an item that a surviving group
 *     already carries (item 26.2's two Approvals entries),
 *  3. single-module org ke liye uska home top par hoist karo,
 *  4. is org ke APNE recorded usage se fold karo (navCut) — nothing is cut
 *     without a measured verdict,
 *  5. woh section headings hatao jinke neeche kuch bacha hi nahi.
 *
 * `usageProfile` is GET /api/usage/nav-profile for this org. Pass nothing and
 * the menu is whole: absence of measurement never removes anything.
 */
export const getVisibleNavItems = (isEnabled, role = null, usageProfile = null) =>
  computeVisibleNav(isEnabled, role, usageProfile).items;

/**
 * The menu PLUS what the usage cut folded. A folded entry never vanishes: it
 * comes back here with its route, its job and the sentence the server wrote,
 * so the sidebar can still offer it under "More".
 */
export const computeVisibleNav = (
  isEnabled,
  role = null,
  usageProfile = null,
  flagOnlyEnabled = isEnabled,
) => {
  const access = { erp: hasErpAccess(isEnabled), fleet: hasFleetAccess(isEnabled) };

  // A `flagOnly` entry is gated on the ORG's feature flag alone. It is a
  // brand-new surface with no RBAC permission yet, so the usual canAccess
  // (flag AND permission) would keep it hidden for good.
  const navItemEnabled = (item) => {
    if (!item.key) return true;
    if (item.flagOnly) return flagOnlyEnabled(item.key) === true;
    return isEnabled(item.key) === true;
  };

  const soleModule =
    access.erp && !access.fleet ? 'erp' : access.fleet && !access.erp ? 'fleet' : null;

  let items = SIDE_NAV_ITEMS.filter((item) => {
    if (!satisfiesAccess(item.access, access)) return false;
    if (item.type === 'section') return true;
    if (!navItemEnabled(item)) return false;
    if (item.roles && role && !item.roles.includes(role)) return false;
    if (item.type === 'group') return getVisibleNavChildren(item, isEnabled, access).length > 0;
    return true;
  });

  // item 26.2: the fleet Approvals link disappears when the ERP Approval Center
  // is on screen carrying it, so an org with both modules has ONE Approvals
  // entry. Nothing is deleted — /approvals is a child of the group either way.
  const survivingGroups = new Set(
    items.filter((i) => i.type === 'group').map((i) => getNavGroupId(i)),
  );
  items = items.filter((item) => !item.mergeInto || !survivingGroups.has(item.mergeInto));

  if (soleModule) {
    const i = items.findIndex((item) => item.hoistWhenSole === soleModule);
    if (i > -1) items = [items[i], ...items.slice(0, i), ...items.slice(i + 1)];
  }

  const gated = items
    .map((item) =>
      item.type === 'group'
        ? { ...item, children: getVisibleNavChildren(item, isEnabled, access) }
        : item,
    )
    .filter((item) => item.type !== 'group' || item.children.length > 0);

  // Last, and only with the org's own measured numbers behind it.
  const cut = applyUsageCut(gated, usageProfile);

  const prunedItems = cut.items.filter((item, i) => {
    if (item.type !== 'section') return true;
    const next = cut.items[i + 1];
    return !!next && next.type !== 'section';
  });

  return {
    items: prunedItems,
    folded: cut.folded,
    foldedByJob: cut.foldedByJob,
    cutApplied: cut.applied,
    cutWhy: cut.why,
  };
};

/** Pehla navigable route jispe current org ke flags ke hisaab se user ki access hai. */
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

export { applyUsageCut, surfaceKeysFromNav };
