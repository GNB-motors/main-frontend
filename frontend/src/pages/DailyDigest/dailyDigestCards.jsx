import { Link } from 'react-router-dom';
import { Bell, Fuel, Wrench, ArrowRight, ChevronRight, CheckCircle2 } from 'lucide-react';
import { SEV } from './dailyDigestLogic';

/**
 * Presentational atoms for the Daily Digest. Kept separate from
 * dailyDigestLogic.js because that module exports plain functions;
 * react-refresh requires a file to export components OR non-components,
 * never both (rule 15).
 */

export function SeverityPill({ sev }) {
  const s = SEV[sev] || SEV.MEDIUM;
  return <span className={`ov-pill ov-pill--${s.tone}`}>{sev}</span>;
}

export function SectionHeader({ label, count, countTone }) {
  return (
    <div className="ov-section mb-3">
      <span className="cluster-eyebrow">{label}</span>
      {count != null && (
        <span
          className="num text-xs font-semibold"
          style={{ color: countTone || 'var(--cluster-text-dim)' }}
        >
          {count} {count === 1 ? 'item' : 'items'}
        </span>
      )}
    </div>
  );
}

export function KpiCard(props) {
  const { icon: Icon, label, value, sub, to, accent, emphasis } = props;
  const body = (
    <>
      <span className="ov-kpi-label">
        <Icon size={13} style={{ color: accent }} />
        {label}
      </span>
      <span className="ov-kpi-value" style={emphasis ? { color: accent } : undefined}>
        {value}
      </span>
      <span className="ov-kpi-sub">{sub}</span>
    </>
  );
  return to ? (
    <Link to={to} className="ov-kpi">
      {body}
    </Link>
  ) : (
    <div className="ov-kpi">{body}</div>
  );
}

export function ActionCard({ item }) {
  const s = SEV[item.sev] || SEV.MEDIUM;
  const Icon = item.icon || Bell;
  return (
    <div className="ov-panel p-4" style={{ borderLeft: `3px solid ${s.color}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
              color: s.color,
            }}
          >
            <Icon size={16} />
          </span>
          <span className="text-sm font-bold uppercase tracking-wide" style={{ color: s.color }}>
            {item.title}
          </span>
        </div>
        <SeverityPill sev={item.sev} />
      </div>
      <p className="mt-2.5 text-sm leading-snug" style={{ color: 'var(--cluster-text)' }}>
        {item.desc}
      </p>
      {item.meta && <p className="text-dim mt-1 text-xs">{item.meta}</p>}
      <div className="mt-3 flex justify-end">
        <Link to={item.to} className="ov-btn ov-btn--primary">
          {item.cta || 'Review'} <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

export function ActivityCard({ item }) {
  const Icon = item.icon || Fuel;
  return (
    <Link to={item.to} className="ov-panel group flex items-center gap-4 p-4">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{
          background: 'color-mix(in srgb, var(--gnb-400) 10%, transparent)',
          color: 'var(--gnb-400)',
        }}
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-dim text-[11px] font-semibold uppercase tracking-wide">
          {item.label}
        </div>
        <div
          className="num text-2xl font-bold leading-tight"
          style={{ color: 'var(--cluster-text)' }}
        >
          {item.value}
        </div>
        {item.sub && <div className="text-dim text-xs">{item.sub}</div>}
      </div>
      <span
        className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold"
        style={{ color: 'var(--gnb-400)' }}
      >
        View details{' '}
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

export function UpcomingRow({ item }) {
  const Icon = item.icon || Wrench;
  return (
    <Link to={item.to} className="ov-panel group flex items-center gap-3 px-4 py-3">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          background: 'var(--cluster-raised)',
          color: item.tone || 'var(--cluster-text-dim)',
        }}
      >
        <Icon size={15} />
      </span>
      <span className="flex-1 text-sm" style={{ color: 'var(--cluster-text)' }}>
        {item.text}
      </span>
      <ChevronRight
        size={15}
        className="text-dim transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

export function SectionEmpty(props) {
  const { icon: Icon = CheckCircle2, title, hint } = props;
  return (
    <div className="ov-panel flex items-center gap-3 p-4">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: 'color-mix(in srgb, var(--ok) 12%, transparent)', color: 'var(--ok)' }}
      >
        <Icon size={18} />
      </span>
      <div>
        <div className="text-sm font-semibold" style={{ color: 'var(--cluster-text)' }}>
          {title}
        </div>
        {hint && <div className="text-dim text-xs">{hint}</div>}
      </div>
    </div>
  );
}
