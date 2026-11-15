import { Link } from 'react-router-dom';
import { PlugZap } from 'lucide-react';
import { formatAgo } from '../../utils/redesign/format';

/**
 * AccountLinkBanner — a vendor account that needs re-linking.
 *
 * A disconnected account is the reason "the trucks went quiet", so it is
 * pinned above the list: it explains itself and it carries the one button
 * that fixes it. The card cannot be dismissed while the state is bad,
 * because the problem has not gone away.
 */
export default function AccountLinkBanner({ account }) {
  if (!account) return null;

  const isDisconnected = account.state === 'NEEDS_RELINK';
  const isExpiring = account.state === 'EXPIRING';
  if (!isDisconnected && !isExpiring) return null;

  const tone = isDisconnected ? 'act' : 'watch';
  const trucks = Number.isFinite(account.trucks) ? account.trucks : null;
  const since = account.lastDataAt ? formatAgo(account.lastDataAt) : null;

  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--rd-radius)] border px-4 py-3 ${
        tone === 'act'
          ? 'border-[var(--rd-act)] bg-[var(--rd-act-tint)]'
          : 'border-[var(--rd-watch)] bg-[var(--rd-watch-tint)]'
      }`}
    >
      <PlugZap
        size={18}
        aria-hidden="true"
        className={`shrink-0 ${tone === 'act' ? 'text-[var(--rd-act)]' : 'text-[var(--rd-watch)]'}`}
      />
      <p
        className={`m-0 min-w-0 flex-1 text-[13px] ${
          tone === 'act' ? 'text-[var(--rd-act-ink)]' : 'text-[var(--rd-watch-ink)]'
        }`}
      >
        <strong>{account.accountName}</strong>:{' '}
        {isDisconnected ? (
          <>
            account disconnected.{' '}
            {trucks == null
              ? 'Its trucks have'
              : `${trucks} ${trucks === 1 ? 'truck has' : 'trucks have'}`}{' '}
            no live data{since ? ` since ${since}` : ''}.
          </>
        ) : (
          <>link expires soon; reconnect to avoid a gap.</>
        )}
      </p>
      {account.action?.to ? (
        <Link
          to={account.action.to}
          className={`shrink-0 rounded-[var(--rd-radius-sm)] px-3 py-1.5 text-[13px] font-semibold text-white no-underline ${
            tone === 'act' ? 'bg-[var(--rd-act)]' : 'bg-[var(--rd-watch)]'
          }`}
        >
          {account.action.label || 'Reconnect'}
        </Link>
      ) : null}
    </div>
  );
}
