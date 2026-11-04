import { Navigation, ChevronDown } from 'lucide-react';
import { formatKnownEtaLine, matchKnownEta } from '../../lib/knownEta';

/**
 * The destination we actually know for this truck, with the arrival band.
 *
 * This is the known-destination board (`/api/eta/known`): a place the trip
 * plan or a SAP dispatch already named, not a guess. When a truck has one,
 * it is what the panel leads with.
 */
export default function KnownDestinationSection({ knownEtas = [], registrationNumber }) {
  const line = formatKnownEtaLine(matchKnownEta(knownEtas, registrationNumber));
  if (!line) return null;

  return (
    <details className="sec" open>
      <summary>
        <Navigation size={16} aria-hidden="true" />
        Known destination
        <span className="chev">
          <ChevronDown size={16} aria-hidden="true" />
        </span>
      </summary>
      <div className="secbody">
        <div className="kv">
          <span className="k">Destination</span>
          <span className="v">{line}</span>
        </div>
      </div>
    </details>
  );
}
