import { Search, X } from 'lucide-react';

/**
 * FilterBar — the one filter row every fleet list uses (master plan C.2).
 * Debounced search (the debounce lives in useListQuery), optional date range,
 * multi-select chips with facet counts, an active-filter count and "clear all".
 *
 *   <FilterBar
 *     searchValue={params.q} onSearchChange={(v) => setParam('q', v)}
 *     from={params.from} to={params.to} onRangeChange={(patch) => setParams(patch)}
 *     chips={[{ key: 'ACTIVE', label: 'Moving', count: 12 }, ...]}
 *     selectedKeys={params.state} onToggleChip={(v) => toggleArrayValue('state', v)}
 *     activeCount={2} onClear={reset}
 *   />
 */
export default function FilterBar({
  searchValue = '',
  onSearchChange = null,
  searchPlaceholder = 'Search…',
  from = '',
  to = '',
  onRangeChange = null,
  chips = [],
  selectedKeys = [],
  onToggleChip = null,
  activeCount = 0,
  onClear = null,
  right = null,
}) {
  return (
    <div className="fbar">
      {onSearchChange ? (
        <label className="fbar-search">
          <Search size={13} aria-hidden />
          <input
            type="search"
            value={searchValue}
            placeholder={searchPlaceholder}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label={searchPlaceholder}
          />
        </label>
      ) : null}

      {onRangeChange ? (
        <div className="fbar-range" role="group" aria-label="Date range">
          <input
            type="date"
            value={from}
            aria-label="From date"
            onChange={(e) => onRangeChange({ from: e.target.value })}
          />
          <span className="fbar-range-sep">→</span>
          <input
            type="date"
            value={to}
            aria-label="To date"
            onChange={(e) => onRangeChange({ to: e.target.value })}
          />
        </div>
      ) : null}

      {chips.length > 0 ? (
        <div className="fbar-chips" role="group" aria-label="Filters">
          {chips.map((chip) => {
            const selected = selectedKeys.includes(chip.key);
            return (
              <button
                key={chip.key}
                type="button"
                aria-pressed={selected}
                className={`fbar-chip${selected ? ' fbar-chip--on' : ''}`}
                onClick={() => onToggleChip?.(chip.key)}
              >
                {chip.label}
                {chip.count != null && <span className="fbar-chip-count num">{chip.count}</span>}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="fbar-right">
        {activeCount > 0 && onClear ? (
          <button type="button" className="fbar-clear" onClick={onClear}>
            <X size={12} /> Clear all
            <span className="fbar-chip-count num">{activeCount}</span>
          </button>
        ) : null}
        {right}
      </div>
    </div>
  );
}
