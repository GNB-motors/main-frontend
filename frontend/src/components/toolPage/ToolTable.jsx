import { Search, X } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

/**
 * The table of a fleet tool page: the shared DataTable in the Intelligence
 * table shell, with its title, a segmented filter (gnb-ui-design 6.13) and a
 * search box in the table's own toolbar.
 *
 *   segment = { label, value, onChange, options: [{ key, label, count }] }
 *   search  = { label, value, onChange }
 */
export default function ToolTable({ title, sub = null, segment = null, search = null, ...table }) {
  return (
    <section className="tp-table" aria-label={title}>
      <DataTable
        className="intel-assessments-table pf-table"
        {...table}
        toolbarExtra={
          <div className="tp-tools">
            <div className="tp-table-head">
              <h2>{title}</h2>
              {sub ? <p>{sub}</p> : null}
            </div>
            {segment ? (
              <div className="tp-segment" role="group" aria-label={segment.label}>
                {segment.options.map((option) => (
                  <button
                    key={option.key || 'all'}
                    type="button"
                    aria-pressed={segment.value === option.key}
                    onClick={() => segment.onChange(option.key)}
                  >
                    {option.label}
                    {option.count != null ? <span>{option.count}</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
            {search ? (
              <label className="tp-search" data-search-field>
                <Search size={14} aria-hidden="true" />
                <input
                  type="search"
                  aria-label={search.label}
                  placeholder={search.label}
                  value={search.value}
                  onChange={(event) => search.onChange(event.target.value)}
                />
                {search.value ? (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => search.onChange('')}
                  >
                    <X size={13} aria-hidden="true" />
                  </button>
                ) : null}
              </label>
            ) : null}
          </div>
        }
      />
    </section>
  );
}
