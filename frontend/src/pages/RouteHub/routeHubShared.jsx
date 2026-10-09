import React, { useState } from 'react';
import Ico from './routeHubIcons.jsx';

/* ================= primitives ================= */

export function Kpi({ accent, ic, l, v, u, s, c, tint, vc, loading }) {
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
      {loading ? (
        <>
          <div className="kpi-val">
            <Skel w="45%" h={26} />
          </div>
          <div className="kpi-sub">
            <Skel w="70%" h={10} />
          </div>
        </>
      ) : (
        <>
          <div className="kpi-val">
            {v}
            {u ? <small> {u}</small> : null}
          </div>
          <div className="kpi-sub">{s}</div>
        </>
      )}
    </div>
  );
}

/** `loading` keeps each card's label and icon and shimmers only the numbers. */
export function KpiRow({ items, n, loading = false }) {
  return (
    <div className="kpis" style={n ? { '--n': n } : undefined} aria-busy={loading || undefined}>
      {items.map((k) => (
        <Kpi key={k.l} {...k} loading={loading} />
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

/* ================= loading skeletons ================= */

/**
 * A shimmering placeholder. It is tinted from the text colour, so the same
 * block reads on a plain card, the blue accent KPI and in dark mode.
 */
export function Skel({ w = '100%', h = 12, r, style }) {
  return (
    <span
      className="skel"
      aria-hidden="true"
      style={{ width: w, height: h, borderRadius: r, ...style }}
    />
  );
}

// Fixed widths per row/column so the placeholder looks like data, not a grid.
const SKEL_WIDTHS = ['72%', '48%', '60%', '38%', '66%', '54%'];
const skelWidth = (i, j) => SKEL_WIDTHS[(i * 2 + j) % SKEL_WIDTHS.length];

/** A table body of shimmering cells; the first column is shaped like a plate. */
export function TableSkeleton({ cols, rows = 6 }) {
  return (
    <tbody aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }, (_, j) => (
            <td key={j}>
              {j === 0 ? <Skel w={92} h={22} r={6} /> : <Skel w={skelWidth(i, j)} h={11} />}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

/** List rows (`.rows .row`, as in the overview panels) while they load. */
export function RowsSkeleton({ n = 3 }) {
  return (
    <div className="rows" aria-busy="true">
      {Array.from({ length: n }, (_, i) => (
        <div className="row" key={i}>
          <Skel w={88} h={22} r={6} />
          <span className="sp" />
          <Skel w={skelWidth(i, 1)} h={11} style={{ maxWidth: 90 }} />
        </div>
      ))}
    </div>
  );
}

/** What a view looks like before its code arrives: heading, KPI cards, a table card. */
export function ViewSkeleton() {
  return (
    <section className="view" aria-busy="true" aria-label="Loading">
      <div className="phead">
        <div className="t">
          <Skel w={220} h={24} />
          <Skel w={420} h={12} style={{ marginTop: 10 }} />
        </div>
      </div>
      <div className="kpis" style={{ '--n': 4 }}>
        {Array.from({ length: 4 }, (_, i) => (
          <div className="kpi" key={i}>
            <div className="kpi-top">
              <Skel w={110} h={12} />
            </div>
            <div className="kpi-val">
              <Skel w="45%" h={26} />
            </div>
            <div className="kpi-sub">
              <Skel w="70%" h={10} />
            </div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-head">
          <Skel w={180} h={16} />
        </div>
        <div className="tblwrap">
          <table className="tbl">
            <TableSkeleton cols={6} />
          </table>
        </div>
      </div>
    </section>
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
