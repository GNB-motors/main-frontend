import typeStyle from './placeTypes';
import { typeLabel } from './placeIntelligenceModel';

/** Only the types on screen, plus how to read solid / hollow / ring / zone. */
export default function MapLegend({ types, showZones, showRisk }) {
  return (
    <div className="pi-legend" aria-label="Map legend">
      {types.map((t) => (
        <span key={t}>
          <i className="pi-dot" style={{ '--pi-type': typeStyle(t).color }} /> {typeLabel(t)}
        </span>
      ))}
      <span>
        <i className="pi-dot pi-dot--hollow" style={{ '--pi-type': '#64748b' }} /> Not confirmed yet
      </span>
      {showRisk ? (
        <span>
          <i className="pi-dot pi-dot--hollow" style={{ '--pi-type': '#c62828' }} /> Fuel risk
        </span>
      ) : null}
      {showZones ? (
        <span>
          <i className="pi-dot pi-dot--zone" /> No-signal zone
        </span>
      ) : null}
    </div>
  );
}
