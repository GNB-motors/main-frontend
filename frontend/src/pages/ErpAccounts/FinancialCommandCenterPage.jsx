import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Scale, Inbox, AlertTriangle, ArrowRight, ArrowUpRight,
  RefreshCw, Wallet, CalendarClock,
} from 'lucide-react';
import { toast } from 'react-toastify';
import AgeingBar from '../../components/Erp/AgeingBar';
import DateRangeFilter from '../../components/Erp/DateRangeFilter';
import ErpTable from '../../components/Erp/ErpTable';
import StatusBadge from '../../components/Erp/StatusBadge';
import FinanceHubApi from './FinanceHubService';
import { accountPathFor, documentPathFor } from './documentRoutes';
import {
  inr, compactInr, num, drCr,
} from '../../utils/formatMoney';
import { MONEY_SERIES, C } from '../../utils/erpChartTheme';
import { formatDateIST, toISTDateString } from '../../utils/dateUtils';
import OutstandingApi from '../ErpOutstanding/OutstandingService';
import VendorPaymentApi from '../ErpVendorPayments/VendorPaymentService';
import ReceiptApi from '../ErpReceipts/ReceiptService';
import '../../styles/erp-accounts.css';

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
 *
 * UI is wrapped in `.acc-redesign` and styled entirely from `erp-accounts.css`.
 * The shared ERP components (AgeingBar, ErpTable, StatusBadge, DateRangeFilter)
 * and shared classes are only *overridden* under that scope — never edited — so
 * the sibling tabs (Accounts, Day Book, Registers, Fleet Finance) are untouched.
 */

const QUEUES = [
  { key: 'overdue', label: 'Overdue receivables' },
  { key: 'payables', label: 'Payables due' },
  { key: 'unapplied', label: 'Unapplied receipts' },
];

/**
 * SnapshotCard — one headline figure in the financial snapshot grid.
 *
 * Local to this page on purpose: it needs a card-level semantic `tone` (a tinted
 * icon chip + a subtle inset accent for the attention states) that the shared
 * StatTile does not model, and building it here keeps StatTile untouched for the
 * dozen other screens that use it. The money-tile rule still holds — every
 * figure with a real underlying list passes `to`; `derived` opts out explicitly.
 */
