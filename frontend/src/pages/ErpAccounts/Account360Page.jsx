import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import PageHeader from '../../components/Erp/PageHeader';
import ErpTable from '../../components/Erp/ErpTable';
import StatusBadge from '../../components/Erp/StatusBadge';
import DateRangeFilter from '../../components/Erp/DateRangeFilter';
import useErpList from '../../hooks/useErpList';
import LedgerApi from '../ErpLedger/LedgerService';
import OutstandingApi from '../ErpOutstanding/OutstandingService';
import VendorPaymentApi from '../ErpVendorPayments/VendorPaymentService';
import { SupplierPaymentApi } from '../ErpSupplierPayments/SupplierPaymentService';
import { getEntityById } from '../../components/Erp/entityLookup.service';
import { documentPathFor } from './documentRoutes';
import { inr, num, drCr, pct } from '../../utils/formatMoney';
import { formatDateIST } from '../../utils/dateUtils';
import '../../styles/erp.css';

/**
 * Account 360 — everything about one party, vendor, supplier or driver.
 *
 * This is the central "keep track" object. It also fixes a real gap: the old
 * LedgerPage hardcoded accountType:'PARTY', so vendor, supplier and driver
 * ledgers were unreachable from the UI even though the API always supported
 * them. Here the type comes from the URL.
 *
 * Balances are shown as Dr/Cr, never as a signed number — "-₹50,000" is
 * ambiguous about who owes whom, "₹50,000 Cr" is not.
 */

const VALID_TYPES = ['party', 'vendor', 'supplier', 'driver'];

const TABS = [
  { key: 'statement', label: 'Statement' },
  { key: 'open', label: 'Open items' },
];

