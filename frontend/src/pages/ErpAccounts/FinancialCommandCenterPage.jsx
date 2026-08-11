import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Scale, Wallet, Inbox, AlertTriangle, ArrowRight, RefreshCw,
} from 'lucide-react';
import { toast } from 'react-toastify';
import StatTile from '../../components/Erp/StatTile';
import AgeingBar from '../../components/Erp/AgeingBar';
import DateRangeFilter from '../../components/Erp/DateRangeFilter';
import ErpTable from '../../components/Erp/ErpTable';
import StatusBadge from '../../components/Erp/StatusBadge';
import FinanceHubApi from './FinanceHubService';
import { accountPathFor, documentPathFor } from './documentRoutes';
import { inr, compactInr, num, drCr } from '../../utils/formatMoney';
import { MONEY_SERIES, C } from '../../utils/erpChartTheme';
import { formatDateIST, toISTDateString } from '../../utils/dateUtils';
import OutstandingApi from '../ErpOutstanding/OutstandingService';
import VendorPaymentApi from '../ErpVendorPayments/VendorPaymentService';
import ReceiptApi from '../ErpReceipts/ReceiptService';

/**
 * Financial Command Center — the answer to "what's coming in vs what's going out".
 *
 * This replaces the /erp/accounts landing view rather than adding a fifth
 * sidebar entry: three money destinations with no overview is precisely why
 * nobody could keep track, and a fourth would have made it worse.
 *
 * STOCKS VS FLOWS: the date range drives the cash-movement panel ONLY.
 * Receivables, payables and balances are always as-of-now, and every tile says
 * which it is. Putting a period filter over a balance is the classic way to
 * make a finance team stop believing a dashboard.
 */

const QUEUES = [
  { key: 'overdue', label: 'Overdue receivables' },
  { key: 'payables', label: 'Payables due' },
  { key: 'unapplied', label: 'Unapplied receipts' },
];

