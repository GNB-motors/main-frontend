/**
 * A loading card keeps its own frame — border, heading, static hint — and
 * shimmers only the parts still waiting on a response. Replacing the whole
 * card hid WHAT was loading and moved the layout twice: once when the
 * skeleton mounted, again when the real card took its place.
 */

/**
 * Per-card skeleton. `title` and `hint` are static copy, so they render as
 * themselves; `pill` and `tabs` stand in for the header bits whose content is
 * a count, which is the one thing the header cannot know yet.
 */
export default function NdCardSkeleton({
  title = null,
  hint = null,
  pill = false,
  tabs = 0,
  rows = 4,
  rowHeight = 44,
  big = false,
}) {
  return (
    <div className="nd-card">
      <div className="nd-card-head">
        {title ? <h2>{title}</h2> : <span className="nd-sk" style={{ width: 140, height: 14 }} />}
        {pill ? (
          <span className="nd-sk" style={{ width: 26, height: 18, borderRadius: 999 }} />
        ) : null}
        <span className="nd-sp" />
        {tabs ? (
          <div className="nd-tabs">
            {[...Array(tabs)].map((_, i) => (
              <span key={i} className="nd-sk" style={{ width: 56, height: 24, borderRadius: 8 }} />
            ))}
          </div>
        ) : hint ? (
          <span className="nd-hint">{hint}</span>
        ) : null}
      </div>
      {big ? (
        <div style={{ padding: '0 var(--space-4) var(--space-3)' }}>
          <span className="nd-sk" style={{ width: '40%', height: 32 }} />
        </div>
      ) : null}
      <div className="nd-sk-rows">
        {[...Array(rows)].map((_, i) => (
          <span key={i} className="nd-sk" style={{ height: rowHeight, borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}
