import React, { useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import ErpTable from '../../components/Erp/ErpTable';
import StatusBadge from '../../components/Erp/StatusBadge';
import useErpList from '../../hooks/useErpList';
import FinanceHubApi from './FinanceHubService';
import { accountPathFor } from './documentRoutes';
import { inr, num, drCr } from '../../utils/formatMoney';
import { formatDateIST } from '../../utils/dateUtils';

/**
 * Account directory — the way in to Account 360.
 *
 * Every other route to an account goes *through a document*: an outstanding
 * bill, a day-book line, a queue row. That leaves settled accounts
 * unreachable, because they drop off every outstanding list the moment they
 * pay. This screen lists every account that has ledger activity at all.
 *
 * Balances read Dr/Cr rather than signed, for the same reason as everywhere
 * else: "−₹50,000" doesn't say who owes whom.
 */

const TYPES = [
  { key: '', label: 'All accounts' },
  { key: 'PARTY', label: 'Customers' },
  { key: 'VENDOR', label: 'Hire vendors' },
  { key: 'SUPPLIER', label: 'Suppliers' },
  { key: 'DRIVER', label: 'Drivers' },
];

const AccountsDirectoryPage = () => {
  const fetcher = useCallback((params, opts) => FinanceHubApi.listAccounts(params, opts), []);

  const {
    rows, meta, loading, error, params, setParam, pagination,
  } = useErpList(fetcher, {
    initial: {
      page: 1, limit: 25, q: '', accountType: '', sortBy: 'balance', order: 'desc',
    },
    syncToUrl: true,
    urlPrefix: 'acc_',
  });

  const columns = useMemo(() => [
    {
      header: 'Account',
      render: (a) => {
        const to = accountPathFor(a.accountType, a.accountId);
        return (
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {to
              ? <Link to={to} style={{ fontWeight: 600 }}>{a.accountName || '(unnamed)'}</Link>
              : <span style={{ fontWeight: 600 }}>{a.accountName || '(unnamed)'}</span>}
            {a.accountCode && (
              <span className="erp-muted" style={{ fontSize: 11 }}>{a.accountCode}</span>
            )}
          </span>
        );
      },
    },
    {
      header: 'Type',
      render: (a) => <StatusBadge status={a.accountType} tone="neutral" />,
    },
    {
      header: 'Debit',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (a) => <span className="erp-numeric">{inr(a.debit)}</span>,
    },
    {
      header: 'Credit',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (a) => <span className="erp-numeric">{inr(a.credit)}</span>,
    },
    {
      header: 'Balance',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (a) => {
        const b = drCr(a.balance);
        return (
          <span
            className="erp-numeric"
            style={{ fontWeight: 600, color: b.tone === 'credit' ? '#b45309' : undefined }}
          >
            {b.text}
          </span>
        );
      },
    },
    {
      header: 'Entries',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (a) => <span className="erp-numeric">{num(a.entryCount)}</span>,
    },
    {
      header: 'Last activity',
      render: (a) => (a.lastActivityAt ? formatDateIST(a.lastActivityAt) : '—'),
    },
  ], []);

  if (error && error.status === 404) {
    return <p className="erp-muted">Accounts module is not enabled for your organization.</p>;
  }

  const byType = meta?.byType || {};

  return (
    <div>
      <div className="erp-tabs" style={{ marginBottom: 16 }}>
        {TYPES.map((t) => (
          <button
            key={t.key || 'all'}
            type="button"
            className={`erp-tab ${params.accountType === t.key ? 'active' : ''}`}
            onClick={() => setParam('accountType', t.key)}
          >
            {t.label}
            {t.key && byType[t.key] !== undefined && ` (${byType[t.key]})`}
          </button>
        ))}
      </div>

      <ErpTable
        columns={columns}
        data={rows}
        loading={loading}
        searchQuery={params.q}
        onSearchChange={(v) => setParam('q', v)}
        searchPlaceholder="Search account name or code…"
        pagination={pagination}
        emptyText="No accounts with ledger activity"
        keyExtractor={(a) => `${a.accountType}:${a.accountId}`}
        toolbar={(
          <select
            className="erp-filter"
            value={params.sortBy}
            onChange={(e) => setParam('sortBy', e.target.value)}
            aria-label="Sort accounts"
          >
            <option value="balance">Largest balance</option>
            <option value="lastActivityAt">Most recent activity</option>
            <option value="entryCount">Most entries</option>
            <option value="accountName">Name (A–Z)</option>
          </select>
        )}
      />

      <div className="erp-callout info" style={{ marginTop: 16 }}>
        <Info size={15} />
        <span>
          Only accounts with ledger activity appear here. <strong>Dr</strong> means they owe us;{' '}
          <strong>Cr</strong> means we owe them. Click any name for the full statement.
        </span>
      </div>
    </div>
  );
};

export default AccountsDirectoryPage;
