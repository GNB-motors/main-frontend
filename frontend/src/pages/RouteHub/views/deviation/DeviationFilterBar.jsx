import Ico from '../../routeHubIcons.jsx';
import { LEG_FILTERS, STATUS_FILTERS } from './deviationRules.js';

function Chips({ options, value, onChange, counts = {} }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((f) => (
        <button
          key={f.key}
          type="button"
          className="chip"
          aria-pressed={value === f.key}
          onClick={() => onChange(f.key)}
        >
          {f.ic ? (
            <span style={{ color: f.c, display: 'flex' }}>
              <Ico n={f.ic} s={13} />
            </span>
          ) : null}
          {f.label}
          {counts[f.key] != null ? <b>{counts[f.key]}</b> : null}
        </button>
      ))}
    </div>
  );
}

export default function DeviationFilterBar({ filters, dispatch, legCounts }) {
  const set = (field) => (value) => dispatch({ type: 'set', field, value });
  return (
    <div className="fbar">
      <label className="field grow">
        <Ico n="search" />
        <input
          type="search"
          aria-label="Search vehicle number or place"
          placeholder="Vehicle number or place (e.g. WB25R9540, Durgapur)…"
          value={filters.q}
          onChange={(e) => set('q')(e.target.value)}
        />
      </label>
      <label className="field">
        <input
          type="date"
          aria-label="From date"
          value={filters.from}
          onChange={(e) => set('from')(e.target.value)}
        />
      </label>
      <span style={{ color: 'var(--fg-tertiary)', display: 'flex' }}>
        <Ico n="arrowR" s={14} />
      </span>
      <label className="field">
        <input
          type="date"
          aria-label="To date"
          value={filters.to}
          onChange={(e) => set('to')(e.target.value)}
        />
      </label>
      <span style={{ flex: 1 }} />
      <Chips options={STATUS_FILTERS} value={filters.status} onChange={set('status')} />
      <Chips options={LEG_FILTERS} value={filters.leg} onChange={set('leg')} counts={legCounts} />
    </div>
  );
}
