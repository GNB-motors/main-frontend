import { Grid, FileText, Users, User, Truck, MapPin, Fuel, BookOpen, Navigation } from 'lucide-react';

/**
 * Single source of truth for the dashboard sidebar.
 *
 * Har item ke saath uski feature-flag `key` yahin define hoti hai. Sidebar.jsx
 * sirf is list ko map karke render karta hai — naya link add karna ho to bas
 * yahan ek entry add karo (aur `key` do). Sidebar code chedne ki zarurat nahi.
 *
 * `key`   -> feature-flag key. Sidebar isEnabled(key) === true hone par hi item
 *            dikhata hai. `key: null` ka matlab "hamesha dikhao" (no gating),
 *            jaise Profile — guaranteed fallback page.
 *
 * type 'link'  -> single NavLink.
 *                 fields: { key, to, label, icon, end? }
 * type 'group' -> collapsible dropdown.
 *                 fields: { key, label, icon, children[], matchRoutes[] }
 *                 children:    [{ to, label, end? }]
 *                 matchRoutes: routes jinpe hone par group apne aap expand rahe
 *                              (chhupe/deep routes bhi include karo).
 */
export const SIDE_NAV_ITEMS = [
  { type: 'link', key: 'overview', to: '/overview', label: 'Overview', icon: Grid },
  { type: 'link', key: 'reports',  to: '/reports',  label: 'Reports',  icon: FileText },
  {
    type: 'group',
    key: 'vehicles',
    label: 'Vehicles',
    icon: Truck,
    children: [
      { to: '/vehicles',                      label: 'All Vehicles',          end: true },
      { to: '/vehicles/dashboard',            label: 'Vehicle Dashboard'              },
      { to: '/vehicles/service-intelligence', label: 'Service Intelligence'           },
      { to: '/vehicles/add',                  label: 'Add Vehicle'                    },
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
    label: 'Vehicle Activity',
    icon: Truck,
    children: [
      // Trip Management intentionally hidden — route still exists for deep links.
      { to: '/refuel-logs',       label: 'Refuel Logs'      },
      { to: '/mileage-tracking',  label: 'Mileage Tracking' },
      { to: '/model-comparison',  label: 'Model Comparison' },
    ],
    matchRoutes: ['/trip-management', '/refuel-logs', '/mileage-tracking', '/model-comparison'],
  },
  { type: 'link', key: 'drivers',   to: '/drivers',   label: 'Employees', icon: Users  },
  { type: 'link', key: 'locations', to: '/locations', label: 'Locations', icon: MapPin },
  { type: 'link', key: 'fuelComparison', to: '/fuel-comparison', label: 'Fuel Comparison', icon: Fuel },
  { type: 'link', key: null, to: '/field-agent-fuel', label: 'Field Agent Fuel', icon: Fuel },
  { type: 'link', key: 'khataLedger', to: '/khata-ledger', label: 'Khata Ledger', icon: BookOpen },

  // ─── Geofence group ───────────────────────────────────────────────────────
  // Both sub-pages are grouped under a single collapsible "Geofence" dropdown.
  // This matches the nav layout shown in the client screenshots (Image 2).
  {
    type: 'group',
    key: null,
    label: 'Geofence',
    icon: Navigation,
    children: [
      { to: '/geofence',       label: 'Anomalies'     },
      { to: '/geofence/zones', label: 'Zones & Alerts' },
    ],
    matchRoutes: ['/geofence', '/geofence/zones'],
  },

  // Always visible (no feature flag) — guaranteed fallback page.
  { type: 'link', key: null, to: '/profile', label: 'Profile', icon: User },
];

/** Saare dropdown groups (open/close state isi se chalti hai). */
export const SIDE_NAV_GROUPS = SIDE_NAV_ITEMS.filter((item) => item.type === 'group');

/**
 * Kya current path is group ke andar aata hai? (exact match ya sub-route)
 * Group ko auto-expand / auto-close karne ke liye use hota hai.
 */
export const isGroupActive = (group, pathname) =>
  (group.matchRoutes || []).some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );