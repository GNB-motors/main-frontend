import { Grid, FileText, Users, User, Truck, MapPin, Fuel, BookOpen, ShieldCheck } from 'lucide-react';

/**
 * Single source of truth for the dashboard sidebar.
 *
 * Har item ke saath uski feature-flag `key` yahin define hoti hai. Sidebar.jsx
 * sirf is list ko map karke render karta hai — naya link add karna ho to bas
 * yahan ek entry add karo (aur `key` do). Sidebar code chedne ki zarurat nahi.
 *
 * `key`   -> feature-flag key (SUPER_ADMIN → org level). Sidebar isEnabled(key)
 *            === true hone par hi item dikhता hai. `key: null` ka matlab
 *            "hamesha dikhao" (no gating), jaise Profile — guaranteed fallback page.
 *
 * `permissionModule` -> Roles & Permissions module key (Owner → employee level,
 *            see role.constants.js on the backend). Sidebar canView(module)
 *            === true hone par hi item dikhता hai. `permissionModule: null`
 *            ka matlab "is layer se hamesha dikhao" — OWNER/MANAGER apne aap
 *            full access paate hain (backend resolvePermissions), is field ka
 *            matlab sirf itna hai ki ye nav item kisi specific module se gated
 *            nahi hai.
 *
 * Donon gates independent hain aur dono pass hone chahiye item dikhane ke liye
 * (org-level feature flag AND employee-level permission).
 *
 * type 'link'  -> single NavLink.
 *                 fields: { key, permissionModule, to, label, icon, end? }
 * type 'group' -> collapsible dropdown.
 *                 fields: { key, permissionModule, label, icon, children[], matchRoutes[] }
 *                 children:    [{ to, label, end? }]
 *                 matchRoutes: routes jinpe hone par group apne aap expand rahe
 *                              (chhupe/deep routes bhi include karo).
 */
export const SIDE_NAV_ITEMS = [
  { type: 'link', key: 'overview', permissionModule: 'overview', to: '/overview', label: 'Overview', icon: Grid },
  { type: 'link', key: 'reports', permissionModule: 'reports', to: '/reports', label: 'Reports', icon: FileText },
  {
    type: 'group',
    key: 'vehicles',
    permissionModule: 'vehicles',
    label: 'Vehicles',
    icon: Truck,
    children: [
      { to: '/vehicles', label: 'All Vehicles', end: true },
      { to: '/vehicles/dashboard', label: 'Vehicle Dashboard' },
      { to: '/vehicles/service-intelligence', label: 'Service Intelligence' },
      { to: '/vehicles/add', label: 'Add Vehicle' },
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
  {
    type: 'group',
    key: 'vehicleActivity',
    permissionModule: 'vehicleActivity',
    label: 'Vehicle Activity',
    icon: Truck,
    children: [
      // Trip Management intentionally hidden — route still exists for deep links.
      { to: '/refuel-logs', label: 'Refuel Logs' },
      { to: '/mileage-tracking', label: 'Mileage Tracking' },
      { to: '/model-comparison', label: 'Model Comparison' },
    ],
    matchRoutes: ['/trip-management', '/refuel-logs', '/mileage-tracking', '/model-comparison'],
  },
  {
    type: 'group',
    key: 'drivers',
    permissionModule: 'employees',
    label: 'Employees',
    icon: Users,
    children: [
      { to: '/drivers', label: 'Employee List', end: true },
      { to: '/drivers/roles', label: 'Roles & Permissions' },
    ],
    matchRoutes: ['/drivers', '/drivers/add', '/drivers/roles'],
  },
  { type: 'link', key: 'locations', permissionModule: 'locations', to: '/locations', label: 'Locations', icon: MapPin },
  { type: 'link', key: 'fuelComparison', permissionModule: 'fuelComparison', to: '/fuel-comparison', label: 'Fuel Comparison', icon: Fuel },
  { type: 'link', key: null, permissionModule: 'fieldAgentFuel', to: '/field-agent-fuel', label: 'Field Agent Fuel', icon: Fuel },
  { type: 'link', key: 'khataLedger', permissionModule: 'khataLedger', to: '/khata-ledger', label: 'Khata Ledger', icon: BookOpen },
  // ─── Insurance group ──────────────────────────────────────────────────────
  // Self-contained Insurance CRM feature for fleet clients. key:null +
  // permissionModule:null → visible to everyone out of the box. To gate per-org,
  // set key:'insurance' (and provision that feature flag); to gate per-employee,
  // register an 'insurance' module in role.constants.js and set permissionModule.
  {
    type: 'group',
    key: null,
    permissionModule: null,
    label: 'Insurance',
    icon: ShieldCheck,
    children: [
      { to: '/insurance/overview', label: 'Business Overview', end: true },
      { to: '/insurance/leads', label: 'Leads' },
      { to: '/insurance/communication', label: 'Communication' },
    ],
    matchRoutes: [
      '/insurance/overview',
      '/insurance/leads',
      '/insurance/leads/bulk',
      '/insurance/communication',
    ],
  },

  // Always visible (no feature flag, no permission gate) — guaranteed fallback page.
  { type: 'link', key: null, permissionModule: 'profile', to: '/profile', label: 'Profile', icon: User },
];

/** Saare dropdown groups (open/close state isi se chalti hai). */
export const SIDE_NAV_GROUPS = SIDE_NAV_ITEMS.filter((item) => item.type === 'group');

/**
 * Kya current path is group ke andar aata hai? (exact match ya sub-route).
 * Group ko auto-expand / auto-close karne ke liye use hota hai.
 */
export const isGroupActive = (group, pathname) =>
  (group.matchRoutes || []).some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
