import React, { useState } from 'react';
import Ico from './routeHubIcons.jsx';

/* ================= primitives ================= */

export function Kpi({ accent, ic, l, v, u, s, c, tint, vc }) {
  const style = {
    '--c': c || 'var(--fg-secondary)',
    '--tint': tint || 'var(--bg-subtle)',
  };
  if (vc) style['--vc'] = vc;
  return (
    <div className={`kpi ${accent ? 'kpi--accent' : ''}`} style={style}>
      <div className="kpi-top">
        <span className="ic">
          <Ico n={ic} s={15} />
        </span>
        <span>{l}</span>
      </div>
      <div className="kpi-val">
        {v}
        {u ? <small> {u}</small> : null}
      </div>
      <div className="kpi-sub">{s}</div>
    </div>
  );
}

export function KpiRow({ items, n }) {
  return (
    <div className="kpis" style={n ? { '--n': n } : undefined}>
      {items.map((k) => (
        <Kpi key={k.l} {...k} />
      ))}
    </div>
  );
}

export function Seg({ options, value, onChange, className }) {
  return (
    <div className={`seg ${className || ''}`}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pill({ c, tint, children }) {
  return (
    <span className="pill" style={{ '--c': c, '--tint': tint }}>
      {children}
    </span>
  );
}

export function Plate({ children, style }) {
  return (
    <span className="plate" style={style}>
      {children}
    </span>
  );
}

export function Empty({ title, sub, tone = '#187A32', icon = 'check' }) {
  return (
    <div className="empty">
      <span style={{ color: tone }}>
        <Ico n={icon} s={28} />
      </span>
      <b>{title}</b>
      <span>{sub}</span>
    </div>
  );
}

/** Table-shaped empty state — the design puts <div class="empty"> inside a lone cell. */
export function TableEmpty({ colSpan = 1, ...rest }) {
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan}>
          <Empty {...rest} />
        </td>
      </tr>
    </tbody>
  );
}

/** Refresh button that replays the mockup's one-shot icon spin on each press. */
export function RefreshButton({ onClick, busy, label = 'Refresh' }) {
  const [spinKey, setSpinKey] = useState(0);
  return (
    <button
      type="button"
      className="btn"
      disabled={busy}
      onClick={() => {
        setSpinKey((k) => k + 1);
        onClick?.();
      }}
    >
      <span key={spinKey} className="spin" style={{ display: 'flex' }}>
        <Ico n="refresh" />
      </span>
      {label}
    </button>
  );
}
