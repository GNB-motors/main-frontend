import { Truck, Clock, ShieldAlert, Repeat } from 'lucide-react';
import TypeBadge from './TypeBadge';
import StateChip from './StateChip';
import typeStyle from './placeTypes';
import {
  effectiveType,
  hasRisk,
  minutesLabel,
  placeStats,
  placeSubtitle,
  placeTitle,
  typeLabel,
} from './placeIntelligenceModel';

const GUESS_PREFIX = { engine: 'Looks like', leaning: 'Maybe', legacy: 'Marked as' };

/** One place in the list: what it is, where, and how busy — one click opens it. */
export default function PlaceCard({ site, selected, onSelect, isAudit = false }) {
  const { type, source } = effectiveType(site);
  const confirmed = site.status === 'CONFIRMED';
  const st = placeStats(site);
  const risk = site.risk || {};
  const incidents = (risk.theftIncidents || 0) + (risk.unauthRefuelIncidents || 0);
  return (
    <button
      type="button"
      className={`pi-card${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect(site._id)}
      aria-pressed={selected}
    >
      <TypeBadge type={type} hollow={!confirmed} />
      <span className="pi-card-body">
        <span className="pi-card-title">{placeTitle(site)}</span>
        <span className="pi-card-sub">{placeSubtitle(site)}</span>
        <span className="pi-card-meta">
          {isAudit ? (
            <span className="status-chip status-chip--inert">Spot check</span>
          ) : (
            <StateChip site={site} />
          )}
          {!confirmed && source !== 'none' ? (
            <span className="pi-guess" style={{ '--pi-type': typeStyle(type).color }}>
              {GUESS_PREFIX[source]} {typeLabel(type).toLowerCase()}
            </span>
          ) : null}
        </span>
        <span className="pi-card-meta">
          {st.visits != null ? (
            <span title="Stops here">
              <Repeat size={12} aria-hidden="true" /> {st.visits} stops
            </span>
          ) : null}
          {st.trucks != null ? (
            <span title="Different trucks">
              <Truck size={12} aria-hidden="true" /> {st.trucks}
            </span>
          ) : null}
          {st.medianDwellMin != null ? (
            <span title="Typical stop length">
              <Clock size={12} aria-hidden="true" /> {minutesLabel(st.medianDwellMin)}
            </span>
          ) : null}
          {hasRisk(site) ? (
            <span className="pi-risk">
              <ShieldAlert size={12} aria-hidden="true" /> {incidents} fuel incident
              {incidents === 1 ? '' : 's'}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}
