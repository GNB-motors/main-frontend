import { useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Columns3, SlidersHorizontal } from 'lucide-react';
import EmptyState from '../cluster/EmptyState';
import {
  nextSort,
  readDensity,
  writeDensity,
  visibleColumns,
  footerSummary,
} from '../../lib/tableState';

/**
 * DataTable — the one table every fleet list uses (master plan C.2).
 * Sortable headers (asc → desc → none, server-side via onSort when the list
 * is paginated — never a client-side sort of one page presented as the top
 * of the whole), sticky header, column visibility menu, density toggle
 * (remembered), and a footer whose count always names the total.
 *
 * columns: [{ key, label, sortKey?, sortable?, align?, width?, render?(row) }]
 *
 *   <DataTable
 *     columns={COLUMNS} rows={rows} rowKey={(r) => r._id}
 *     loading={loading} error={error} onRetry={refresh}
 *     sortBy={params.sortBy} sortOrder={params.order}
 *     onSort={(key, order) => setParams({ sortBy: key, order })}
 *     showing={rows.length} total={pagination?.totalCount ?? rows.length}
 *     activeFilters={2}
 *     emptyTitle="No trips in this window" emptyHint="Widen the date range." emptyAction={...}
 *   />
 */
export default function DataTable({
  columns = [],
  rows = [],
  rowKey = (r, i) => r?._id ?? i,
  loading = false,
  error = null,
  onRetry = null,
  sortBy = null,
  sortOrder = null,
  onSort = null,
  paginated = false,
  showing = null,
  total = null,
  activeFilters = 0,
  emptyTitle = 'Nothing here yet',
  emptyHint = null,
  emptyAction = null,
  className = '',
}) {
  const [hidden, setHidden] = useState(() => new Set());
  const [density, setDensity] = useState(() => readDensity(window.localStorage));
  const [menuOpen, setMenuOpen] = useState(false);

  const cols = useMemo(() => visibleColumns(columns, hidden), [columns, hidden]);

  const toggleDensity = () => {
    const next = density === 'comfortable' ? 'compact' : 'comfortable';
    setDensity(next);
    writeDensity(window.localStorage, next);
  };

  const toggleColumn = (key) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSort = (col) => {
    if (!onSort || !col.sortable) return;
    const order = nextSort(sortBy === col.sortKey ? sortOrder : null);
    onSort(col.sortKey || col.key, order);
  };

  const isEmpty = !loading && !error && rows.length === 0;
  const summary = footerSummary({
    showing: showing ?? rows.length,
    total: total ?? rows.length,
    activeFilters,
  });

  return (
    <div className={`dt dt--${density} ${className}`.trim()}>
      <div className="dt-tools">
        <span className="dt-summary" aria-live="polite">{summary}</span>
        <div className="dt-tools-right">
          <button
            type="button"
            className="dt-tool"
            onClick={toggleDensity}
            title={density === 'comfortable' ? 'Compact rows' : 'Comfortable rows'}
            aria-label="Toggle row density"
          >
            <SlidersHorizontal size={13} />
          </button>
          <div className="dt-cols">
            <button
              type="button"
              className="dt-tool"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Column visibility"
            >
              <Columns3 size={13} />
            </button>
            {menuOpen ? (
              <div className="dt-cols-menu" role="menu">
                {columns.map((c) => (
                  <label key={c.key} className="dt-cols-item">
                    <input
                      type="checkbox"
                      checked={!hidden.has(c.key)}
                      onChange={() => toggleColumn(c.key)}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="dt-scroll">
        <table className="dt-table">
          <thead>
            <tr>
              {cols.map((col) => {
                const active = sortBy === (col.sortKey || col.key);
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width, textAlign: col.align }}
                    aria-sort={active && sortOrder ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        className={`dt-th-sort${active ? ' dt-th-sort--active' : ''}`}
                        onClick={() => handleSort(col)}
                      >
                        {col.label}
                        {active && sortOrder === 'asc' ? <ArrowUp size={11} /> : null}
                        {active && sortOrder === 'desc' ? <ArrowDown size={11} /> : null}
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`skel-${i}`} className="dt-row dt-row--skeleton" aria-hidden>
                    {cols.map((col) => (
                      <td key={col.key} style={{ textAlign: col.align }}>
                        <span className="dt-skel" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((row, i) => (
                  <tr key={rowKey(row, i)} className="dt-row">
                    {cols.map((col) => (
                      <td key={col.key} style={{ textAlign: col.align }} data-label={col.label}>
                        {col.render ? col.render(row, i) : row?.[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>

        {isEmpty ? (
          <div className="dt-empty">
            <EmptyState title={emptyTitle} hint={emptyHint} action={emptyAction} />
          </div>
        ) : null}

        {error ? (
          <div className="dt-error" role="alert">
            <p>Could not load this list.</p>
            {onRetry ? (
              <button type="button" className="pshell-btn" onClick={onRetry}>
                Try again
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {paginated && rows.length > 0 ? (
        <div className="dt-foot">
          <span className="dt-summary">{summary}</span>
        </div>
      ) : null}
    </div>
  );
}
