/**
 * Outstanding / Payment Collection (ISOCL ERP Stage 11)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Wallet, Download, AlertTriangle, Users, CalendarClock } from 'lucide-react';
import { toast } from 'react-toastify';
import OutstandingApi from './OutstandingService';
import PageShell from '../../components/Erp/PageShell';
import ErpTable from '../../components/Erp/ErpTable';
import StatTile from '../../components/Erp/StatTile';
import StatusBadge from '../../components/Erp/StatusBadge';
import EntityPicker from '../../components/Erp/EntityPicker';
import useErpList from '../../hooks/useErpList';
import { accountPathFor, documentPathFor } from '../ErpAccounts/documentRoutes';
import { inr, compactInr, num } from '../../utils/formatMoney';
import { formatDateIST } from '../../utils/dateUtils';
import { AGEING_ORDER } from '../../utils/erpChartTheme';
import '../../styles/erp.css';

const VIEWS = [
  ['ALL', 'Full outstanding'],
  ['DUE_TODAY', 'Due today'],
  ['OVERDUE', 'Overdue'],
  ['UPCOMING', 'Upcoming'],
];

const OutstandingPage = ({ embedded = false }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [tab, setTab] = useState(() => searchParams.get('tab') === 'parties' ? 'parties' : 'bills');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'parties' || t === 'bills') setTab(t);
  }, [searchParams]);

  const selectTab = (key) => {
    setTab(key);
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    next.delete('page');
    setSearchParams(next, { replace: true });
  };

  /* ── Summary tiles ─────────────────────────────────────────────────────── */
  useEffect(() => {
    let active = true;
    setSummaryLoading(true);
    OutstandingApi.getSummary()
      .then((res) => { if (active) setSummary(res.data); })
      .catch((err) => {
        if (!active) return;
        if (err.status === 404) toast.error('Outstanding / accounts is not enabled for your organization');
        else toast.error(err.message);
        setSummary(null);
      })
      .finally(() => { if (active) setSummaryLoading(false); });
    return () => { active = false; };
  }, []);

  /* ── Bill list ─────────────────────────────────────────────────────────── */
  const billFetcher = useCallback((params) => OutstandingApi.list(params), []);

  const bills = useErpList(billFetcher, {
    initial: {
      page: 1, limit: 25, q: '', view: 'ALL', partyId: '', ageingBucket: '',
      sortBy: '', order: 'desc',
    },
    syncToUrl: true,
  });

  /* ── Party-wise ────────────────────────────────────────────────────────── */
  const partyFetcher = useCallback((params) => OutstandingApi.getPartyWise(params), []);

  const parties = useErpList(partyFetcher, {
    initial: { page: 1, limit: 25, q: '', overLimitOnly: '' },
    syncToUrl: true,
    urlPrefix: 'pw_',
  });

  const billColumns = useMemo(() => [
    {
      header: 'Bill #',
      render: (r) => {
        const to = documentPathFor('SALE_BILL', r.billId);
        return to ? <Link to={to}>{r.billNumber}</Link> : r.billNumber;
      },
    },
    {
      header: 'Party',
      render: (r) => {
        const to = accountPathFor('PARTY', r.partyId);
        return to ? <Link to={to}>{r.partyName}</Link> : r.partyName;
      },
    },
    { header: 'Due date', render: (r) => (r.dueDate ? formatDateIST(r.dueDate) : <span className="erp-muted">No due date</span>) },
    {
      header: 'Ageing',
      render: (r) => (
        <StatusBadge
          status={r.ageingBucket}
          label={r.overdueDays ? `${r.ageingBucket} · ${r.overdueDays}d` : r.ageingBucket}
        />
      ),
    },
    { header: 'Remarks', render: (r) => r.remarks || <span className="erp-muted">—</span> },
    {
      header: 'Outstanding',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (r) => <span className="erp-numeric"><strong>{inr(r.outstandingAmount)}</strong></span>,
    },
  ], []);

  const partyColumns = useMemo(() => [
    {
      header: 'Party',
      render: (p) => {
        const to = accountPathFor('PARTY', p.partyId);
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {to ? <Link to={to}>{p.partyName}</Link> : p.partyName}
            {p.overCreditLimit && <StatusBadge status="OVERDUE" label="Over limit" />}
          </span>
        );
      },
    },
    { header: 'Bills', accessor: 'billCount' },
    { header: 'Oldest due', render: (p) => (p.oldestDueDate ? formatDateIST(p.oldestDueDate) : '—') },
    {
      header: 'Credit limit',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (p) => <span className="erp-numeric">{p.creditLimit ? inr(p.creditLimit) : '—'}</span>,
    },
    {
      header: 'Overdue',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (p) => (
        <span className="erp-numeric" style={{ color: p.overdueAmount > 0 ? '#b91c1c' : undefined }}>
          {inr(p.overdueAmount)}
        </span>
      ),
    },
    {
      header: 'Outstanding',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (p) => <span className="erp-numeric"><strong>{inr(p.totalOutstanding)}</strong></span>,
    },
  ], []);

  const exportCsv = async () => {
    try {
      // Export what is on screen, not an unfiltered dump.
      const blob = await OutstandingApi.exportCsv({
        view: bills.params.view,
        ...(bills.params.partyId ? { partyId: bills.params.partyId } : {}),
        ...(bills.params.q ? { q: bills.params.q } : {}),
        ...(bills.params.ageingBucket ? { ageingBucket: bills.params.ageingBucket } : {}),
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `outstanding-${String(bills.params.view).toLowerCase()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const billToolbar = (
    <>
      <select
        className="erp-filter"
        value={bills.params.view}
        onChange={(e) => bills.setParam('view', e.target.value)}
        aria-label="View"
      >
        {VIEWS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>

      <select
        className="erp-filter"
        value={bills.params.ageingBucket}
        onChange={(e) => bills.setParam('ageingBucket', e.target.value)}
        aria-label="Ageing bucket"
      >
        <option value="">All ageing</option>
        {AGEING_ORDER.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>

      <div style={{ minWidth: 220 }}>
        <EntityPicker
          type="PARTY"
          value={bills.params.partyId}
          onChange={(v) => bills.setParam('partyId', v)}
          placeholder="Filter to one party…"
        />
      </div>

      <select
        className="erp-filter"
        value={`${bills.params.sortBy || 'dueDate'}:${bills.params.order}`}
        onChange={(e) => {
          const [sortBy, order] = e.target.value.split(':');
          bills.setParams({ sortBy, order });
        }}
        aria-label="Sort"
      >
        <option value="dueDate:asc">Due date, oldest first</option>
        <option value="dueDate:desc">Due date, newest first</option>
        <option value="outstandingAmount:desc">Largest outstanding</option>
        <option value="outstandingAmount:asc">Smallest outstanding</option>
        <option value="overdueDays:desc">Most overdue</option>
      </select>
    </>
  );

  return (
    <PageShell
      embedded={embedded}
      title={<><Wallet size={22} /> Outstanding Receivables</>}
      subtitle="Party-wise and due-date views for submitted sale bills."
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Billing', to: '/erp/billing' }, { label: 'Outstanding' }]}
      actions={(
        <button type="button" className="erp-btn" onClick={exportCsv}>
          <Download size={16} /> Export CSV
        </button>
      )}
    >
      {/* Tiles now filter the list below instead of being decorative. */}
      <div className="erp-stat-grid">
        <StatTile
          label="Total outstanding"
          icon={Wallet}
          loading={summaryLoading}
          value={compactInr(summary?.totalOutstanding)}
          sublabel={summary ? `${num(summary.billCount)} bills` : null}
          onClick={() => { selectTab('bills'); bills.setParam('view', 'ALL'); }}
          cta="Show all"
        />
        <StatTile
          label="Overdue"
          icon={AlertTriangle}
          loading={summaryLoading}
          value={compactInr(summary?.overdueTotal)}
          sublabel="Past due date"
          sublabelTone="danger"
          onClick={() => { selectTab('bills'); bills.setParam('view', 'OVERDUE'); }}
          cta="Chase"
        />
        <StatTile
          label="Due today"
          icon={CalendarClock}
          loading={summaryLoading}
          value={compactInr(summary?.dueTodayTotal)}
          sublabel="Falling due today"
          sublabelTone="warning"
          onClick={() => { selectTab('bills'); bills.setParam('view', 'DUE_TODAY'); }}
          cta="Review"
        />
        <StatTile
          label="Parties"
          icon={Users}
          loading={summaryLoading}
          value={num(summary?.partyCount || 0)}
          sublabel="With an open balance"
          onClick={() => selectTab('parties')}
          cta="Party-wise"
        />
      </div>

      <div className="erp-tabs">
        {[['bills', 'Bill list'], ['parties', 'Party-wise']].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`erp-tab ${tab === key ? 'active' : ''}`}
            onClick={() => selectTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'bills' ? (
        <ErpTable
          columns={billColumns}
          data={bills.rows}
          loading={bills.loading}
          toolbar={billToolbar}
          searchQuery={bills.params.q}
          onSearchChange={(v) => bills.setParam('q', v)}
          searchPlaceholder="Search bill number or party…"
          pagination={bills.pagination}
          emptyText="No bills in this view"
          keyExtractor={(r) => r.billId}
        />
      ) : (
        <ErpTable
          columns={partyColumns}
          data={parties.rows}
          loading={parties.loading}
          toolbar={(
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: '#475569' }}>
              <input
                type="checkbox"
                checked={Boolean(parties.params.overLimitOnly)}
                onChange={(e) => parties.setParam('overLimitOnly', e.target.checked ? 'true' : '')}
              />
              Over credit limit only
            </label>
          )}
          searchQuery={parties.params.q}
          onSearchChange={(v) => parties.setParam('q', v)}
          searchPlaceholder="Search party name or code…"
          pagination={parties.pagination}
          emptyText="No outstanding balances"
          keyExtractor={(p) => p.partyId}
        />
      )}
    </PageShell>
  );
};

export default OutstandingPage;