const FinancialCommandCenterPage = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [ageing, setAgeing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(() => ({
    from: toISTDateString(new Date(Date.now() - 29 * 864e5)),
    to: toISTDateString(new Date()),
  }));

  const [queue, setQueue] = useState('overdue');
  const [queueRows, setQueueRows] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);

  const load = useCallback(async (signal) => {
    setLoading(true);
    try {
      const [s, a] = await Promise.all([
        FinanceHubApi.getSummary({ from: range.from, to: range.to }, { signal }),
        FinanceHubApi.getAgeing({ side: 'BOTH' }, { signal }),
      ]);
      setSummary(s.data);
      setAgeing(a.data);
    } catch (err) {
      if (err.name === 'CanceledError') return;
      if (err.status === 404) {
        toast.error('Accounts module is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setSummary(null);
      setAgeing(null);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      if (queue === 'overdue') {
        const res = await OutstandingApi.list({ view: 'OVERDUE', limit: 8, sortBy: 'outstandingAmount' });
        setQueueRows(res.data || []);
      } else if (queue === 'payables') {
        const res = await VendorPaymentApi.getOutstanding({ limit: 8 });
        setQueueRows(res.data || []);
      } else {
        const res = await ReceiptApi.listUnadjusted({ limit: 8 });
        setQueueRows(res.data || []);
      }
    } catch (err) {
      if (err.status !== 404) toast.error(err.message);
      setQueueRows([]);
    } finally {
      setQueueLoading(false);
    }
  }, [queue]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const asOfLabel = summary?.asOf ? `as of ${formatDateIST(summary.asOf)}` : null;
  const periodLabel = summary?.cashMovement
    ? `${formatDateIST(summary.cashMovement.from)} – ${formatDateIST(summary.cashMovement.to)}`
    : null;

  const net = summary ? drCr(summary.net.position) : null;

  // Single in/out pair for the range. The backend returns period totals rather
  // than a series, so this is an honest two-bar comparison, not a fake trend.
  const cashData = useMemo(() => {
    if (!summary?.cashMovement) return [];
    return [{
      name: 'This period',
      in: summary.cashMovement.in,
      out: summary.cashMovement.out,
      net: summary.cashMovement.net,
    }];
  }, [summary]);

  const queueColumns = useMemo(() => {
    if (queue === 'overdue') {
      return [
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
        { header: 'Due', render: (r) => (r.dueDate ? formatDateIST(r.dueDate) : '—') },
        {
          header: 'Ageing',
          render: (r) => <StatusBadge status={r.ageingBucket} label={`${r.overdueDays ?? 0}d`} />,
        },
        {
          header: 'Outstanding',
          headerStyle: { textAlign: 'right' },
          render: (r) => <span className="erp-numeric">{inr(r.outstandingAmount)}</span>,
          cellStyle: { textAlign: 'right' },
        },
      ];
    }
    if (queue === 'payables') {
      return [
        {
          header: 'Vendor',
          render: (r) => {
            const to = accountPathFor('VENDOR', r.vendorId);
            return to ? <Link to={to}>{r.vendorName}</Link> : r.vendorName;
          },
        },
        { header: 'Bills', accessor: 'billCount' },
        { header: 'POD pending', render: (r) => (r.podPendingCount || 0) },
        { header: 'Oldest due', render: (r) => (r.oldestDueDate ? formatDateIST(r.oldestDueDate) : '—') },
        {
          header: 'Outstanding',
          headerStyle: { textAlign: 'right' },
          render: (r) => <span className="erp-numeric">{inr(r.totalOutstanding)}</span>,
          cellStyle: { textAlign: 'right' },
        },
      ];
    }
    return [
      {
        header: 'Receipt #',
        render: (r) => {
          const to = documentPathFor('RECEIPT', r._id);
          return to ? <Link to={to}>{r.voucherNumber}</Link> : r.voucherNumber;
        },
      },
      {
        header: 'Party',
        render: (r) => {
          const to = accountPathFor('PARTY', r.partyId);
          return to ? <Link to={to}>{r.partyName || '—'}</Link> : (r.partyName || '—');
        },
      },
      { header: 'Date', render: (r) => formatDateIST(r.voucherDate) },
      { header: 'Mode', render: (r) => <StatusBadge status={r.mode} /> },
      {
        header: 'Unapplied',
        headerStyle: { textAlign: 'right' },
        render: (r) => <span className="erp-numeric">{inr(r.unadjustedAmount)}</span>,
        cellStyle: { textAlign: 'right' },
      },
    ];
  }, [queue]);

  const queueLink = {
    overdue: '/erp/billing?tab=outstanding&view=OVERDUE',
    payables: '/erp/payables?tab=vendor',
    unapplied: '/erp/billing?tab=receipts',
  }[queue];

  return (
    <div>
      {/* Row 0 — period control. Governs cash movement only. */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 16, flexWrap: 'wrap', marginBottom: 20,
      }}
      >
        <DateRangeFilter label="Cash period" value={range} onChange={setRange} />
        <button type="button" className="erp-btn" onClick={() => load()} disabled={loading}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Row 1 — both sides of the money. Every tile navigates. */}
      <div className="erp-stat-grid">
        <StatTile
          label="Receivables"
          icon={TrendingUp}
          loading={loading}
          value={compactInr(summary?.receivables.total)}
          sublabel={summary ? `${inr(summary.receivables.overdue)} overdue · ${num(summary.receivables.partyCount)} parties` : null}
          sublabelTone={summary?.receivables.overdue > 0 ? 'danger' : null}
          asOf={asOfLabel}
          to="/erp/billing?tab=outstanding&view=ALL"
          cta="Outstanding"
        />
        <StatTile
          label="Overdue in"
          icon={AlertTriangle}
          loading={loading}
          value={compactInr(summary?.receivables.overdue)}
          sublabel={summary ? `${inr(summary.receivables.dueToday)} due today` : null}
          sublabelTone="warning"
          asOf={asOfLabel}
          to="/erp/billing?tab=outstanding&view=OVERDUE"
          cta="Chase"
        />
        <StatTile
          label="Payables"
          icon={TrendingDown}
          loading={loading}
          value={compactInr(summary?.payables.total)}
          sublabel={summary ? `Vendor ${compactInr(summary.payables.vendor.total)} · Supplier ${compactInr(summary.payables.supplier.total)}` : null}
          asOf={asOfLabel}
          to="/erp/payables?tab=vendor"
          cta="Pay"
        />
        <StatTile
          label="Net position"
          icon={Scale}
          loading={loading}
          value={net ? net.text : '—'}
          sublabel="Receivables less payables"
          asOf={asOfLabel}
          derived
        />
        <StatTile
          label="Unapplied receipts"
          icon={Inbox}
          loading={loading}
          value={compactInr(summary?.unapplied.receipts.amount)}
          sublabel={summary ? `${num(summary.unapplied.receipts.count)} receipts to allocate` : null}
          sublabelTone={summary?.unapplied.receipts.count > 0 ? 'warning' : null}
          asOf={asOfLabel}
          to="/erp/billing?tab=receipts"
          cta="Adjust"
        />
      </div>

      {/* Row 2 — ageing, both sides, sharing one scale and one legend. */}
      <div className="erp-split" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <AgeingBar
          title="Receivables ageing"
          loading={loading}
          buckets={ageing?.receivable.buckets || []}
          total={ageing?.receivable.total || 0}
          onBucketClick={(b) => navigate(`/erp/billing?tab=outstanding&bucket=${encodeURIComponent(b)}`)}
          emptyText="Nothing outstanding from parties"
        />
        <AgeingBar
          title="Payables ageing"
          loading={loading}
          buckets={ageing?.payable.buckets || []}
          total={ageing?.payable.total || 0}
          onBucketClick={() => navigate('/erp/payables?tab=vendor')}
          emptyText="Nothing owed to vendors or suppliers"
        />
      </div>

      {/* Row 3 — cash movement (a flow) + what lands in the next 7 days. */}
      <div className="erp-split" style={{ gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="erp-card" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Cash movement</h3>
            <span className="erp-numeric" style={{ fontSize: 15, fontWeight: 700 }}>
              {summary ? inr(summary.cashMovement.net) : '—'}
            </span>
          </div>
          <p className="erp-field-hint" style={{ margin: '0 0 14px' }}>
            {periodLabel} · Cash movement, not a bank balance — this system has no bank ledger.
          </p>
          <div style={{ height: 200, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={cashData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: C.muted }} tickFormatter={compactInr} axisLine={false} tickLine={false} width={70} />
                <Tooltip formatter={(v, n) => [inr(v), n === 'in' ? 'Money in' : n === 'out' ? 'Money out' : 'Net']} />
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => (v === 'in' ? 'Money in' : v === 'out' ? 'Money out' : 'Net')} />
                <Bar dataKey="in" fill={MONEY_SERIES.receivable} radius={[4, 4, 0, 0]} maxBarSize={64} />
                <Bar dataKey="out" fill={MONEY_SERIES.payable} radius={[4, 4, 0, 0]} maxBarSize={64} />
                <Line type="monotone" dataKey="net" stroke={C.ink} strokeWidth={2} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 13 }}>
            <span>
              In <strong className="erp-numeric">{summary ? inr(summary.cashMovement.in) : '—'}</strong>
              <span className="erp-muted"> ({summary?.cashMovement.inCount || 0} receipts)</span>
            </span>
            <span>
              Out <strong className="erp-numeric">{summary ? inr(summary.cashMovement.out) : '—'}</strong>
              <span className="erp-muted"> ({summary?.cashMovement.outCount || 0} payments)</span>
            </span>
          </div>
        </div>

        <div className="erp-card" style={{ padding: '18px 20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700 }}>Next 7 days</h3>
          {[
            ['To collect', summary?.receivables.dueThisWeek, '/erp/billing?tab=outstanding&view=UPCOMING'],
            ['To pay', summary?.payables.dueThisWeek, '/erp/payables?tab=vendor'],
            ['Awaiting release', summary?.inFlight.awaitingRelease.amount, '/erp/payables?tab=vendor'],
            ['Pending approval', summary?.inFlight.pendingApproval.amount, '/erp/approvals'],
          ].map(([label, value, to]) => (
            <Link
              key={label}
              to={to}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 0', borderBottom: '1px solid #f1f5f9',
                textDecoration: 'none', color: 'inherit',
              }}
            >
              <span style={{ fontSize: 13.5, color: '#475569' }}>{label}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong className="erp-numeric" style={{ fontSize: 14 }}>
                  {loading ? '…' : inr(value)}
                </strong>
                <ArrowRight size={13} style={{ color: '#94a3b8' }} />
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Row 4 — attention queues. */}
      <div className="erp-card" style={{ padding: '18px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <div className="erp-tabs" style={{ margin: 0 }}>
            {QUEUES.map((q) => (
              <button
                key={q.key}
                type="button"
                className={`erp-tab ${queue === q.key ? 'active' : ''}`}
                onClick={() => setQueue(q.key)}
              >
                {q.label}
              </button>
            ))}
          </div>
          <Link to={queueLink} className="erp-link-btn">View all →</Link>
        </div>

        <ErpTable
          columns={queueColumns}
          data={queueRows}
          loading={queueLoading}
          emptyText="Nothing needs attention here"
        />
      </div>
    </div>
  );
};

export default FinancialCommandCenterPage;