const SnapshotCard = ({
  label, icon: Icon, tone = 'neutral', loading = false,
  value, valueSuffix = null, context = null, asOf = null,
  to = null, cta = null, derived = false,
}) => {
  const interactive = Boolean(to);
  const body = (
    <>
      <div className="acc-card-head">
        <span className={`acc-card-ic acc-card-ic--${tone}`}>
          {Icon && <Icon size={16} />}
        </span>
        <span className="acc-card-label">{label}</span>
      </div>

      {loading ? (
        <div className="acc-skel acc-skel--value" />
      ) : (
        <div className="acc-card-value">
          {value}
          {valueSuffix && <span className="acc-card-suffix">{valueSuffix}</span>}
        </div>
      )}

      {!loading && context && <div className="acc-card-context">{context}</div>}

      <div className="acc-card-foot">
        {asOf && <span className="acc-card-asof">{asOf}</span>}
        {interactive
          ? <span className="acc-card-cta">{cta}<ArrowRight size={13} /></span>
          : derived && <span className="acc-card-derived">Derived</span>}
      </div>
    </>
  );

  const className = `acc-card acc-card--${tone}${interactive ? ' clickable' : ''}`;
  return interactive
    ? <Link to={to} className={className}>{body}</Link>
    : <div className={className}>{body}</div>;
};

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
            return to
              ? <Link to={to} className="acc-doc-link">{r.billNumber}</Link>
              : <span className="acc-doc-link">{r.billNumber}</span>;
          },
        },
        {
          header: 'Party',
          render: (r) => {
            const to = accountPathFor('PARTY', r.partyId);
            return to
              ? <Link to={to} className="acc-party-link">{r.partyName}</Link>
              : <span className="acc-party-link">{r.partyName}</span>;
          },
        },
        { header: 'Due', render: (r) => <span className="acc-cell-muted">{r.dueDate ? formatDateIST(r.dueDate) : '—'}</span> },
        {
          header: 'Ageing',
          render: (r) => <StatusBadge status={r.ageingBucket} label={`${r.overdueDays ?? 0}d`} />,
        },
        {
          header: 'Outstanding',
          headerStyle: { textAlign: 'right' },
          render: (r) => <span className="erp-numeric acc-amount">{inr(r.outstandingAmount)}</span>,
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
            return to
              ? <Link to={to} className="acc-party-link">{r.vendorName}</Link>
              : <span className="acc-party-link">{r.vendorName}</span>;
          },
        },
        { header: 'Bills', accessor: 'billCount' },
        { header: 'POD pending', render: (r) => (r.podPendingCount || 0) },
        { header: 'Oldest due', render: (r) => <span className="acc-cell-muted">{r.oldestDueDate ? formatDateIST(r.oldestDueDate) : '—'}</span> },
        {
          header: 'Outstanding',
          headerStyle: { textAlign: 'right' },
          render: (r) => <span className="erp-numeric acc-amount">{inr(r.totalOutstanding)}</span>,
          cellStyle: { textAlign: 'right' },
        },
      ];
    }
    return [
      {
        header: 'Receipt #',
        render: (r) => {
          const to = documentPathFor('RECEIPT', r._id);
          return to
            ? <Link to={to} className="acc-doc-link">{r.voucherNumber}</Link>
            : <span className="acc-doc-link">{r.voucherNumber}</span>;
        },
      },
      {
        header: 'Party',
        render: (r) => {
          const to = accountPathFor('PARTY', r.partyId);
          return to
            ? <Link to={to} className="acc-party-link">{r.partyName || '—'}</Link>
            : <span className="acc-party-link">{r.partyName || '—'}</span>;
        },
      },
      { header: 'Date', render: (r) => <span className="acc-cell-muted">{formatDateIST(r.voucherDate)}</span> },
      { header: 'Mode', render: (r) => <StatusBadge status={r.mode} /> },
      {
        header: 'Unapplied',
        headerStyle: { textAlign: 'right' },
        render: (r) => <span className="erp-numeric acc-amount">{inr(r.unadjustedAmount)}</span>,
        cellStyle: { textAlign: 'right' },
      },
    ];
  }, [queue]);

  const queueLink = {
    overdue: '/erp/billing?tab=outstanding&view=OVERDUE',
    payables: '/erp/payables?tab=vendor',
    unapplied: '/erp/billing?tab=receipts',
  }[queue];

  const next7 = [
    {
      label: 'To collect', tone: 'in', value: summary?.receivables.dueThisWeek,
      to: '/erp/billing?tab=outstanding&view=UPCOMING',
    },
    {
      label: 'To pay', tone: 'out', value: summary?.payables.dueThisWeek,
      to: '/erp/payables?tab=vendor',
    },
    {
      label: 'Awaiting release', tone: 'muted', value: summary?.inFlight.awaitingRelease.amount,
      to: '/erp/payables?tab=vendor',
    },
    {
      label: 'Pending approval', tone: 'muted', value: summary?.inFlight.pendingApproval.amount,
      to: '/erp/approvals',
    },
  ];

  return (
    <div className="acc-redesign">
      {/* ── Period toolbar. Governs cash movement only. ─────────────────────── */}
      <div className="acc-periodbar">
        <div className="acc-periodbar-controls">
          <DateRangeFilter label="Cash period" value={range} onChange={setRange} />
        </div>
        <button type="button" className="erp-btn acc-refresh" onClick={() => load()} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'acc-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── Level 1 · Financial position. Every tile navigates. ─────────────── */}
      <section className="acc-section acc-section--primary">
        <div className="acc-snapshot-grid">
          <SnapshotCard
            label="Receivables"
            icon={TrendingUp}
            tone="receivable"
            loading={loading}
            value={compactInr(summary?.receivables.total)}
            context={summary && (
              <>
                <strong className="acc-ctx-danger">{inr(summary.receivables.overdue)}</strong>
                {' overdue · '}
                {num(summary.receivables.partyCount)}
                {' parties'}
              </>
            )}
            asOf={asOfLabel}
            to="/erp/billing?tab=outstanding&view=ALL"
            cta="Outstanding"
          />
          <SnapshotCard
            label="Overdue"
            icon={AlertTriangle}
            tone="warn"
            loading={loading}
            value={compactInr(summary?.receivables.overdue)}
            context={summary && `${inr(summary.receivables.dueToday)} due today`}
            asOf={asOfLabel}
            to="/erp/billing?tab=outstanding&view=OVERDUE"
            cta="Chase"
          />
          <SnapshotCard
            label="Payables"
            icon={TrendingDown}
            tone="payable"
            loading={loading}
            value={compactInr(summary?.payables.total)}
            context={summary && (
              <>
                {'Vendor '}
                <strong>{compactInr(summary.payables.vendor.total)}</strong>
                {' · Supplier '}
                <strong>{compactInr(summary.payables.supplier.total)}</strong>
              </>
            )}
            asOf={asOfLabel}
            to="/erp/payables?tab=vendor"
            cta="Pay"
          />
          <SnapshotCard
            label="Net position"
            icon={Scale}
            tone="neutral"
            loading={loading}
            value={net ? inr(net.amount) : '—'}
            valueSuffix={net?.suffix || null}
            context="Receivables less payables"
            asOf={asOfLabel}
            derived
          />
          <SnapshotCard
            label="Unapplied receipts"
            icon={Inbox}
            tone="info"
            loading={loading}
            value={compactInr(summary?.unapplied.receipts.amount)}
            context={summary && `${num(summary.unapplied.receipts.count)} receipts to allocate`}
            asOf={asOfLabel}
            to="/erp/billing?tab=receipts"
            cta="Adjust"
          />
        </div>
      </section>

      {/* ── Level 2 · Where the money is stuck — ageing, both sides. ────────── */}
      <section className="acc-section">
        <div className="acc-ageing-grid">
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
      </section>

      {/* ── Level 3 · Cash flow + what lands in the next 7 days. ────────────── */}
      <section className="acc-section">
        <div className="acc-flow-grid">
          <div className="acc-card-panel acc-cash">
            <div className="acc-panel-head">
              <div className="acc-panel-title">
                <span className="acc-panel-ic acc-panel-ic--cash"><Wallet size={15} /></span>
                <div>
                  <h3>Cash movement</h3>
                  <p className="acc-panel-sub">
                    {periodLabel}
                    {' · '}
                    Cash movement, not a bank balance — this system has no bank ledger.
                  </p>
                </div>
              </div>
              <span className="acc-panel-total erp-numeric">
                {summary ? inr(summary.cashMovement.net) : '—'}
              </span>
            </div>

            <div className="acc-chart">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={cashData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke={C.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.muted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} tickFormatter={compactInr} axisLine={false} tickLine={false} width={64} />
                  <Tooltip
                    cursor={{ fill: 'rgba(79,70,229,0.05)' }}
                    contentStyle={{
                      borderRadius: 10, border: '1px solid #e6e9ef', fontSize: 12,
                      boxShadow: '0 8px 24px rgba(15,23,42,0.08)', padding: '8px 12px',
                    }}
                    formatter={(v, n) => [inr(v), n === 'in' ? 'Money in' : n === 'out' ? 'Money out' : 'Net']}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={9}
                    wrapperStyle={{ fontSize: 12, paddingTop: 6 }}
                    formatter={(v) => (v === 'in' ? 'Money in' : v === 'out' ? 'Money out' : 'Net')}
                  />
                  <Bar dataKey="in" fill={MONEY_SERIES.receivable} radius={[5, 5, 0, 0]} maxBarSize={72} />
                  <Bar dataKey="out" fill={MONEY_SERIES.payable} radius={[5, 5, 0, 0]} maxBarSize={72} />
                  <Line type="monotone" dataKey="net" stroke={C.ink} strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="acc-cash-legend">
              <div className="acc-cash-stat">
                <span className="acc-dot acc-dot--in" />
                <span className="acc-cash-stat-label">In</span>
                <strong className="erp-numeric">{summary ? inr(summary.cashMovement.in) : '—'}</strong>
                <span className="acc-cash-stat-meta">{summary?.cashMovement.inCount || 0} receipts</span>
              </div>
              <div className="acc-cash-stat">
                <span className="acc-dot acc-dot--out" />
                <span className="acc-cash-stat-label">Out</span>
                <strong className="erp-numeric">{summary ? inr(summary.cashMovement.out) : '—'}</strong>
                <span className="acc-cash-stat-meta">{summary?.cashMovement.outCount || 0} payments</span>
              </div>
            </div>
          </div>

          <div className="acc-card-panel acc-next7">
            <div className="acc-panel-head">
              <div className="acc-panel-title">
                <span className="acc-panel-ic acc-panel-ic--next"><CalendarClock size={15} /></span>
                <div>
                  <h3>Next 7 days</h3>
                  <p className="acc-panel-sub">Upcoming cash obligations</p>
                </div>
              </div>
            </div>

            <ul className="acc-next7-list">
              {next7.map((row) => (
                <li key={row.label}>
                  <Link to={row.to} className="acc-next7-row">
                    <span className="acc-next7-label">
                      <span className={`acc-next7-tick acc-next7-tick--${row.tone}`} />
                      {row.label}
                    </span>
                    <span className="acc-next7-amount">
                      <strong className="erp-numeric">{loading ? '…' : inr(row.value)}</strong>
                      <ArrowUpRight size={14} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Level 4 · Needs attention — the action queues. ──────────────────── */}
      <section className="acc-section">
        <div className="acc-card-panel acc-attention">
          <div className="acc-attention-head">
            <div className="acc-panel-title">
              <span className="acc-panel-ic acc-panel-ic--attn"><AlertTriangle size={15} /></span>
              <div>
                <h3>Needs attention</h3>
                <p className="acc-panel-sub">Items requiring follow-up or action</p>
              </div>
            </div>
            <Link to={queueLink} className="acc-viewall">
              View all
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="acc-attention-tabs">
            <div className="erp-tabs acc-subtabs">
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
          </div>

          <ErpTable
            columns={queueColumns}
            data={queueRows}
            loading={queueLoading}
            emptyText="Nothing needs attention here"
          />
        </div>
      </section>
    </div>
  );
};

export default FinancialCommandCenterPage;
