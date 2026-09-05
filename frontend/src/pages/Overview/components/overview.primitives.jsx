import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

/**
 * Shared presentational primitives for the redesigned Overview control-center.
 * Everything is driven by the cluster design tokens (index.css) so both themes
 * flip cleanly. Presentation only — no data fetching lives here.
 */

/** Glass panel wrapper with a consistent header (eyebrow + question + action). */
export function Panel({ eyebrow, question, action, className = '', bodyClassName = '', children, id }) {
  return (
    <section id={id} className={`ov-panel flex flex-col p-5 ${className}`}>
      {(eyebrow || action) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <div className="cluster-eyebrow">{eyebrow}</div>}
            {question && <div className="text-dim mt-1 text-xs">{question}</div>}
          </div>
          {action}
        </header>
      )}
      <div className={`flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}

/** Full-width section divider: title on the left, the question it answers on the right. */
export function SectionHeader({ title, question }) {
  return (
    <div className="ov-section">
      <span className="ov-section-title">{title}</span>
      {question && <span className="ov-section-q">{question}</span>}
    </div>
  );
}

const TONE_CLASS = {
  critical: 'ov-pill--critical',
  caution: 'ov-pill--caution',
  ok: 'ov-pill--ok',
  inert: 'ov-pill--inert',
  brand: 'ov-pill--brand',
};

/** Reserved-semantics status pill; always carries a word, never colour alone. */
export function StatusPill({ tone = 'inert', children }) {
  return <span className={`ov-pill ${TONE_CLASS[tone] || TONE_CLASS.inert}`}>{children}</span>;
}

/**
 * Trend chip. `value` is a signed number (delta) or null when no comparison
 * exists yet — in that case we render a muted em dash placeholder, never a fake
 * number. `goodWhenUp` flips the colour semantics (waste going up is bad).
 */
export function Trend({ value, unit = '%', goodWhenUp = true, placeholder = 'no prior period' }) {
  if (value == null || Number.isNaN(value)) {
    return (
      <span className="text-dim inline-flex items-center gap-1 text-[11px]">
        <Minus size={12} /> {placeholder}
      </span>
    );
  }
  const up = value > 0;
  const flat = value === 0;
  const good = flat ? null : up === goodWhenUp;
  const color = good == null ? 'var(--inert)' : good ? 'var(--ok)' : 'var(--critical)';
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="num inline-flex items-center gap-0.5 text-[11px] font-semibold" style={{ color }}>
      <Icon size={12} />
      {up ? '+' : ''}
      {value}
      {unit}
    </span>
  );
}

/**
 * KPI tile. `primary` gives the single most important metric stronger emphasis.
 * Optional `to` makes the whole tile a link.
 */
export function KpiTile({ label, icon, value, sub, trend, tone, primary = false, to, note }) {
  const body = (
    <>
      <span className="ov-kpi-label">
        {icon}
        {label}
      </span>
      <span className="ov-kpi-value" style={tone ? { color: tone } : undefined}>
        {value}
      </span>
      <div className="flex items-center justify-between gap-2">
        {sub ? <span className="ov-kpi-sub">{sub}</span> : <span />}
        {trend}
      </div>
    </>
  );
  const cls = `ov-kpi ${primary ? 'ov-kpi--primary' : ''}`;
  const tile = to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );

  // `note` sits OUTSIDE the Link: a popover trigger is a button, and nesting a
  // button inside an anchor is invalid markup — the click would also navigate.
  if (!note) return tile;
  return (
    <div className="ov-kpi-shell">
      {tile}
      <span className="ov-kpi-note">{note}</span>
    </div>
  );
}
