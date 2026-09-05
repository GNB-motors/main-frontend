import {
  FileText,
  Users,
  User,
  Truck,
  MapPin,
  Fuel,
  BookOpen,
  Radio,
  Route as RouteIcon,
  Bell,
  PhoneCall,
  ClipboardList,
  Receipt,
  ReceiptText,
  Banknote,
  Landmark,
  Settings,
  LayoutDashboard,
  FileCheck,
  Gauge,
  FileCheck2,
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
 * `hoistWhenSole` -> 'erp' | 'fleet'. DEPRECATED, ab koi item ise use nahi karta.
 *               Zarurat isliye thi ki shared Vehicles/Workforce sabse upar float
 *               karte the, to single-module org ka home unke neeche dab jaata tha.
 *               Ab shared items "Manage" section me neeche hain, so ERP-only org
 *               ka "ERP & CRM" aur Fleet-only org ka "Operate" section apne aap
 *               top par aa jaata hai. Ise dobara na lagayein: hoist item ko index
 *               0 par le jaata hai, jisse woh apne section heading ke UPAR chala
 *               jaata hai aur heading orphan ho jaati hai. Mechanism (getVisibleNavItems)
 *               abhi jaan-boojh kar rakha gaya hai — koi match na ho to no-op hai.
 *
 * Order: sections user ke kaam ke hisaab se hain, module ke hisaab se nahi —
 * Operate (aaj kya ho raha hai) -> Manage (jo cheezein aapki hain) -> Review
 * (kya hua tha) -> Account. ERP block apne section me alag rehta hai.
 */
export const SIDE_NAV_ITEMS = [
  // Cross-module landing page. Sirf tab dikhta hai jab dono module hain — ek hi
  // module wale org ke liye combined view ka matlab nahi; unke liye apne module
  // ka pehla section (ERP & CRM / Operate) hi top par aa jaata hai.
  { type: 'link', key: 'overview', access: 'both', to: '/command-center', label: 'Overview', icon: Gauge, end: true },

  // ─── ISOCL ERP / CRM Hub-and-Spoke Architecture ────────────────────────────
  { type: 'section', label: 'ERP & CRM', access: 'erp' },
  // `end` so ERP Home is active only on exactly /erp — without it the NavLink
  // matches every /erp/* route and stays highlighted alongside the open group.
  { type: 'link', key: 'erpOperations', access: 'erp', to: '/erp', label: 'ERP Home', icon: LayoutDashboard, end: true },
  {
    type: 'group',
    groupId: 'erpPlanning',
    access: 'erp',
    label: 'Planning',
    icon: PhoneCall,
    children: [
      { to: '/erp/call-tasks', label: 'Call Tasks', key: 'erpCallPlanning' },
      { to: '/erp/call-schedules', label: 'Call Schedules', key: 'erpCallPlanning' },
    ],
    matchRoutes: ['/erp/call-tasks', '/erp/call-schedules'],
  },
  { type: 'link', key: 'erpApprovals', access: 'erp', to: '/erp/approvals', label: 'Approvals', icon: FileCheck, badgeKey: 'approvalsCount' },
  { type: 'link', key: 'erpApprovals', access: 'erp', to: '/erp/bill-approvals', label: 'Bill Approvals', icon: ReceiptText, badgeKey: 'billApprovalsCount' },
  { type: 'link', key: 'erpOperations', access: 'erp', to: '/erp/pipeline', label: 'Pipeline', icon: ClipboardList },
  { type: 'link', key: 'erpCnUpdation', access: 'erp', to: '/erp/inbound-ewb', label: 'Inbound e-Way Bills', icon: FileCheck2 },
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

  // ─── Fleet: Operate ─────────────────────────────────────────────────────────
  // Har group ek future hub hai aur uske children uske future tabs. Jab hub page
  // ban jaayega (e.g. /fleet/fuel), group ek plain link ban jaata hai — sidebar
  // ki row wahin rehti hai, sirf `to` badalta hai. Isi liye children ka order
  // tab-order ke barabar rakha gaya hai.
  { type: 'section', label: 'Operate', access: 'fleet' },
  // Live hub — the Fleet landing. Tabs Live/Insights/Coverage/Daily digest in
  // pages/Fleet/LiveHub.jsx; the map is the default and fills the viewport.
  // Live Tracking had no sidebar entry at all before this work — it was
  // reachable only from two links buried far down the old dashboard.
  // `end` so this row is active on /fleet exactly and does not also light up
  // for /fleet/fuel, /fleet/trips, /fleet/alerts and /fleet/places.
  {
    type: 'link',
    key: 'overview',
    access: 'fleet',
    to: '/fleet',
    label: 'Live',
    icon: Radio,
    end: true,
    matchRoutes: ['/live-tracking', '/overview', '/fleet-coverage', '/digest'],
  },
  // Trips hub — tabs Journeys/Deviations/Routes in pages/Fleet/TripsHub.jsx.
  // matchRoutes keeps the row lit on the standalone trip screens the hub links
  // out to: /trip/new (creation flow), /trip/:id, /trip-management/trip/:id
  // (detail) and /routes/add. None of those live under /fleet/trips.
  {
    type: 'link',
    key: 'vehicleActivity',
    access: 'fleet',
    to: '/fleet/trips',
    label: 'Trips',
    icon: RouteIcon,
    matchRoutes: ['/fleet/trips', '/trip', '/trip-management', '/routes'],
  },
  // Fuel hub — seven sidebar rows collapsed into one. Tabs Logs/Checks/Costs
  // live inside pages/Fleet/FuelHub.jsx; "AdBlue" is a fuel-type facet there,
  // not a destination, so the same fluid no longer appears under two names.
  // Old routes still resolve: App.jsx redirects each to its hub tab.
  // matchRoutes on a link keeps the row highlighted on the standalone create/
  // detail pages the hub links out to (they are not under /fleet/fuel).
  {
    type: 'link',
    key: 'vehicleActivity',
    access: 'fleet',
    to: '/fleet/fuel',
    label: 'Fuel',
    icon: Fuel,
    matchRoutes: [
      '/fleet/fuel',
      '/mileage-tracking',
      '/adblue-tracking',
      '/field-agent-fuel',
      '/fuel-integrity',
      '/fuel-comparison',
      '/fuel-spend',
      '/def-ledger',
    ],
  },
  // Alerts hub — four sidebar rows collapsed into one. Tabs Inbox/Documents/
  // Anomalies/FleetEdge feed live in pages/Fleet/AlertsHub.jsx. The feeds are
  // deliberately NOT merged (owner-alerts is the curated superset of the raw
  // fleet-alerts timeline, and both paginate server-side) — the tab labels
  // carry the distinction instead. Old routes redirect from App.jsx.
  //
  // '/geofence/zones' is intentionally absent: zone DEFINITION is master data
  // and lives under Places, while zone/loss exceptions live here.
  // No matchRoutes needed: none of the absorbed screens has a sub-route that
  // persists (the legacy paths redirect away immediately), so NavLink's own
  // prefix match on /fleet/alerts is enough. Listing '/geofence' here would be
  // actively wrong — isGroupActive() matches by prefix, so it would also catch
  // /geofence/zones and highlight Alerts while the user is in Places.
  { type: 'link', key: 'fleetIntelligence', access: 'fleet', to: '/fleet/alerts', label: 'Alerts', icon: Bell },

  // ─── Manage: shared master data ─────────────────────────────────────────────
  // Vehicles aur Drivers dono module use karte hain, isliye inpe module gate
  // nahi lagta — sirf apni feature-flag key. moduleAccess.js ka SHARED_FLAG_KEYS
  // dekho. Pehle ye top par float karte the; ab "Manage" section me hain, jisse
  // ERP-only org ka ERP block aur Fleet-only org ka Operate block top par aata hai.
  { type: 'section', label: 'Manage' },
  // Vehicles hub — three rows collapsed into one. Tabs Vehicles (Table/Grid
  // facets) and Service & Repairs live in pages/Fleet/VehiclesHub.jsx.
  // No matchRoutes: NavLink without `end` already prefix-matches every
  // /vehicles/* route, including Vehicle 360 at /vehicles/:registrationNumber
  // and the add/bulk-upload forms.
  { type: 'link', key: 'vehicles', to: '/vehicles', label: 'Vehicles', icon: Truck },
  // Pehle "Workforce" group tha jiske andar Employee + User Management thay.
  // Driver directory rozana ka kaam hai aur RBAC setup-time ka, isliye Drivers
  // yahan plain link hai aur Users & Access neeche Profile group me chala gaya.
  { type: 'link', key: 'drivers', to: '/drivers', label: 'Drivers', icon: Users },
  // Places hub — tabs Fuel pumps/Geofence zones in pages/Fleet/PlacesHub.jsx.
  // "Places" not "Locations": LocationSwitcher/BranchContext already use
  // "location" to mean a business branch, and that one changes X-Branch-Id for
  // the whole app. matchRoutes covers /locations/add, which stays standalone.
  {
    type: 'link',
    key: 'locations',
    access: 'fleet',
    to: '/fleet/places',
    label: 'Places',
    icon: MapPin,
    matchRoutes: ['/fleet/places', '/locations', '/geofence/zones'],
  },

  // ─── Review: read-only, low-frequency ───────────────────────────────────────
  { type: 'section', label: 'Review' },
  { type: 'link', key: 'reports', to: '/reports', label: 'Reports', icon: FileText },
  { type: 'link', key: 'khataLedger', to: '/khata-ledger', label: 'Ledger', icon: BookOpen },

  // ─── Account / admin ────────────────────────────────────────────────────────
  { type: 'section', label: 'Account' },
  // `key: null` on the group — guaranteed fallback. Profile must stay reachable
  // for every authenticated user regardless of plan; gating it can lock users
  // out with no recovery path. "My Profile" child is also unkeyed, so the group
  // always has at least one visible child and never disappears.
  //
  // /settings and /settings/fleetedge-accounts had ZERO inbound links anywhere —
  // unreachable except by typing the URL. FleetEdge holds the telemetry tokens,
  // so a broken integration had no in-app repair path at all. That is fixed here.
  {
    type: 'group',
    groupId: 'account',
    key: null,
    label: 'Profile',
    icon: User,
    children: [
      { to: '/profile', label: 'My Profile', end: true },
      { to: '/settings', label: 'Settings', end: true },
      { to: '/settings/fleetedge-accounts', label: 'FleetEdge Accounts' },
      { to: '/access-control', label: 'Users & Access', key: 'drivers' },
      { to: '/audit-trail', label: 'Audit Trail', key: 'fleetIntelligence' },
    ],
    matchRoutes: [
      '/profile',
      '/settings',
      '/settings/fleetedge-accounts',
      '/access-control',
      '/access-control/assigned-employees',
      '/audit-trail',
    ],
  },
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
