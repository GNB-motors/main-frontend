import Ico from '../../routeHubIcons.jsx';
import { STATUS_FILTERS } from './deviationRules.js';

export default function DeviationFilterBar({
  q,
  setQ,
  from,
  setFrom,
  to,
  setTo,
  status,
  setStatus,
  records,
  open,
  reviewed,
}) {
  return (
    <div className="fbar">
      <label className="field grow">
        <Ico n="search" />
        <input
          type="search"
          aria-label="Search vehicle number"
          placeholder="Search vehicle number (e.g. WB25R9540)…"
          value={q}
          onChange={(e) => setQ(e.target.value.trim())}
        />
      </label>
      <label className="field">
        <input
          type="date"
          aria-label="From date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </label>
      <span style={{ color: 'var(--fg-tertiary)', display: 'flex' }}>
        <Ico n="arrowR" s={14} />
      </span>
      <label className="field">
        <input
          type="date"
          aria-label="To date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </label>
      <span style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((f) => {
          const n =
            f.key === 'all' ? records.length : f.key === 'open' ? open.length : reviewed.length;
          return (
            <button
              key={f.key}
              type="button"
              className="chip"
              aria-pressed={status === f.key}
              onClick={() => setStatus(f.key)}
            >
              {f.ic ? (
                <span style={{ color: f.c, display: 'flex' }}>
                  <Ico n={f.ic} s={13} />
                </span>
              ) : null}
              {f.label}
              <b>{n}</b>
            </button>
          );
        })}
      </div>
    </div>
  );
}
