import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, RefreshCw, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from './ui/sheet.jsx';
import FleetLinkAccountCard from './FleetLinkAccountCard.jsx';
import FleetLinkSteps from './FleetLinkSteps.jsx';
import { useFleetLink } from '../contexts/fleetLinkContext';
import { needsAction } from '../lib/fleetLink';
import { isDesktopChrome, pingExtension } from '../lib/gnbEdgeExtension';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function summaryLine(summary) {
  if (summary.needsRelink > 0) {
    const vehicles = summary.affectedVehicles
      ? ` · live data paused for ${plural(summary.affectedVehicles, 'vehicle', 'vehicles')}`
      : '';
    return {
      tone: 'crit',
      text: `${plural(summary.needsRelink, 'account', 'accounts')} disconnected${vehicles}`,
    };
  }
  if (summary.expiring > 0) {
    return {
      tone: 'warn',
      text: `${plural(summary.expiring, 'account expires', 'accounts expire')} soon`,
    };
  }
  return null;
}

/**
 * The relink panel: which FleetEdge accounts need the customer, which trucks
 * they carry, and the three steps to fix it. Lazy-loaded by FleetLinkProvider
 * on first open.
 */
export default function FleetLinkSheet({ open, focusAccountId, onOpenChange }) {
  const { data, error, checking, checkAgain } = useFleetLink();
  const [extension, setExtension] = useState('unknown');

  useEffect(() => {
    if (!open) return undefined;
    let live = true;
    pingExtension().then((result) => {
      if (live) setExtension(result);
    });
    return () => {
      live = false;
    };
  }, [open]);

  const accounts = data?.accounts || [];
  const actionable = accounts
    .filter(needsAction)
    .sort((a, b) => (b.accountId === focusAccountId) - (a.accountId === focusAccountId));
  const recovering = accounts.filter((a) => a.state === 'RECOVERING');
  const summary = data?.summary ? summaryLine(data.summary) : null;
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md">
        <SheetHeader>
          <SheetTitle>FleetEdge connection</SheetTitle>
          <SheetClose
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[var(--ds-sunk)]"
            aria-label="Close FleetEdge connection"
          >
            <X size={18} />
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
          {summary ? (
            <p
              className={`rounded-[var(--ds-radius-sm)] px-3 py-2 text-sm font-semibold ${
                summary.tone === 'crit'
                  ? 'bg-[var(--ds-crit-tint)] text-[var(--ds-crit-ink)]'
                  : 'bg-[var(--ds-warn-tint)] text-[var(--ds-warn-ink)]'
              }`}
            >
              {summary.text}
            </p>
          ) : null}

          {!data && error ? (
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t check FleetEdge right now. Press Check again in a moment.
            </p>
          ) : null}

          {data && actionable.length === 0 ? (
            <p className="flex items-center gap-2 rounded-[var(--ds-radius-sm)] bg-[var(--ds-ok-tint)] px-3 py-2 text-sm font-semibold text-[var(--ds-ok-ink)]">
              <CheckCircle2 size={16} /> Every FleetEdge account is connected.
            </p>
          ) : null}

          {actionable.map((account) => (
            <FleetLinkAccountCard
              key={account.accountId}
              account={account}
              highlighted={account.accountId === focusAccountId}
              onNavigate={close}
            />
          ))}

          {recovering.length ? (
            <p className="text-xs text-muted-foreground">
              {recovering.map((a) => a.friendlyName || a.fleetId).join(', ')}: renewing
              automatically, nothing to do.
            </p>
          ) : null}

          {actionable.length ? (
            <FleetLinkSteps
              fleetIds={actionable.map((a) => a.fleetId).filter(Boolean)}
              extension={extension}
              desktop={isDesktopChrome()}
            />
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[var(--ds-line)] p-3">
          <button
            type="button"
            onClick={checkAgain}
            className="inline-flex items-center gap-2 rounded-[var(--ds-radius-md)] border border-[var(--ds-line)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--ds-sunk)]"
          >
            <RefreshCw size={15} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Checking…' : 'Check again'}
          </button>
          <Link
            to="/settings/fleetedge-accounts"
            onClick={close}
            className="text-sm font-medium text-muted-foreground hover:underline"
          >
            Manage accounts →
          </Link>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
