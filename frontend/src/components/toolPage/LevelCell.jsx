/** A value with a short level bar beside it and a small line under it. */
export default function LevelCell({ value, pct, tone = null, note = null }) {
  return (
    <span className="tp-level">
      <span className="tp-level-row">
        <b>{value}</b>
        {pct == null ? null : (
          <span className="tp-level-track" aria-hidden="true">
            <span
              className={tone ? `is-${tone}` : undefined}
              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
            />
          </span>
        )}
      </span>
      {note ? <small>{note}</small> : null}
    </span>
  );
}
