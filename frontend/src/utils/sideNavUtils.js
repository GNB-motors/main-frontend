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
  Landmark,
  Settings,
  LayoutDashboard,
  FileCheck,
  Gauge,
  ShieldAlert,
  CalendarClock,
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
  { type: 'link', key: 'overview', access: 'both', to: '/command-center', label: 'Overview', icon: Gauge, end: true },
  // Fleet-wide daily digest (added by live-map-refresh branch).
  { type: 'link', key: 'fleetIntelligence', access: 'both', to: '/digest', label: 'Daily Digest', icon: CalendarClock },

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
  // Workforce mirrors the Vehicles group: the employee directory and the RBAC
  // (User Management) screen live under one collapsible parent. Whole group is
  // gated by the `drivers` feature flag (same as both children were).
  {
    type: 'group',
    key: 'drivers',
    label: 'Workforce',
    icon: Users,
    children: [
      { to: '/drivers', label: 'Employee', end: true },
      { to: '/access-control', label: 'User Management' },
    ],
    matchRoutes: ['/drivers', '/drivers/add', '/drivers/bulk-upload', '/access-control'],
  },

  // ─── ISOCL ERP / CRM — five workspaces ─────────────────────────────────────
  // Ye list ab role ke hisaab se bani hai, feature ke hisaab se nahi: ERP ko
  // chaar log chalate hain (planning, operations, accounts, approve karne wala
  // owner) aur unme se har ek sirf apne workspace me rehta hai. Pehle yahan 11
  // top-level entries thi, jinme se har user ke liye 8 shor thi.
  //
  // Ye sirf navigation ka regroup hai — na koi route badla hai, na koi page.
  { type: 'section', label: 'ERP & CRM', access: 'erp' },
  // `end` so ERP Home is active only on exactly /erp — without it the NavLink
  // matches every /erp/* route and stays highlighted alongside the open group.
  { type: 'link', key: 'erpOperations', access: 'erp', hoistWhenSole: 'erp', to: '/erp', label: 'ERP Home', icon: LayoutDashboard, end: true },
  // CRM — the customer-facing workspace. "Accounts" used to mean both customer
  // accounts AND accounting, which was the core sidebar confusion; the customer
  // side now lives here (Customers = the party master) and the money side lives
  // under "Finance" below.
  {
    type: 'group',
    groupId: 'erpCrm',
    access: 'erp',
    label: 'CRM',
    icon: PhoneCall,
    children: [
      { to: '/erp/parties', label: 'Customers', key: 'erpMasters' },
      { to: '/erp/call-tasks', label: 'Call Tasks', key: 'erpCallPlanning' },
      { to: '/erp/call-schedules', label: 'Call Schedules', key: 'erpCallPlanning' },
    ],
    matchRoutes: ['/erp/parties', '/erp/call-tasks', '/erp/call-schedules'],
  },
  // Operations — the trip pipeline (Delivery Orders / Placement / Trips are its
  // tabs) plus inbound e-Way bills, which is a CN-updation / operations task.
  {
    type: 'group',
    groupId: 'erpOperations',
    access: 'erp',
    label: 'Operations',
    icon: ClipboardList,
    children: [
      { to: '/erp/pipeline', label: 'Trip Pipeline', key: 'erpOperations' },
      { to: '/erp/inbound-ewb', label: 'Inbound e-Way Bills', key: 'erpCnUpdation' },
    ],
    matchRoutes: ['/erp/pipeline', '/erp/inbound-ewb'],
  },
  // Finance — the accounting side. Renamed from the ambiguous "Accounts".
  {
    type: 'group',
    groupId: 'erpAccounts',
    access: 'erp',
    label: 'Finance',
    icon: Landmark,
    children: [
      { to: '/erp/billing', label: 'Billing & Receivables', key: 'erpBilling' },
      { to: '/erp/payables', label: 'Payables', key: 'erpAccounts' },
      { to: '/erp/accounts', label: 'Ledger', key: 'erpAccounts' },
    ],
    // `/erp/accounts` bina slash ke Account 360 aur voucher detail dono ko cover
    // kar leta hai (isGroupActive prefix match karta hai).
    matchRoutes: ['/erp/billing', '/erp/payables', '/erp/accounts'],
  },
  {
    type: 'group',
    groupId: 'erpApprovals',
    access: 'erp',
    label: 'Approval Center',
    icon: FileCheck,
    // Group parent par combined badge — pehle dono queues alag links thi aur
    // dono apna count dikhati thi; collapse hone par wo count gayab na ho.
    badgeKey: 'approvalsTotal',
    children: [
      { to: '/erp/approvals', label: 'Approvals', key: 'erpApprovals' },
      { to: '/erp/bill-approvals', label: 'Bill Approvals', key: 'erpApprovals' },
    ],
    matchRoutes: ['/erp/approvals', '/erp/bill-approvals'],
  },
  {
    type: 'group',
    groupId: 'erpMasters',
    access: 'erp',
    label: 'Master Setting',
    icon: Settings,
    children: [
      { to: '/erp/rates', label: 'Rate Master', key: 'erpMasters' },
      { to: '/erp/vendors', label: 'Vendor Master', key: 'erpMasters' },
      { to: '/erp/material-compatibility', label: 'Material Compatibility', key: 'erpMasters' },
      { to: '/erp/advance-masters', label: 'Advance Masters', key: 'erpAdvances' },
      { to: '/erp/settings', label: 'ERP Settings', key: 'erpMasters' },
    ],
    matchRoutes: [
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
      // Live-map-refresh / warehouse branch additions.
      { to: '/fuel-integrity', label: 'Fuel Integrity', key: 'fuelIntegrity' },
      { to: '/fuel-spend', label: 'Fuel Spend', key: 'fuelIntegrity' },
      { to: '/def-ledger', label: 'DEF Ledger', key: 'fuelIntegrity' },
      { to: '/field-agent-fuel', label: 'Field Fuel Entries', key: 'fuelIntegrity' },
    ],
    matchRoutes: [
      '/mileage-tracking',
      '/adblue-tracking',
      '/fuel-comparison',
      '/fuel-integrity',
      '/fuel-spend',
      '/def-ledger',
      '/field-agent-fuel',
      '/trip-management',
    ],
  },
  // Fleet Intelligence surfaces added by the live-map-refresh / warehouse branch.
  {
    type: 'group',
    groupId: 'fleetIntelligence',
    access: 'fleet',
    label: 'Fleet Intelligence',
    icon: ShieldAlert,
    children: [
      { to: '/compliance', label: 'Compliance', key: 'fleetIntelligence' },
      { to: '/fleet-alerts', label: 'Fleet Alerts', key: 'fleetIntelligence' },
      { to: '/fleet-coverage', label: 'Fleet Coverage', key: 'fleetIntelligence' },
      { to: '/audit-trail', label: 'Audit Trail', key: 'fleetIntelligence' },
      { to: '/route-deviation', label: 'Route Deviation', key: 'fleetIntelligence' },
      { to: '/owner-alerts', label: 'Owner Alerts', key: 'fleetIntelligence' },
    ],
    matchRoutes: [
      '/compliance',
      '/fleet-alerts',
      '/fleet-coverage',
      '/audit-trail',
      '/route-deviation',
      '/owner-alerts',
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
  // Always visible (no feature flag) — guaranteed fallback page. Profile must
  // stay reachable for every authenticated user regardless of plan; gating it
  // can lock users out with no recovery path, so `key` stays null on purpose.
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
