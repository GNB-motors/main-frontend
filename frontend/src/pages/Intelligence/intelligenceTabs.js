import {
  AlertTriangle,
  ArrowLeftRight,
  Droplets,
  Fuel,
  Gauge,
  MapPin,
  Route,
  Timer,
  Truck,
  Users,
  Zap,
} from 'lucide-react';

/**
 * The Intelligence page's tabs.
 *
 * The tab ids are also the `tab` query parameter, so every link from a
 * digest card, a chip or an issue row lands on a real tab. The hints are
 * the hover help the owner asked for: every tab says what it does before
 * you click it.
 */
export const INTELLIGENCE_TABS = [
  {
    id: 'issues',
    label: 'Issues',
    hint: 'Problems with trucks, sensors or accounts, and what to do.',
    icon: AlertTriangle,
  },
  {
    id: 'vehicles',
    label: 'Trucks',
    hint: 'Which trucks are doing well or slipping, and why.',
    icon: Truck,
  },
  {
    id: 'drivers',
    label: 'Drivers',
    hint: 'Which drivers are doing well or slipping, and why.',
    icon: Users,
  },
  {
    id: 'runs',
    label: 'Loaded & empty runs',
    hint: 'How much of the driving carried load.',
    icon: ArrowLeftRight,
  },
  {
    id: 'idling',
    label: 'Idling',
    hint: 'Every long idle with the engine on.',
    icon: Timer,
  },
  {
    id: 'cruise',
    label: 'Cruise & gears',
    hint: 'Steady highway driving and gear use.',
    icon: Gauge,
  },
  {
    id: 'overspeed',
    label: 'Overspeed',
    hint: 'Every time a truck stayed over the limit.',
    icon: Zap,
  },
  {
    id: 'mileage',
    label: 'Mileage & DEF',
    hint: 'Best and worst km/L and DEF use.',
    icon: Fuel,
  },
  {
    id: 'fuel',
    label: 'Fuel checks',
    hint: 'Fuel that went down while parked.',
    icon: Droplets,
  },
  {
    id: 'detours',
    label: 'Detours',
    hint: 'Runs that left the usual road and came back.',
    icon: Route,
  },
  {
    id: 'places',
    label: 'Places',
    hint: 'Places waiting for your answer, and the busiest places.',
    icon: MapPin,
  },
];

/** The tab that opens when the URL does not name one and nothing needs you. */
export const DEFAULT_INTELLIGENCE_TAB = 'issues';

/** The tab that opens when the URL does not name one and no issue needs you. */
export const DEFAULT_INTELLIGENCE_TAB_WHEN_CLEAR = 'vehicles';

/** The tab whose content lists instances from /api/intelligence/instances. */
export const INSTANCE_TABS = {
  idling: 'idle',
  cruise: 'cruise',
  overspeed: 'overspeed',
  fuel: 'fuel_unexplained',
  detours: 'detour',
};

/**
 * The tab to show for a URL.
 *
 * An unknown or missing tab falls back to the first one, so a stale link
 * never lands on a blank page. `actCount` is the number of open issues that
 * need the owner; when it is not known yet (null) the Issues tab is shown,
 * and when it is known the page opens on the problems if there are any.
 */
export function resolveIntelligenceTab(requested, actCount = null) {
  const found = INTELLIGENCE_TABS.find((tab) => tab.id === requested);
  if (found) return found.id;
  if (actCount === null || actCount === undefined) return DEFAULT_INTELLIGENCE_TAB;
  return actCount > 0 ? DEFAULT_INTELLIGENCE_TAB : DEFAULT_INTELLIGENCE_TAB_WHEN_CLEAR;
}
