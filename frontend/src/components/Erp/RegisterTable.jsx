import React, { useCallback } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpTable from './ErpTable';
import DateRangeFilter from './DateRangeFilter';
import useErpList from '../../hooks/useErpList';
import { formatDateIST } from '../../utils/dateUtils';

/**
 * RegisterTable — one config-driven browsable history.
 *
 * Every register in the financial module is this component plus ~15 lines of
 * column definitions. It supplies the search box, date range, pagination and
 * CSV export so no register can quietly ship without them, which is how the
 * old screens ended up write-only.
 *
 * CSV is generated from the rows on screen rather than a server export, because
 * only three financial endpoints support `format=csv`. The button therefore
 * says "Export page" — promising a full export we cannot deliver would be worse
 * than a smaller promise kept.
 */

const toCsvValue = (value) => {
  if (value === null || value === undefined) return '';
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Pull a plain value for CSV: prefer accessor, fall back to a csv() override. */
const cellValue = (col, row) => {
  if (col.csv) return col.csv(row);
  if (col.accessor) return row[col.accessor];
  return '';
};

const RegisterTable = ({ config, urlPrefix = '' }) => {
  const {
    key, columns, fetch, dateFilter = true, searchable = true,
    searchPlaceholder = 'Search…', hint = null, emptyText,
  } = config;

  const fetcher = useCallback((params) => fetch(params), [fetch]);

  const {
    rows, meta, loading, error, params, setParam, setParams, pagination,
  } = useErpList(fetcher, {
    initial: { page: 1, limit: 25, q: '', from: '', to: '' },
    syncToUrl: true,
    urlPrefix,
    deps: [key],
  });

  const exportPage = () => {
    if (rows.length === 0) {
      toast.info('Nothing to export');
      return;
    }
    const header = columns.map((c) => toCsvValue(c.header)).join(',');
    const body = rows.map((row) => columns.map((c) => toCsvValue(cellValue(c, row))).join(',')).join('\n');
    const blob = new Blob([`${header}\n${body}\n`], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${key}-page-${params.page}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error && error.status === 404) {
    return <p className="erp-muted">This module is not enabled for your organization.</p>;
  }

  const toolbar = (
    <>
      {dateFilter && (
        <DateRangeFilter
          value={{ from: params.from, to: params.to }}
          onChange={(r) => setParams({ from: r.from, to: r.to })}
        />
      )}
      <button type="button" className="erp-btn" onClick={exportPage}>
        <Download size={15} /> Export page
      </button>
    </>
  );

  return (
    <div>
      {hint && <p className="erp-field-hint" style={{ margin: '0 0 14px' }}>{hint}</p>}

      <ErpTable
        columns={columns}
        data={rows}
        loading={loading}
        toolbar={toolbar}
        searchQuery={searchable ? params.q : undefined}
        onSearchChange={searchable ? (v) => setParam('q', v) : null}
        searchPlaceholder={searchPlaceholder}
        pagination={pagination}
        emptyText={emptyText || 'Nothing recorded yet'}
      />

      {meta?.asOf && (
        <p className="erp-field-hint" style={{ marginTop: 10 }}>
          As of {formatDateIST(meta.asOf)}
          {meta.horizonDays ? ` · next ${meta.horizonDays} days` : ''}
        </p>
      )}
    </div>
  );
};

export default RegisterTable;
