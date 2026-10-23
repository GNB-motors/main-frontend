import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, RefreshCw, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from './ui/sheet.jsx';
import FleetLinkAccountCard from './FleetLinkAccountCard.jsx';
import FleetLinkSteps from './FleetLinkSteps.jsx';
import FleetConnectionsIalert from './FleetConnectionsIalert.jsx';
import ProviderMark from './ProviderMark.jsx';
import { useFleetLink } from '../contexts/fleetLinkContext';
import { needsAction } from '../lib/fleetLink';
import { overviewTiles } from '../lib/fleetConnections';
import { isDesktopChrome, pingExtension } from '../lib/gnbEdgeExtension';
import useApi from '../hooks/useApi';
import { getUserRole } from '../utils/session';
import { canViewIalertAccounts } from '../pages/Settings/ialertAccountsModel.js';
import { fetchIalertStatus } from '../pages/Settings/ialertStatusApi.js';
import { fetchIalertVehicles } from '../pages/IalertFleet/ialertFleetApi.js';

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
 * Fleet connections: every telematics link the org has — Tata FleetEdge and
 * Ashok Leyland iALERT — what needs the customer, which trucks each carries,
 * and the steps to fix a broken FleetEdge link. Lazy-loaded by
 * FleetLinkProvider on first open.
 */
export default function FleetLinkSheet({ open, focusAccountId, onOpenChange }) {
  const { data, error, checking, checkAgain } = useFleetLink();
  const [extension, setExtension] = useState('unknown');
  // iALERT is read only while the panel is open, and only by the roles its
  // routes allow (others would just get a 403).
  const ialertAllowed = canViewIalertAccounts(getUserRole());
  const ialertStatus = useApi((signal) => fetchIalertStatus(signal), [], {
    enabled: open && ialertAllowed,
  });
  const ialertVehicles = useApi((signal) => fetchIalertVehicles(signal), [], {
    enabled: open && ialertAllowed,
  });

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
  const connected = accounts.filter((a) => !needsAction(a));
  const noAccounts = Boolean(data) && accounts.length === 0;
  const summary = data?.summary ? summaryLine(data.summary) : null;
  const close = () => onOpenChange(false);
  const tiles = overviewTiles(data, ialertAllowed ? ialertStatus.data : null);
  const refreshAll = () => {
    checkAgain();
    if (ialertAllowed) {
      ialertStatus.refetch();
      ialertVehicles.refetch();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md">
        <SheetHeader>
          <div className="min-w-0">
            <SheetTitle>Fleet connections</SheetTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Where GNB gets live data for your trucks.
            </p>
          </div>
          <SheetClose
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[var(--ds-sunk)]"
            aria-label="Close Fleet connections"
          >
            <X size={18} />
          </SheetClose>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <dl className="fleet-tiles">
            {tiles.map((tile) => (
              <div key={tile.key} className={`fleet-tile fleet-tile--${tile.tone}`}>
                <dt>{tile.label}</dt>
                <dd>{data ? (tile.display ?? tile.value.toLocaleString('en-IN')) : '—'}</dd>
              </div>
            ))}
          </dl>

          <section className="fleet-section" aria-labelledby="fleet-section-fe">
          <header className="fleet-section-head">
            <ProviderMark provider="fleetedge" />
            <h3 id="fleet-section-fe">Tata FleetEdge</h3>
          </header>
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
          {!data && !error ? (
            <p className="text-sm text-muted-foreground">Checking your FleetEdge accounts…</p>
          ) : null}

          {noAccounts ? (
            <p className="rounded-[var(--ds-radius-sm)] bg-[var(--ds-sunk)] px-3 py-2 text-sm font-semibold">
              No FleetEdge account is connected yet. Connect one from the GNB Edge extension to
              start receiving live vehicle data.
            </p>
          ) : null}

          {data && !noAccounts && actionable.length === 0 ? (
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

          {actionable.length && connected.length ? (
            <h3 className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Working fine
            </h3>
          ) : null}
          {connected.map((account) => (
            <FleetLinkAccountCard key={account.accountId} account={account} onNavigate={close} />
          ))}

          {actionable.length || noAccounts ? (
            <FleetLinkSteps
              fleetIds={actionable.map((a) => a.fleetId).filter(Boolean)}
              extension={extension}
              desktop={isDesktopChrome()}
              title={noAccounts ? 'How to connect FleetEdge (about 2 minutes)' : null}
            />
          ) : null}
          </section>

          {ialertAllowed ? (
            <FleetConnectionsIalert
              rows={ialertStatus.data}
              vehicles={ialertVehicles.data?.vehicles || []}
              loading={ialertStatus.loading}
              failed={Boolean(ialertStatus.error)}
              onNavigate={close}
            />
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-[var(--ds-line)] p-3">
          <button
            type="button"
            onClick={refreshAll}
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
