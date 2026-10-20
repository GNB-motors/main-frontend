import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import { useApi } from '../../hooks/useApi';
import { formatNum } from '../../utils/formatters';
import { formatDateIST } from '../../utils/dateUtils';
import { connectionBadge, planFleetTotal, planPhrases } from './ialertAccountsModel.js';
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
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold text-slate-800">
          {account.friendlyName || account.externalAccountId}
        </span>
        <Badge {...badge} />
      </div>
      <p className="mt-1 font-mono text-xs text-slate-400">{account.externalAccountId}</p>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
        <span>
          {formatNum(account.vehicleCount || 0)} vehicle{account.vehicleCount === 1 ? '' : 's'}{' '}
          synced
        </span>
        {fleetTotal != null ? <span>{formatNum(fleetTotal)} in iALERT</span> : null}
        {account.lastDataAt ? <span>Last data {formatDateIST(account.lastDataAt)}</span> : null}
      </div>
      {phrases.length ? (
        <ul className="mt-2 space-y-0.5 text-xs">
          {phrases.map((p) => (
            <li key={p.text} className={TEXT_TONE[p.tone]}>
              {p.text}
            </li>
          ))}
        </ul>
      ) : null}
      {account.lastErrorMessage ? (
        <p className="mt-2 text-xs text-red-500">{account.lastErrorMessage.slice(0, 160)}</p>
      ) : null}
    </div>
  );
}

export default function IalertAccountsPage() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useApi((signal) => fetchIalertStatus(signal), []);
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
      {loading && !data ? (
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
