import { MessageSquare, Radio, PencilLine } from 'lucide-react';
const ODOMETER_MODES = [
  {
    key: 'INTERACTIVE',
    label: 'Ask driver (Interactive)',
    icon: <MessageSquare size={16} />,
    desc: 'WhatsApp bot asks driver for dash photo or typed reading. Falls back to FleetEdge if unresponsive.',
  },
  {
    key: 'FLEETEDGE',
    label: 'Auto FleetEdge (Telematics Sync)',
    icon: <Radio size={16} />,
    desc: 'Pulls the CAN-bus telematics odometer at the bill timestamp automatically.',
  },
  {
    key: 'MANUAL',
    label: 'Manual only (Physical Ledger)',
    icon: <PencilLine size={16} />,
    desc: 'Requires human-verified dash photo or typed reading. Never syncs automatically from telematics.',
  },
];

export default ODOMETER_MODES;
