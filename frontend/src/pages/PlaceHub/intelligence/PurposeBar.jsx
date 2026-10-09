import { PURPOSE_COLOR, purposeShares } from './placeIntelligenceModel';

/** What trucks do at this place, as one stacked bar of their stops. */
export default function PurposeBar({ engine }) {
  const shares = purposeShares(engine);
  if (!shares.length)
    return (
      <p className="pi-note">No clear pattern yet — stops here don’t match any one purpose.</p>
    );
  return (
    <div>
      <div className="pi-bar" role="img" aria-label="What trucks do here">
        {shares.map((p) => (
          <i
            key={p.purpose}
            style={{
              width: `${p.share * 100}%`,
              background: PURPOSE_COLOR[p.purpose] || '#cbd5e1',
            }}
          />
        ))}
      </div>
      <div className="pi-bar-keys">
        {shares.map((p) => (
          <span key={p.purpose}>
            <i style={{ background: PURPOSE_COLOR[p.purpose] || '#cbd5e1' }} />
            {p.label} {Math.round(p.share * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}
