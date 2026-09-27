import { Info } from 'lucide-react';
import typeStyle from './placeTypes';
import {
  EVIDENCE_LABEL,
  confidencePct,
  effectiveType,
  evidenceLines,
  typeLabel,
  aType,
} from './placeIntelligenceModel';

/**
 * The headline answer for a place, worded by whose answer it is: yours, the
 * engine's (with how sure), a weak lean, or nothing yet.
 */
export default function PlaceVerdict({ site }) {
  const e = site.engine || {};
  const { type, source } = effectiveType(site);
  const pct = confidencePct(e.confidence);
  const color = typeStyle(type).color;
  if (site.status === 'CONFIRMED' && source === 'you') {
    const other = e.siteType && e.siteType !== 'UNKNOWN' && e.siteType !== site.siteType;
    return (
      <>
        <div className="pi-verdict">
          <strong>{typeLabel(type)}</strong>
          <span>Confirmed by your team</span>
        </div>
        {other ? (
          <div className="pi-callout pi-callout--info">
            <Info size={15} aria-hidden="true" />
            <span>
              The data looks more like <b>{typeLabel(e.siteType).toLowerCase()}</b>:{' '}
              {(evidenceLines(e)[0] || {}).text || 'see below'}. Worth a second look if trips here
              are reported wrong.
            </span>
          </div>
        ) : null}
      </>
    );
  }
  if (source === 'engine' || (site.status === 'CONFIRMED' && source !== 'none')) {
    return (
      <div className="pi-verdict" style={{ '--pi-type': color }}>
        <strong>Looks like {aType(type)}</strong>
        <span>
          {EVIDENCE_LABEL[e.evidenceLevel] || 'Suggested'}
          {pct != null ? ` · ${pct}% sure` : ''}
        </span>
        {pct != null ? (
          <div className="pi-meter">
            <i style={{ width: `${pct}%` }} />
          </div>
        ) : null}
      </div>
    );
  }
  if (source === 'leaning' || source === 'legacy') {
    return (
      <div className="pi-verdict">
        <strong>Not sure yet — maybe {aType(type)}</strong>
        <span>
          {source === 'leaning'
            ? 'Only one weak clue so far. Your answer settles it.'
            : 'An older rule tagged it this way; the engine has not confirmed it.'}
        </span>
      </div>
    );
  }
  return (
    <div className="pi-verdict">
      <strong>Nothing explains stops here yet</strong>
      <span>No fuel, loading, bills or service records match these stops. Tell us what it is.</span>
    </div>
  );
}
