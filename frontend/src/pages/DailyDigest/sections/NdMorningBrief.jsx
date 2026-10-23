import { Info, Sparkles } from 'lucide-react';
import { BRIEF_SECTION, BRIEF_FALLBACK } from './briefSections';
import NdBriefCard from './NdBriefCard.jsx';

/** The day's leaks ranked biggest-first, led by the one action worth taking first. */
export default function NdMorningBrief({ brief, onOpenVehicle, onRetry }) {
  const rank = (s) => (s.status === 'ok' ? s.rupees || 0 : -1);
  const sections = [...(brief?.sections || [])].sort((a, b) => rank(b) - rank(a));

  // A failed load keeps its place on the page — a section that silently
  // vanishes reads as "this feature doesn't exist", not "this didn't load".
  if (!sections.length) {
    return (
      <section className="nd-brief" id="nd-brief">
        <div className="nd-eyebrow">Morning brief</div>
        <div className="nd-card">
          <div className="nd-empty">
            <span
              className="nd-ok"
              style={{ background: 'rgba(197, 98, 0, 0.12)', color: '#C56200' }}
            >
              <Info size={22} />
            </span>
            <b>Morning brief couldn&apos;t load</b>
            <span>Excess idling and fuel over expected for today will show here.</span>
            {onRetry ? (
              <button type="button" className="nd-btn nd-btn--sm" onClick={onRetry}>
                Try again
              </button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }
  const top = sections[0].status === 'ok' ? sections[0] : null;

  return (
    <section className="nd-brief" id="nd-brief">
      <div className="nd-eyebrow">Morning brief</div>
      {top?.suggestedAction ? (
        <div
          className="nd-brief-start"
          style={{ '--c': (BRIEF_SECTION[top.key] || BRIEF_FALLBACK).c }}
        >
          <span className="nd-brief-start-ico">
            <Sparkles size={16} />
          </span>
          <div>
            <div className="nd-brief-start-k">Start here</div>
            <div className="nd-brief-start-m">{top.suggestedAction}</div>
          </div>
        </div>
      ) : null}
      <div className="nd-cols nd-cols--half">
        {sections.map((s) => (
          <NdBriefCard key={s.key} section={s} onOpenVehicle={onOpenVehicle} />
        ))}
      </div>
    </section>
  );
}
