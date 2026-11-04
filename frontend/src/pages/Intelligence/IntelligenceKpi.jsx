import InfoTip from '@/components/redesign/InfoTip';

/**
 * IntelligenceKpi — one number the owner reads before anything else.
 *
 * Label, value, one line of context. Colour is meaning only: the value turns
 * red when something needs the owner and amber when it is worth a look; a
 * calm number stays ink. An unknown value is a dash with the reason in the
 * context line, never a 0. When the number has a place to go, the whole tile
 * is the button.
 */
export default function IntelligenceKpi({
  label,
  value,
  suffix = null,
  context = null,
  tone = 'info',
  why = null,
  onOpen = null,
  openLabel = null,
}) {
  const body = (
    <>
      <span className="intel-kpi-label">{label}</span>
      <span className="intel-kpi-value" data-tone={tone}>
        {value ?? '—'}
        {suffix ? <span className="intel-kpi-suffix">{suffix}</span> : null}
      </span>
      {context ? <span className="intel-kpi-context">{context}</span> : null}
    </>
  );

  return (
    <div className="intel-kpi">
      {onOpen ? (
        <button
          type="button"
          className="intel-kpi-hit"
          onClick={onOpen}
          aria-label={openLabel ?? `${label}: ${value ?? 'unknown'}`}
        >
          {body}
        </button>
      ) : (
        <div className="intel-kpi-hit">{body}</div>
      )}
      {why?.text ? (
        <span className="intel-kpi-why">
          <InfoTip text={why.text} basis={why.basis} label={`About ${label}`} />
        </span>
      ) : null}
    </div>
  );
}
