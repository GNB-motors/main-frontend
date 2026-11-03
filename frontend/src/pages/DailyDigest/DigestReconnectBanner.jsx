import { PlugZap } from 'lucide-react';
import Link from '@/components/redesign/FleetLink';
import { formatAgo } from '../../utils/redesign/format';

/**
 * DigestReconnectBanner — a vendor account that stopped sending data.
 *
 * "Your trucks went quiet" is useless on its own. This says which account,
 * how long it has been quiet and how many trucks are affected, and it puts
 * the one button that fixes it right there.
 */
export default function DigestReconnectBanner({ item }) {
  if (!item) return null;

  const since = item.since ? formatAgo(item.since) : null;
  const trucks = item.trucksAffected ?? 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--rd-radius)] border border-[var(--rd-act)] bg-[var(--rd-act-tint)] px-4 py-3">
      <PlugZap size={18} aria-hidden="true" className="shrink-0 text-[var(--rd-act)]" />
      <p className="m-0 min-w-0 flex-1 text-[13px] text-[var(--rd-act-ink)]">
        <strong>{item.accountName}</strong> is disconnected
        {since ? ` since ${since}` : ''}. {trucks} {trucks === 1 ? 'truck has' : 'trucks have'} no
        live data.
      </p>
      {item.action?.to ? (
        <Link
          to={item.action.to}
          className="shrink-0 rounded-[var(--rd-radius-sm)] bg-[var(--rd-act)] px-3 py-1.5 text-[13px] font-semibold text-white no-underline"
        >
          {item.action.label || 'Reconnect'}
        </Link>
      ) : null}
    </div>
  );
}
