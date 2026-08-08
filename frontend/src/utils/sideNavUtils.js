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
} from 'lucide-react';

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
 * type 'link'  -> single NavLink.
 *                 fields: { key, to, label, icon, end? }
 * type 'group' -> collapsible dropdown.
 *                 fields: { key?, groupId?, label, icon, children[], matchRoutes[] }
 *                 children:    [{ to, label, end?, key? }]
 *                 matchRoutes: routes jinpe hone par group apne aap expand rahe
 *                              (chhupe/deep routes bhi include karo).
 */
export const SIDE_NAV_ITEMS = [
  { type: 'link', key: 'overview', to: '/overview', label: 'Overview', icon: Grid },
  { type: 'link', key: 'reports',  to: '/reports',  label: 'Reports',  icon: FileText },
  {
    type: 'group',
    groupId: 'fuelManagement',
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

  { type: 'link', key: 'drivers',   to: '/drivers',   label: 'Employees', icon: Users  },
  { type: 'link', key: 'locations', to: '/locations', label: 'Locations', icon: MapPin },
  { type: 'link', key: 'khataLedger', to: '/khata-ledger', label: 'Khata Ledger', icon: BookOpen },

  // ─── ISOCL ERP (split by pipeline phase) ───────────────────────────────────
  // Har group alag feature-flag children use karta hai — koi bhi group jisme
  // koi child enabled na ho, poora hide ho jaata hai (Sidebar.jsx).
  {
    type: 'group',
    groupId: 'erpPlanning',
    label: 'Planning',
    icon: PhoneCall,
    children: [
      { to: '/erp/call-tasks', label: 'Call Tasks', key: 'erpCallPlanning' },
      { to: '/erp/call-schedules', label: 'Call Schedules', key: 'erpCallPlanning' },
      { to: '/erp/delivery-orders', label: 'Delivery Orders', key: 'erpDeliveryOrders' },
    ],
    matchRoutes: ['/erp/call-tasks', '/erp/call-schedules', '/erp/delivery-orders'],
  },
  {
    type: 'group',
    groupId: 'erpOperations',
    label: 'Operations',
    icon: ClipboardList,
    children: [
      { to: '/erp/placement-board', label: 'Placement Board', key: 'erpPlacement' },
      { to: '/erp/placements', label: 'Placements', key: 'erpPlacement' },
      { to: '/erp/trips', label: 'Trip Dashboard', key: null },
      { to: '/erp/advances', label: 'Trip Advances', key: 'erpAdvances' },
      { to: '/erp/consignments', label: 'CN Updation', key: 'erpCnUpdation' },
      { to: '/erp/trip-close', label: 'Trip Close', key: 'erpTripClose' },
      { to: '/erp/pods', label: 'POD / Challan', key: 'erpPod' },
      { to: '/erp/unloading', label: 'Unloading Entry', key: 'erpUnloading' },
    ],
    matchRoutes: [
      '/erp/placement-board',
      '/erp/placements',
      '/erp/trips',
      '/erp/advances',
      '/erp/consignments',
      '/erp/trip-close',
      '/erp/pods',
      '/erp/unloading',
    ],
  },
  { type: 'link', key: 'erpBilling', to: '/erp/sale-bills', label: 'Sale Bills', icon: Receipt },
  {
    type: 'group',
    groupId: 'erpAccounts',
    label: 'Accounts',
    icon: Banknote,
    children: [
      { to: '/erp/outstanding', label: 'Outstanding', key: 'erpAccounts' },
      { to: '/erp/receipts', label: 'Receipts', key: 'erpAccounts' },
      { to: '/erp/vendor-payments', label: 'Vendor Payments', key: 'erpAccounts' },
      { to: '/erp/supplier-payments', label: 'Supplier Payments', key: 'erpAccounts' },
      { to: '/erp/ledger', label: 'Ledger', key: 'erpAccounts' },
    ],
    matchRoutes: [
      '/erp/outstanding',
      '/erp/receipts',
      '/erp/vendor-payments',
      '/erp/supplier-payments',
      '/erp/ledger',
    ],
  },
  { type: 'link', key: 'erpFinance', to: '/erp/finance', label: 'Finance', icon: Landmark },
  {
    type: 'group',
    groupId: 'erpMasters',
    label: 'Masters',
    icon: Settings,
    children: [
      { to: '/erp/approvals', label: 'Approvals', key: 'erpMasters' },
      { to: '/erp/parties', label: 'Party Master', key: 'erpMasters' },
      { to: '/erp/rates', label: 'Rate Master', key: 'erpMasters' },
      { to: '/erp/vendors', label: 'Vendor Master', key: 'erpMasters' },
      { to: '/erp/material-compatibility', label: 'Material Compatibility', key: 'erpMasters' },
      { to: '/erp/advance-masters', label: 'Advance Masters', key: 'erpAdvances' },
      { to: '/erp/settings', label: 'ERP Settings', key: 'erpMasters' },
    ],
    matchRoutes: [
      '/erp/approvals',
      '/erp/parties',
      '/erp/rates',
      '/erp/vendors',
      '/erp/material-compatibility',
      '/erp/advance-masters',
      '/erp/settings',
    ],
  },

  // ─── Geofence group ───────────────────────────────────────────────────────
  // Both sub-pages are grouped under a single collapsible "Geofence" dropdown.
  // This matches the nav layout shown in the client screenshots (Image 2).
  ...(import.meta.env.VITE_GEOFENCE_FLEETEDGE_ENABLED === 'false' ? [] : [{
    type: 'group',
    key: null,
    label: 'Geofence',
    icon: Navigation,
    children: [
      { to: '/geofence',       label: 'Anomalies'     },
      { to: '/geofence/zones', label: 'Zones & Alerts' },
    ],
    matchRoutes: ['/geofence', '/geofence/zones'],
  }]),

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
 * Kya current path is group ke andar aata hai? (exact match ya sub-route)
 * Group ko auto-expand / auto-close karne ke liye use hota hai.
 */
export const isGroupActive = (group, pathname) =>
  (group.matchRoutes || []).some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );