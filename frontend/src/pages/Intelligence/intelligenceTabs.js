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
  },
  {
    id: 'vehicles',
    label: 'Trucks',
    hint: 'Which trucks are doing well or slipping, and why.',
  },
  {
    id: 'drivers',
    label: 'Drivers',
    hint: 'Which drivers are doing well or slipping, and why.',
  },
  {
    id: 'runs',
    label: 'Loaded & empty runs',
    hint: 'How much of the driving carried load.',
  },
  {
    id: 'idling',
    label: 'Idling',
    hint: 'Every long idle with the engine on.',
  },
  {
    id: 'cruise',
    label: 'Cruise & gears',
    hint: 'Steady highway driving and gear use.',
  },
  {
    id: 'overspeed',
    label: 'Overspeed',
    hint: 'Every time a truck stayed over the limit.',
  },
  {
    id: 'mileage',
    label: 'Mileage & DEF',
    hint: 'Best and worst km/L and DEF use.',
  },
  {
    id: 'fuel',
    label: 'Fuel checks',
    hint: 'Fuel that went down while parked.',
  },
  {
    id: 'detours',
    label: 'Detours',
    hint: 'Runs that left the usual road and came back.',
  },
  {
    id: 'places',
    label: 'Places',
    hint: 'Places waiting for your answer, and the busiest places.',
  },
];

/** The tab that opens when the URL does not name one. */
export const DEFAULT_INTELLIGENCE_TAB = 'issues';

/** The tab whose content lists instances from /api/intelligence/instances. */
export const INSTANCE_TABS = {
  idling: 'idle',
  cruise: 'cruise',
  overspeed: 'overspeed',
  fuel: 'fuel_unexplained',
  detours: 'detour',
};

/**
 * The tab to show for a URL. An unknown or missing tab falls back to the
 * first one, so a stale link never lands on a blank page.
 */
export function resolveIntelligenceTab(requested) {
  const found = INTELLIGENCE_TABS.find((tab) => tab.id === requested);
  return found ? found.id : DEFAULT_INTELLIGENCE_TAB;
}
