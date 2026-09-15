import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import ErpTable from '../../components/Erp/ErpTable';
import StatusBadge from '../../components/Erp/StatusBadge';
import DateRangeFilter from '../../components/Erp/DateRangeFilter';
import EntityPicker from '../../components/Erp/EntityPicker';
import useErpList from '../../hooks/useErpList';
import { LedgerEntriesApi } from './FinanceHubService';
import { accountPathFor, documentPathFor, SOURCE_TYPES } from './documentRoutes';
import { inr, num } from '../../utils/formatMoney';
import { formatDateIST, toISTDateString } from '../../utils/dateUtils';
import '../../styles/erp-accounts-workspace.css';

/**
 * Day Book — every ledger posting across every account, for a date range.
 *
 * This view could not be built before: /erp/ledger/statement requires an
 * accountType + accountId, so "what did we post today" was not an askable
 * question. It is the operational counterpart to the per-account statement.
 *
 * NO RUNNING BALANCE COLUMN, deliberately. A running balance only means
 * something within one account ordered by date; on a mixed-account listing it
 * would be a cumulative total of unrelated accounts — a number that looks
 * authoritative and is meaningless. The hint line says so on screen.
 */

const ACCOUNT_TYPES = ['PARTY', 'VENDOR', 'SUPPLIER', 'DRIVER'];

const DayBookPage = () => {
  const [accountType, setAccountType] = useState('');
  const [accountId, setAccountId] = useState('');

  const fetcher = useCallback(
    (params, opts) => LedgerEntriesApi.list(params, opts),
    [],
  );

  const today = toISTDateString(new Date());

  const {
    rows, raw, meta, loading, error, params, setParam, setParams, pagination,
  } = useErpList(fetcher, {
    initial: {
      page: 1,
      limit: 25,
      q: '',
      from: today,
      to: today,
      sourceType: '',
      accountType: '',
      accountId: '',
    },
    syncToUrl: true,
  });

  const totals = raw?.totals || { debit: 0, credit: 0, net: 0 };

  const onRangeChange = useCallback((r) => setParams({ from: r.from, to: r.to }), [setParams]);

  const onAccountTypeChange = (value) => {
    setAccountType(value);
    setAccountId('');
    setParams({ accountType: value, accountId: '' });
  };

  const onAccountChange = (value) => {
    setAccountId(value);
    setParam('accountId', value);
  };

  const columns = useMemo(() => [
    {
      header: 'Date',
      cellStyle: { whiteSpace: 'nowrap' },
      render: (e) => formatDateIST(e.entryDate),
    },
    {
      header: 'Account',
      render: (e) => {
        const to = accountPathFor(e.accountType, e.accountId);
        const label = e.accountName || '—';
        return (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {to ? <Link to={to}>{label}</Link> : label}
            <span className="erp-muted" style={{ fontSize: 11 }}>
              {e.accountType}
              {e.accountCode ? ` · ${e.accountCode}` : ''}
            </span>
          </span>
        );
      },
    },
    {
      header: 'Source',
      render: (e) => {
        // documentPathFor returns null for OPENING/REVERSAL and anything with
        // no page yet, so this renders as plain text rather than a dead link.
        const to = documentPathFor(e.sourceType, e.sourceId, { tripId: e.tripId });
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={e.sourceType} tone={e.isReversal ? 'neutral' : undefined} />
            {e.sourceLabel && (to
              ? <Link to={to}>{e.sourceLabel}</Link>
              : <span className="erp-muted">{e.sourceLabel}</span>)}
          </span>
        );
      },
    },
    {
      header: 'Narration',
      render: (e) => (
        <span style={e.isReversal ? { textDecoration: 'line-through', color: '#94a3b8' } : undefined}>
          {e.narration || '—'}
        </span>
      ),
    },
    {
      header: 'Debit',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (e) => (e.debit ? <span className="erp-numeric">{inr(e.debit)}</span> : <span className="erp-muted">—</span>),
    },
    {
      header: 'Credit',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (e) => (e.credit ? <span className="erp-numeric">{inr(e.credit)}</span> : <span className="erp-muted">—</span>),
    },
  ], []);

  const exportCsv = async () => {
    try {
      const blob = await LedgerEntriesApi.exportCsv({
        from: params.from, to: params.to, q: params.q, sourceType: params.sourceType,
        accountType: params.accountType, accountId: params.accountId,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `day-book-${params.from || 'all'}-${params.to || 'all'}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (error && error.status === 404) {
    return <p className="erp-muted">Accounts module is not enabled for your organization.</p>;
  }

  return (
    <div className="acc-workspace">
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <DateRangeFilter
          value={{ from: params.from, to: params.to }}
          onChange={onRangeChange}
        />

        <select
          className="erp-filter"
          value={params.sourceType}
          onChange={(e) => setParam('sourceType', e.target.value)}
          aria-label="Source type"
        >
          <option value="">All sources</option>
          {SOURCE_TYPES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <select
          className="erp-filter"
          value={accountType}
          onChange={(e) => onAccountTypeChange(e.target.value)}
          aria-label="Account type"
        >
          <option value="">All accounts</option>
          {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {accountType && (
          <div style={{ minWidth: 240 }}>
            <EntityPicker
              type={accountType}
              value={accountId}
              onChange={onAccountChange}
              placeholder={`Filter to one ${accountType.toLowerCase()}…`}
            />
          </div>
        )}

        <button type="button" className="erp-btn" onClick={exportCsv} style={{ marginLeft: 'auto' }}>
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Period totals strip */}
      <div className="erp-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', marginBottom: 16 }}>
        <div className="erp-stat">
          <div className="erp-stat-label">Total debit</div>
          <div className="erp-stat-value">{inr(totals.debit)}</div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat-label">Total credit</div>
          <div className="erp-stat-value">{inr(totals.credit)}</div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat-label">Net</div>
          <div className="erp-stat-value">{inr(totals.net)}</div>
        </div>
        <div className="erp-stat">
          <div className="erp-stat-label">Entries</div>
          <div className="erp-stat-value">{num(meta?.total || 0)}</div>
        </div>
      </div>

      <ErpTable
        columns={columns}
        data={rows}
        loading={loading}
        searchQuery={params.q}
        onSearchChange={(v) => setParam('q', v)}
        searchPlaceholder="Search narration or reference…"
        pagination={pagination}
        emptyText="No ledger entries in this period"
      />

      <div className="erp-callout info" style={{ marginTop: 16 }}>
        <Info size={15} />
        <span>
          No running balance is shown here — that figure is only meaningful within a single
          account. Open an account from the Account column for a statement with running balance.
          Driver and vehicle khata is tracked separately in{' '}
          <Link to="/khata-ledger">Khata Ledger</Link>.
        </span>
      </div>
    </div>
  );
};

export default DayBookPage;
