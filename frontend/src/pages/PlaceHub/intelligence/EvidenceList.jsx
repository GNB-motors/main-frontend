import { Gauge, FileText, Clock, Map as MapIcon, CircleHelp } from 'lucide-react';
import { evidenceLines } from './placeIntelligenceModel';

const KIND_ICON = {
  sensor: Gauge,
  record: FileText,
  pattern: Clock,
  map: MapIcon,
  gap: CircleHelp,
};
const KIND_TITLE = {
  sensor: 'Measured by the truck’s sensors',
  record: 'From your records',
  pattern: 'From stop length and timing — a clue, not proof',
  map: 'From map data',
  gap: 'Not explained yet',
};

/** Why the engine thinks what it thinks, one plain sentence per kind of proof. */
export default function EvidenceList({ engine }) {
  const lines = evidenceLines(engine);
  if (!lines.length)
    return <p className="pi-note">No evidence yet — the next nightly run will look again.</p>;
  return (
    <ul className="pi-why">
      {lines.map((l) => {
        const Icon = KIND_ICON[l.kind] || Clock;
        return (
          <li key={l.id} className={`is-${l.kind}`} title={KIND_TITLE[l.kind]}>
            <Icon size={15} aria-hidden="true" />
            <span>{l.text}</span>
          </li>
        );
      })}
    </ul>
  );
}
