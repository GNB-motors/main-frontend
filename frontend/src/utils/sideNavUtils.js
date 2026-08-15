import {
  Grid,
  FileText,
  Users,
  User,
  Truck,
  MapPin,
  Fuel,
  BookOpen,
  Navigation,
  PhoneCall,
  ClipboardList,
  Receipt,
  Banknote,
  Landmark,
  Settings,
  LayoutDashboard,
  FileCheck,
  Gauge,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

import { hasErpAccess, hasFleetAccess, satisfiesAccess } from './moduleAccess.js';

/**
 * Single source of truth for the dashboard sidebar.
 *
 * Har item ke saath uski feature-flag `key` yahin define hoti hai. Sidebar.jsx
 * sirf is list ko map karke render karta hai — naya link add karna ho to bas
 * yahan ek entry add karo (aur `key` do). Sidebar code chedne ki zarurat nahi.
 *
 * `key`      -> feature-flag key. Sidebar isEnabled(key) === true hone par hi item
 *               dikhata hai. `key: null` ka matlab "hamesha dikhao" (no gating).
 * `groupId`  -> collapsible group open/close state (defaults to `key` when set).
 *
 * type 'link'    -> single NavLink.
 *                   fields: { key, to, label, icon, end? }
 * type 'group'   -> collapsible dropdown.
 *                   fields: { key?, groupId?, label, icon, children[], matchRoutes[] }
 *                   children:    [{ to, label, end?, key? }]
 *                   matchRoutes: routes jinpe hone par group apne aap expand rahe
 *                                (chhupe/deep routes bhi include karo).
 * type 'section' -> non-clickable heading jo neeche wale items ko group karta hai.
 *                   fields: { label }
 *                   Agar uske neeche ka koi bhi item visible nahi hai to heading
 *                   apne aap hat jaati hai (getVisibleNavItems dekho).
 *
 * `access`   -> module gate: 'erp' | 'fleet' | 'both'. Item's apna feature-flag
 *               `key` iske upar bhi lagta hai. moduleAccess.js dekho.
 *
 * `hoistWhenSole` -> 'erp' | 'fleet'. Agar org ke paas sirf yahi ek module hai,
 *               to ye item apne section se nikal kar sabse upar chala jaata hai
 *               (shared Vehicles/Employees ke bhi upar) — kyunki tab wahi is
 *               org ka landing page hai. Dono module hone par ye hilta nahi;
 *               top slot combined Overview le leta hai.
 *
 * Order matters: ERP/CRM sabse upar hai kyunki wahi ab primary workflow hai.
 */
export const SIDE_NAV_ITEMS = [
  // Cross-module landing page. Sirf tab dikhta hai jab dono module hain —
  // ek hi module wale org ke liye ye combined view ka koi matlab nahi, unke liye
  // unka apna module home (ERP Home / Fleet Operations) hi top item ban jaata hai.
  { type: 'link', key: null, access: 'both', to: '/command-center', label: 'Overview', icon: Gauge, end: true },

  // ─── Shared master data ────────────────────────────────────────────────────
  // Vehicles aur Employees dono module use karte hain, isliye ye kisi ek section
  // ke andar nahi hain — top par rehte hain aur module gate nahi lagta (sirf
  // apni feature-flag key). moduleAccess.js ka SHARED_FLAG_KEYS dekho.
  {
    type: 'group',
    key: 'vehicles',
    label: 'Vehicles',
    icon: Truck,
    children: [
      { to: '/vehicles', label: 'All Vehicles', end: true },
      { to: '/vehicles/dashboard', label: 'Vehicle Dashboard' },
      { to: '/vehicles/service-intelligence', label: 'Service Intelligence' },
    ],
    matchRoutes: [
      '/vehicles',
      '/vehicles/dashboard',
      '/vehicles/add',
      '/vehicles/bulk-upload',
      '/vehicles/service-intelligence',
      '/vehicles/service-intelligence/add-service',
      '/vehicles/service-intelligence/add-repair',
    ],
  },
  { type: 'link', key: 'drivers', to: '/drivers', label: 'Employees', icon: Users },
  { type: 'link', key: 'drivers', to: '/access-control', label: 'Access Control', icon: ShieldCheck },

  // ─── ISOCL ERP / CRM Hub-and-Spoke Architecture ────────────────────────────
  { type: 'section', label: 'ERP & CRM', access: 'erp' },
  { type: 'link', key: null, access: 'erp', hoistWhenSole: 'erp', to: '/erp', label: 'ERP Home', icon: LayoutDashboard },
  {
    label: 'Planning',
    icon: PhoneCall,
    children: [
      { to: '/erp/call-tasks', label: 'Call Tasks', key: 'erpCallPlanning' },
      { to: '/erp/call-schedules', label: 'Call Schedules', key: 'erpCallPlanning' },
    ],
    matchRoutes: ['/erp/call-tasks', '/erp/call-schedules'],
  },
  { type: 'link', key: 'erpApprovals', access: 'erp', to: '/erp/approvals', label: 'Approvals', icon: FileCheck, badgeKey: 'approvalsCount' },
  { type: 'link', key: 'erpOperations', access: 'erp', to: '/erp/pipeline', label: 'Pipeline', icon: ClipboardList },
  { type: 'link', key: 'erpBilling', access: 'erp', to: '/erp/billing', label: 'Billing & Receivables', icon: Receipt },
  { type: 'link', key: 'erpAccounts', access: 'erp', to: '/erp/payables', label: 'Payables', icon: Banknote },
  { type: 'link', key: 'erpAccounts', access: 'erp', to: '/erp/accounts', label: 'Accounts & Ledger', icon: Landmark },
  {
    type: 'group',
    groupId: 'erpMasters',
    access: 'erp',
    label: 'Masters & Settings',
    icon: Settings,
    children: [
      { to: '/erp/parties', label: 'Party Master', key: 'erpMasters' },
      { to: '/erp/rates', label: 'Rate Master', key: 'erpMasters' },
      { to: '/erp/vendors', label: 'Vendor Master', key: 'erpMasters' },
      { to: '/erp/material-compatibility', label: 'Material Compatibility', key: 'erpMasters' },
      { to: '/erp/advance-masters', label: 'Advance Masters', key: 'erpAdvances' },
      { to: '/erp/settings', label: 'ERP Settings', key: 'erpMasters' },
    ],
    matchRoutes: [
      '/erp/parties',
      '/erp/rates',
      '/erp/vendors',
      '/erp/material-compatibility',
      '/erp/advance-masters',
      '/erp/settings',
    ],
  },

  // ─── Fleet operations ───────────────────────────────────────────────────────
  { type: 'section', label: 'Fleet', access: 'fleet' },
  { type: 'link', key: 'overview', access: 'fleet', hoistWhenSole: 'fleet', to: '/overview', label: 'Fleet Operations', icon: Grid },
  {
    type: 'group',
    groupId: 'fuelManagement',
    access: 'fleet',
    label: 'Fuel Management',
    icon: Fuel,
    children: [
      { to: '/mileage-tracking', label: 'Mileage Tracking', key: 'vehicleActivity' },
      { to: '/adblue-tracking', label: 'AdBlue', key: 'vehicleActivity' },
      { to: '/fuel-comparison', label: 'Fuel Comparison', key: 'fuelComparison' },
      { to: '/field-agent-fuel', label: 'Field Fuel Entries', key: null },
    ],
    matchRoutes: [
      '/mileage-tracking',
      '/adblue-tracking',
      '/fuel-comparison',
      '/field-agent-fuel',
      '/trip-management',
    ],
  },
  { type: 'link', key: 'locations', access: 'fleet', to: '/locations', label: 'Locations', icon: MapPin },
  {
    type: 'group',
    groupId: 'geofence',
    key: 'geofence',
    access: 'fleet',
    label: 'Geofence',
    icon: Navigation,
    children: [
      { to: '/geofence', label: 'Anomalies' },
      { to: '/geofence/zones', label: 'Zones & Alerts' },
    ],
    matchRoutes: ['/geofence', '/geofence/zones'],
  },

  // ─── Reporting / account (low-frequency, so it sits at the bottom) ──────────
  { type: 'section', label: 'Insights' },
  { type: 'link', key: 'khataLedger', to: '/khata-ledger', label: 'Khata Ledger', icon: BookOpen },
  { type: 'link', key: 'reports', to: '/reports', label: 'Reports', icon: FileText },

  { type: 'section', label: 'Account' },
  // Always visible (no feature flag) — guaranteed fallback page.
  { type: 'link', key: null, to: '/profile', label: 'Profile', icon: User },
];

/** Saare dropdown groups (open/close state isi se chalti hai). */
export const SIDE_NAV_GROUPS = SIDE_NAV_ITEMS.filter((item) => item.type === 'group');

/** Stable id for group expand/collapse state. */
export const getNavGroupId = (group) => group.groupId || group.key;

/** Children visible for the current org's feature flags. */
export const getVisibleNavChildren = (group, isEnabled) =>
  (group.children || []).filter((child) => !child.key || isEnabled(child.key));

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
  (group.matchRoutes || []).some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );