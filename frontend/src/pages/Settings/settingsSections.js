import { MapPin, MessageCircle, Radio, Timer } from 'lucide-react';

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
    key: 'whatsapp',
    group: 'Rules',
    label: 'WhatsApp bills',
    hint: 'Odometer on fuel bills',
    icon: MessageCircle,
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
    // /api/whatsapp/settings: OWNER, MANAGER
    whatsapp: fleetAccess && manager,
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
    if (s.key === 'whatsapp') return access.whatsapp;
    return true;
  });
}
