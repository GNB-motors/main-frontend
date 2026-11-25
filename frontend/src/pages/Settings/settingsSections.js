import { MapPin, Mail, Radio, Timer } from 'lucide-react';

export const SETTINGS_SECTIONS = [
  {
    key: 'locations',
    group: 'Fleet',
    label: 'Locations',
    hint: 'Branches and depots',
    icon: MapPin,
  },
  {
    key: 'fleet-data',
    group: 'Fleet',
    label: 'Fleet data',
    hint: 'FleetEdge and coverage',
    icon: Radio,
  },
  { key: 'idling', group: 'Rules', label: 'Idling', hint: 'When a stop is idling', icon: Timer },
  {
    key: 'email-reports',
    group: 'Reports',
    label: 'Email reports',
    hint: 'Daily and weekly fuel report',
    icon: Mail,
  },
];

const MANAGERS = ['OWNER', 'MANAGER'];

/**
 * What this viewer may see and change. Each gate is the one the API behind it
 * enforces, so a section never opens onto a 403.
 */
export function settingsAccess({ role, fleetAccess, coverageFlag }) {
  const manager = MANAGERS.includes(role);
  return {
    manageLocations: manager,
    editIdling: manager,
    // GET /api/fleetedge/accounts: MANAGER, OWNER, SUPER_ADMIN
    fleetEdgeAccounts: fleetAccess && (manager || role === 'SUPER_ADMIN'),
    // GET /api/fleet-coverage: OWNER, MANAGER, behind the fleetIntelligence flag
    coverage: fleetAccess && coverageFlag && manager,
    idling: fleetAccess,
    // GET /api/email-report-settings: OWNER, MANAGER. PATCH: OWNER only.
    // These gates are guidance for the UI — the backend is what enforces
    // them, and it is the only thing that can.
    emailReports: manager,
    editEmailReports: role === 'OWNER',
  };
}

/** Visible sections under their group headings, in order; empty groups drop out. */
export function groupSections(sections) {
  const groups = [];
  sections.forEach((s) => {
    const last = groups[groups.length - 1];
    if (last && last.label === s.group) last.items.push(s);
    else groups.push({ label: s.group, items: [s] });
  });
  return groups;
}

export function visibleSections(access) {
  return SETTINGS_SECTIONS.filter((s) => {
    if (s.key === 'fleet-data') return access.fleetEdgeAccounts || access.coverage;
    if (s.key === 'idling') return access.idling;
    if (s.key === 'email-reports') return access.emailReports;
    return true;
  });
}
