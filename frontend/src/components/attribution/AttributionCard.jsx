import { AlertTriangle, CheckCircle2, HelpCircle, Wrench, User, Mountain, CircleHelp } from 'lucide-react';
import { buildAttributionView, formatSupport, STATUS, VERDICTS } from './attributionData';
import './AttributionCard.css';

const ICONS = {
  ROAD_LOAD: Mountain,
  MACHINE: Wrench,
  DRIVER: User,
  UNEXPLAINED: CircleHelp,
};

const TONE_ICON = {
  caution: AlertTriangle,
  ok: CheckCircle2,
  muted: HelpCircle,
};

/**
 * AttributionCard — "vehicle issue or driver issue, on what evidence?"
 *
 * Deliberately NOT a pie chart. The four parts are measured under different
 * counterfactuals and can overlap, so rendering them as slices of a gap would
 * claim a clean division the backend refuses to make. Each part is shown with
 * its verdict, its sample count and its own reason; an unmeasured part shows a
 * dash and says "not measured" rather than 0%.
 *
 * The learned thresholds and the history they came from are printed at the foot.
 * A verdict the owner cannot audit is not a verdict.
 *
 * Props:
 *   card      the API card (already fetched by the page — this component does no fetching)
 *   onInspect optional; called with a part key when the owner expands the evidence
 */
export default function AttributionCard({ card, onInspect }) {
  const v = buildAttributionView(card);

  if (!card || card.status === STATUS.PROFILE_NOT_LEARNED) {
    return (
      <section className="attr-card attr-card--empty">
        <p className="attr-card__emptyTitle">No cause named yet</p>
        <p className="attr-card__emptyHint">
          This organisation has no learned attribution profile, so the card will not guess. It
          appears once enough closed fuel cycles with a baseline check have been recorded — the
          nightly job learns the thresholds from them.
        </p>
      </section>
    );
  }

  if (card.status === STATUS.NO_GAP) {
    return (
      <section className="attr-card attr-card--empty">
        <p className="attr-card__emptyTitle">Nothing to explain</p>
        <p className="attr-card__emptyHint">
          The most recent closed cycle for this {card.subject?.kind === 'DRIVER' ? 'driver' : 'truck'} met
          its expected mileage, so there is no gap to split.
        </p>
      </section>
    );
  }

  const StatusIcon = TONE_ICON[v.tone] ?? HelpCircle;

  return (
    <section className="attr-card" aria-label="Attribution">
      <header className="attr-card__head">
        <div className="attr-card__headText">
          <h3 className="attr-card__title">Vehicle or driver?</h3>
          <p className="attr-card__headline">
            <StatusIcon size={15} className={`attr-icon attr-icon--${v.tone}`} aria-hidden="true" />
            <span>{v.headline}</span>
          </p>
        </div>
        {v.gap && (
          <div className="attr-card__gap">
            <span className="attr-card__gapValue">{v.gap.headline}</span>
            <span className="attr-card__gapDetail">
              {v.gap.ours} against {v.gap.expected} expected
            </span>
          </div>
        )}
      </header>

      {v.coverage && (
        <p className="attr-card__coverage">
          <HelpCircle size={13} aria-hidden="true" /> {v.coverage.text}
        </p>
      )}

      <ul className="attr-parts">
        {v.parts.map((p) => {
          const Icon = ICONS[p.key] ?? CircleHelp;
          const supportLabel =
            p.support !== null && p.support > 0
              ? formatSupport(p.support, p.key === 'MACHINE' ? 'driver' : 'truck', p.key === 'MACHINE' ? 'drivers' : 'trucks')
              : p.observedGroups !== null
                ? `${p.observedGroups} observed — too few to compare`
                : null;
          return (
            <li key={p.key} className={`attr-part attr-part--${p.tone}`}>
              <div className="attr-part__icon" aria-hidden="true">
                <Icon size={15} />
              </div>
              <div className="attr-part__body">
                <div className="attr-part__top">
                  <span className="attr-part__label">{p.label}</span>
                  <span className={`attr-chip attr-chip--${p.tone}`}>{p.verdictLabel}</span>
                </div>
                <p className="attr-part__why">{p.why}</p>
                <div className="attr-part__meta">
                  {/* An unmeasured part shows a dash. It must never show 0%:
                      "we did not measure this" is not "this was fine". */}
                  <span className="attr-part__excess">{p.excessText}</span>
                  {supportLabel && <span className="attr-part__support">{supportLabel}</span>}
                  {p.cusum?.driftAlarm !== undefined && p.cusum && (
                    <span className="attr-part__cusum">
                      drift detector {p.cusum.cusumS != null ? `at ${p.cusum.cusumS}` : 'alarmed'}
                    </span>
                  )}
                </div>
                {onInspect && p.dataPoints.length > 0 && (
                  <button type="button" className="attr-part__more" onClick={() => onInspect(p.key)}>
                    Show the {p.dataPoints.length} observation{p.dataPoints.length === 1 ? '' : 's'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {v.overAttributed && (
        <p className="attr-card__overAttributed">
          <AlertTriangle size={14} aria-hidden="true" />
          The measured parts overlap, so they do not add up to a clean division of the gap. Read
          them as evidence, not as shares of a pie.
        </p>
      )}

      {v.learned && (
        <footer className="attr-card__learned">
          <p className="attr-card__learnedTitle">Where these thresholds come from</p>
          <dl className="attr-card__learnedGrid">
            {v.learned.rows.map((r) => (
              <div key={r.label} className="attr-card__learnedRow">
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
          <p className="attr-card__learnedNote">
            {v.learned.note}
            {v.learned.samples != null ? ` ${v.learned.samples} closed cycles.` : ''}
          </p>
        </footer>
      )}

      {v.learned === null && card.status !== STATUS.PROFILE_NOT_LEARNED && (
        <p className="attr-card__learnedNote attr-card__learnedNote--warn">
          These thresholds could not be listed. Treat the verdict below them with care.
        </p>
      )}
    </section>
  );
}

export { VERDICTS };