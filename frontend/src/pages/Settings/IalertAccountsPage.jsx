import { useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { useApi } from '../../hooks/useApi';
import { formatNum, timeAgo } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';
import { getUserRole } from '../../utils/session.js';
import {
  canViewIalertAccounts,
  connectionBadge,
  planFleetTotal,
  planPhrases,
  syncErrorText,
} from './ialertAccountsModel.js';
import { fetchIalertStatus } from './ialertStatusApi.js';

// Read-only: linking and unlinking happen in the GNB extension (iALERT F1).

const TONE = {
  ok: 'bg-emerald-100 text-emerald-700',
  warn: 'bg-amber-100 text-amber-700',
  crit: 'bg-red-100 text-red-700',
  grey: 'bg-slate-100 text-slate-600',
};
const TEXT_TONE = { warn: 'text-amber-700', crit: 'text-red-600' };

function Badge({ label, tone }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${TONE[tone] || TONE.grey}`}>
      {label}
    </span>
  );
}

function AccountCard({ account }) {
  const badge = connectionBadge(account);
  const phrases = planPhrases(account.plan);
  const fleetTotal = planFleetTotal(account.plan);
  const synced = account.vehicleCount || 0;
  const syncError = syncErrorText(account);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="truncate text-[15px] font-semibold text-slate-900">
              {account.friendlyName || `iALERT account ${account.externalAccountId}`}
            </span>
            <Badge {...badge} />
          </div>
          <p className="mt-0.5 text-xs text-slate-500">iALERT ID {account.externalAccountId}</p>
        </div>
        <Link
          to="/ialert/vehicles"
          className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent-ink)] hover:underline"
        >
          View vehicles <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-500">Syncing to GNB</dt>
          <dd className="text-lg font-semibold tabular-nums text-slate-900">{formatNum(synced)}</dd>
        </div>
        {fleetTotal != null ? (
          <div>
            <dt className="text-xs text-slate-500">In iALERT</dt>
            <dd className="text-lg font-semibold tabular-nums text-slate-900">
              {formatNum(fleetTotal)}
            </dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-slate-500">Last data</dt>
          <dd
            className="text-lg font-semibold text-slate-900"
            title={account.lastDataAt ? formatDateIST(account.lastDataAt) : undefined}
          >
            {account.lastDataAt ? timeAgo(account.lastDataAt) : 'Not yet'}
          </dd>
        </div>
      </dl>
      {phrases.length ? (
        <ul className="mt-3 space-y-0.5 text-sm">
          {phrases.map((p) => (
            <li key={p.text} className={TEXT_TONE[p.tone] || 'text-slate-600'}>
              {p.text}
            </li>
          ))}
        </ul>
      ) : null}
      {syncError ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{syncError}</p>
      ) : null}
    </div>
  );
}

export default function IalertAccountsPage() {
  const navigate = useNavigate();
  const allowed = canViewIalertAccounts(getUserRole());
  const { data, loading, error, refetch } = useApi(
    (signal) => (allowed ? fetchIalertStatus(signal) : Promise.resolve([])),
    [allowed],
  );
  const accounts = data || [];

  // PageShell owns its padding
  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  return (
    <PageShell
      title={
        <span className="inline-flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/settings?section=fleet-data')}
            className="inline-flex items-center justify-center rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
            title="Back to Settings"
            aria-label="Back to Settings"
          >
            <ArrowLeft size={16} />
          </button>
          <span>iALERT Accounts</span>
        </span>
      }
      subtitle="iALERT accounts you connected from the GNB extension"
      count={accounts.length || null}
    >
      {!allowed ? (
        <p className="py-12 text-center text-sm text-slate-400">
          Only owners and managers can view iALERT accounts.
        </p>
      ) : loading && !data ? (
        <p className="py-12 text-center text-sm text-slate-400">Loading…</p>
      ) : error && !data ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 py-8 text-center">
          <p className="text-sm font-semibold text-red-600">Could not load iALERT accounts</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 rounded-lg bg-red-100 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <p className="text-sm font-semibold text-slate-500">No iALERT account connected</p>
          <p className="mt-1 text-xs text-slate-400">
            Connect iALERT from the GNB extension to start syncing vehicles.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <AccountCard key={account.tokenDocId || account.accountId} account={account} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