const Account360Page = () => {
  const { accountType: rawType, accountId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const accountType = String(rawType || '').toUpperCase();
  const isValid = VALID_TYPES.includes(String(rawType || '').toLowerCase());

  const [tab, setTab] = useState(() => searchParams.get('tab') || 'statement');
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [headLoading, setHeadLoading] = useState(true);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some((x) => x.key === t)) setTab(t);
  }, [searchParams]);

  const selectTab = (key) => {
    setTab(key);
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    ['page', 'q', 'from', 'to'].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  };

  // Header: master record + aggregate balance.
  useEffect(() => {
    if (!isValid) return undefined;
    let active = true;
    setHeadLoading(true);
    Promise.all([
      getEntityById(accountType, accountId),
      LedgerApi.getBalance({ accountType, accountId }).catch((e) => {
        if (e.status !== 404) toast.error(e.message);
        return null;
      }),
    ])
      .then(([entity, bal]) => {
        if (!active) return;
        setAccount(entity);
        setBalance(bal?.data || null);
      })
      .finally(() => { if (active) setHeadLoading(false); });
    return () => { active = false; };
  }, [accountType, accountId, isValid]);

  /* ── Statement tab ─────────────────────────────────────────────────────── */
  const statementFetcher = useCallback(
    (params) => LedgerApi.getStatement({ ...params, accountType, accountId }),
    [accountType, accountId],
  );

  const statement = useErpList(statementFetcher, {
    initial: { page: 1, limit: 25, from: '', to: '' },
    syncToUrl: true,
    deps: [accountType, accountId],
  });

  /* ── Open items tab ────────────────────────────────────────────────────── */
  const openFetcher = useCallback(async (params) => {
    if (accountType === 'PARTY') {
      return OutstandingApi.list({ ...params, partyId: accountId, view: 'ALL' });
    }
    if (accountType === 'VENDOR') {
      const res = await VendorPaymentApi.getOutstanding({ vendorId: accountId, includeBills: true });
      return { data: res.data?.[0]?.bills || [], meta: null };
    }
    if (accountType === 'SUPPLIER') {
      const res = await SupplierPaymentApi.getOutstanding({ supplierId: accountId, includeInvoices: true });
      return { data: res.data?.[0]?.invoices || [], meta: null };
    }
    // Drivers have no open-item document type — shortages post straight to the ledger.
    return { data: [], meta: null };
  }, [accountType, accountId]);

  const openItems = useErpList(openFetcher, {
    initial: { page: 1, limit: 25 },
    syncToUrl: false,
    deps: [accountType, accountId],
  });

  const bal = balance ? drCr(balance.balance) : null;
  const creditLimit = account?.creditLimit ?? 0;
  const utilisation = creditLimit > 0 && balance ? pct(Math.max(0, balance.balance), creditLimit) : null;
  const overLimit = creditLimit > 0 && balance && balance.balance > creditLimit;

  const statementColumns = useMemo(() => [
    { header: 'Date', cellStyle: { whiteSpace: 'nowrap' }, render: (e) => formatDateIST(e.entryDate) },
    {
      header: 'Source',
      render: (e) => {
        const to = documentPathFor(e.sourceType, e.sourceId, { tripId: e.tripId });
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={e.sourceType} />
            {e.sourceLabel && (to
              ? <Link to={to}>{e.sourceLabel}</Link>
              : <span className="erp-muted">{e.sourceLabel}</span>)}
            {e.reversedByEntryId && <StatusBadge status="REVERSED" />}
          </span>
        );
      },
    },
    {
      header: 'Narration',
      render: (e) => (
        <span style={e.reversedByEntryId ? { textDecoration: 'line-through', color: '#94a3b8' } : undefined}>
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
    {
      header: 'Balance',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (e) => <span className="erp-numeric">{drCr(e.runningBalance).text}</span>,
    },
  ], []);

  const openColumns = useMemo(() => {
    if (accountType === 'PARTY') {
      return [
        {
          header: 'Bill #',
          render: (r) => {
            const to = documentPathFor('SALE_BILL', r.billId);
            return to ? <Link to={to}>{r.billNumber}</Link> : r.billNumber;
          },
        },
        { header: 'Date', render: (r) => formatDateIST(r.billDate) },
        { header: 'Due', render: (r) => (r.dueDate ? formatDateIST(r.dueDate) : '—') },
        { header: 'Ageing', render: (r) => <StatusBadge status={r.ageingBucket} label={r.overdueDays ? `${r.overdueDays}d` : undefined} /> },
        { header: 'Bill total', headerStyle: { textAlign: 'right' }, cellStyle: { textAlign: 'right' }, render: (r) => <span className="erp-numeric">{inr(r.netAmount)}</span> },
        { header: 'Outstanding', headerStyle: { textAlign: 'right' }, cellStyle: { textAlign: 'right' }, render: (r) => <span className="erp-numeric"><strong>{inr(r.outstandingAmount)}</strong></span> },
      ];
    }
    if (accountType === 'VENDOR') {
      return [
        {
          header: 'Bill #',
          render: (r) => {
            const to = documentPathFor('PURCHASE_BILL', r.purchaseBillId);
            return to ? <Link to={to}>{r.billNumber}</Link> : r.billNumber;
          },
        },
        { header: 'Trip', render: (r) => r.tripNumber || '—' },
        { header: 'Vehicle', render: (r) => r.vehicleNumber || '—' },
        { header: 'Due', render: (r) => (r.dueDate ? formatDateIST(r.dueDate) : '—') },
        { header: 'Ageing', render: (r) => <StatusBadge status={r.ageingBucket} label={r.overdueDays ? `${r.overdueDays}d` : undefined} /> },
        { header: 'Net', headerStyle: { textAlign: 'right' }, cellStyle: { textAlign: 'right' }, render: (r) => <span className="erp-numeric"><strong>{inr(r.netAmount)}</strong></span> },
      ];
    }
    if (accountType === 'SUPPLIER') {
      return [
        {
          header: 'Ref',
          render: (r) => {
            const to = documentPathFor('SUPPLIER_INVOICE', r.supplierInvoiceId);
            return to ? <Link to={to}>{r.refNumber || r.invoiceNumber}</Link> : (r.refNumber || r.invoiceNumber);
          },
        },
        { header: 'Invoice #', render: (r) => r.invoiceNumber || '—' },
        { header: 'Type', render: (r) => <StatusBadge status={r.supplyType} /> },
        { header: 'Due', render: (r) => (r.dueDate ? formatDateIST(r.dueDate) : '—') },
        { header: 'Ageing', render: (r) => <StatusBadge status={r.ageingBucket} label={r.overdueDays ? `${r.overdueDays}d` : undefined} /> },
        { header: 'Net', headerStyle: { textAlign: 'right' }, cellStyle: { textAlign: 'right' }, render: (r) => <span className="erp-numeric"><strong>{inr(r.netAmount)}</strong></span> },
      ];
    }
    return [];
  }, [accountType]);

  const openTotal = useMemo(
    () => openItems.rows.reduce((s, r) => s + (r.outstandingAmount ?? r.netAmount ?? 0), 0),
    [openItems.rows],
  );

  const exportStatement = async () => {
    try {
      const blob = await LedgerApi.exportStatementCsv({
        accountType,
        accountId,
        ...(statement.params.from ? { from: statement.params.from } : {}),
        ...(statement.params.to ? { to: statement.params.to } : {}),
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement-${accountType}-${account?.code || accountId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!isValid) {
    return (
      <div className="erp-page">
        <p className="erp-muted">
          Unknown account type “{rawType}”. Expected one of: {VALID_TYPES.join(', ')}.
        </p>
        <Link to="/erp/accounts" className="erp-link-btn">← Back to Accounts</Link>
      </div>
    );
  }

  const statementTotals = statement.raw || {};

  return (
    <div className="erp-page">
      <PageHeader
        title={headLoading ? 'Loading…' : (account?.name || 'Account')}
        subtitle={`${accountType} account`}
        breadcrumbs={[
          { label: 'ERP', to: '/erp' },
          { label: 'Accounts', to: '/erp/accounts' },
          { label: account?.name || accountType },
        ]}
        actions={(
          <>
            <Link to="/erp/accounts" className="erp-btn">
              <ArrowLeft size={15} /> Accounts
            </Link>
            <button type="button" className="erp-btn" onClick={exportStatement}>
              <Download size={15} /> Statement CSV
            </button>
          </>
        )}
      />

      {/* Header card — balance as Dr/Cr, credit exposure. */}
      <div className="erp-card" style={{ padding: '20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div className="erp-stat-label">Balance</div>
            <div className="erp-stat-value" style={{ fontSize: 30, color: bal?.tone === 'credit' ? '#15803d' : '#1a202c' }}>
              {headLoading ? '…' : (bal ? bal.text : '—')}
            </div>
            {balance && (
              <div className="erp-stat-sub">
                Dr {inr(balance.debit)} · Cr {inr(balance.credit)}
              </div>
            )}
          </div>

          {account?.code && (
            <div>
              <div className="erp-stat-label">Code</div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{account.code}</div>
            </div>
          )}

          {account?.status && (
            <div>
              <div className="erp-stat-label">Status</div>
              <StatusBadge status={account.status} />
            </div>
          )}

          {creditLimit > 0 && (
            <div style={{ minWidth: 200 }}>
              <div className="erp-stat-label">Credit limit</div>
              <div style={{ fontSize: 15, fontWeight: 600 }} className="erp-numeric">{inr(creditLimit)}</div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, marginTop: 8, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, utilisation || 0)}%`,
                  height: '100%',
                  background: overLimit ? '#dc2626' : '#00c896',
                }}
                />
              </div>
              <div className="erp-stat-sub" style={{ marginTop: 6 }}>
                {utilisation != null ? `${utilisation.toFixed(0)}% used` : '—'}
              </div>
            </div>
          )}
        </div>

        {overLimit && (
          <div className="erp-callout danger" style={{ marginTop: 16, marginBottom: 0 }}>
            <AlertTriangle size={15} />
            <span>
              Over credit limit by <strong>{inr(balance.balance - creditLimit)}</strong>.
            </span>
          </div>
        )}
      </div>

      <div className="erp-tabs" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`erp-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => selectTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'statement' && (
        <>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
            <DateRangeFilter
              value={{ from: statement.params.from, to: statement.params.to }}
              onChange={(r) => statement.setParams({ from: r.from, to: r.to })}
            />
          </div>

          <div className="erp-stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', marginBottom: 16 }}>
            <div className="erp-stat">
              <div className="erp-stat-label">Opening</div>
              <div className="erp-stat-value" style={{ fontSize: 18 }}>{drCr(statementTotals.openingBalance || 0).text}</div>
            </div>
            <div className="erp-stat">
              <div className="erp-stat-label">Period debit</div>
              <div className="erp-stat-value" style={{ fontSize: 18 }}>{inr(statementTotals.totals?.debit || 0)}</div>
            </div>
            <div className="erp-stat">
              <div className="erp-stat-label">Period credit</div>
              <div className="erp-stat-value" style={{ fontSize: 18 }}>{inr(statementTotals.totals?.credit || 0)}</div>
            </div>
            <div className="erp-stat">
              <div className="erp-stat-label">Closing</div>
              <div className="erp-stat-value" style={{ fontSize: 18 }}>{drCr(statementTotals.closingBalance || 0).text}</div>
            </div>
          </div>

          <ErpTable
            columns={statementColumns}
            data={statement.rows}
            loading={statement.loading}
            pagination={statement.pagination}
            emptyText="No ledger entries for this account in the selected period"
          />
        </>
      )}

      {tab === 'open' && (
        <>
          {accountType === 'DRIVER' ? (
            <p className="erp-muted">
              Driver accounts have no open documents — shortages and advances post directly to the
              ledger. See the Statement tab.
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap', gap: 12 }}>
                <span className="erp-muted">
                  {num(openItems.rows.length)} open {accountType === 'SUPPLIER' ? 'invoices' : 'bills'}
                </span>
                <span style={{ fontSize: 15 }}>
                  Total <strong className="erp-numeric">{inr(openTotal)}</strong>
                </span>
              </div>

              <ErpTable
                columns={openColumns}
                data={openItems.rows}
                loading={openItems.loading}
                pagination={openItems.pagination}
                emptyText="Nothing outstanding on this account"
              />
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Account360Page;
