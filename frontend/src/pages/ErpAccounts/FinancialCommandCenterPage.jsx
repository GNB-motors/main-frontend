import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, Scale, Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';
import AgeingBar from '../../components/Erp/AgeingBar';
import DateRangeFilter from '../../components/Erp/DateRangeFilter';
import FinanceHubApi from './FinanceHubService';
import { inr, num, drCr } from '../../utils/formatMoney';
import { formatInrCompact } from '../../utils/formatters';
import { formatDateIST, toISTDateString } from '../../utils/dateUtils';
import OutstandingApi from '../ErpOutstanding/OutstandingService';
import VendorPaymentApi from '../ErpVendorPayments/VendorPaymentService';
import ReceiptApi from '../ErpReceipts/ReceiptService';
import SnapshotCard from './financialCommandCenter/SnapshotCard';
import { buildQueueColumns } from './financialCommandCenter/queueColumns';
import CashMovementPanel from './financialCommandCenter/CashMovementPanel';
import NextSevenDaysPanel from './financialCommandCenter/NextSevenDaysPanel';
import AttentionQueue from './financialCommandCenter/AttentionQueue';
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

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      try {
        const [s, a] = await Promise.all([
          FinanceHubApi.getSummary({ from: range.from, to: range.to }, { signal }),
          FinanceHubApi.getAgeing({ side: 'BOTH' }, { signal }),
        ]);
        setSummary(s.data);
        setAgeing(a.data);
      } catch (err) {
        if (err.code === 'ERR_CANCELED' || err.name === 'CanceledError') return;
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
    },
    [range.from, range.to],
  );

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      if (queue === 'overdue') {
        const res = await OutstandingApi.list({
          view: 'OVERDUE',
          limit: 8,
          sortBy: 'outstandingAmount',
        });
        setQueueRows(res.data || []);
      } else if (queue === 'payables') {
        const res = await VendorPaymentApi.getOutstanding({ limit: 8 });
        setQueueRows(res.data || []);
      } else {
        const res = await ReceiptApi.listUnadjusted({ limit: 8 });
        setQueueRows(res.data || []);
      }
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return;
      if (err.status !== 404) toast.error(err.message);
      setQueueRows([]);
    } finally {
      setQueueLoading(false);
    }
  }, [queue]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const asOfLabel = summary?.asOf ? `as of ${formatDateIST(summary.asOf)}` : null;
  const periodLabel = summary?.cashMovement
    ? `${formatDateIST(summary.cashMovement.from)} – ${formatDateIST(summary.cashMovement.to)}`
    : null;

  const net = summary ? drCr(summary.net.position) : null;

  // Single in/out pair for the range. The backend returns period totals rather
  // than a series, so this is an honest two-bar comparison, not a fake trend.
  const cashData = useMemo(() => {
    if (!summary?.cashMovement) return [];
    return [
      {
        name: 'This period',
        in: summary.cashMovement.in,
        out: summary.cashMovement.out,
        net: summary.cashMovement.net,
      },
    ];
  }, [summary]);

  const queueColumns = useMemo(() => buildQueueColumns(queue), [queue]);

  const queueLink = {
    overdue: '/erp/billing?tab=outstanding&view=OVERDUE',
    payables: '/erp/payables?tab=vendor',
    unapplied: '/erp/billing?tab=receipts',
  }[queue];

  const next7 = [
    {
      label: 'To collect',
      tone: 'in',
      value: summary?.receivables.dueThisWeek,
      to: '/erp/billing?tab=outstanding&view=UPCOMING',
    },
    {
      label: 'To pay',
      tone: 'out',
      value: summary?.payables.dueThisWeek,
      to: '/erp/payables?tab=vendor',
    },
    {
      label: 'Awaiting release',
      tone: 'muted',
      value: summary?.inFlight.awaitingRelease.amount,
      to: '/erp/payables?tab=vendor',
    },
    {
      label: 'Pending approval',
      tone: 'muted',
      value: summary?.inFlight.pendingApproval.amount,
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
        <button
          type="button"
          className="erp-btn acc-refresh"
          onClick={() => load()}
          disabled={loading}
        >
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
            value={formatInrCompact(summary?.receivables.total)}
            context={
              summary && (
                <>
                  <strong className="acc-ctx-danger">{inr(summary.receivables.overdue)}</strong>
                  {' overdue · '}
                  {num(summary.receivables.partyCount)}
                  {' parties'}
                </>
              )
            }
            asOf={asOfLabel}
            to="/erp/billing?tab=outstanding&view=ALL"
            cta="Outstanding"
          />
          <SnapshotCard
            label="Overdue"
            icon={AlertTriangle}
            tone="warn"
            loading={loading}
            value={formatInrCompact(summary?.receivables.overdue)}
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
            value={formatInrCompact(summary?.payables.total)}
            context={
              summary && (
                <>
                  {'Vendor '}
                  <strong>{formatInrCompact(summary.payables.vendor.total)}</strong>
                  {' · Supplier '}
                  <strong>{formatInrCompact(summary.payables.supplier.total)}</strong>
                </>
              )
            }
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
            value={formatInrCompact(summary?.unapplied.receipts.amount)}
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
            onBucketClick={(b) =>
              navigate(`/erp/billing?tab=outstanding&bucket=${encodeURIComponent(b)}`)
            }
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
          <CashMovementPanel periodLabel={periodLabel} summary={summary} cashData={cashData} />

          <NextSevenDaysPanel next7={next7} loading={loading} />
        </div>
      </section>

      {/* ── Level 4 · Needs attention — the action queues. ──────────────────── */}
      <AttentionQueue
        queueLink={queueLink}
        queue={queue}
        setQueue={setQueue}
        queueColumns={queueColumns}
        queueRows={queueRows}
        queueLoading={queueLoading}
      />
    </div>
  );
};

export default FinancialCommandCenterPage;
