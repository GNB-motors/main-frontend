import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  X,
  Fuel,
  AlertTriangle,
  Gauge,
  Droplets,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
import { OwnerAlertsService, ALERT_TYPE_LABELS } from '../pages/OwnerAlerts/OwnerAlertsService.jsx';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from './ui/sheet.jsx';

// Alert surfaces relocated out of the Fleet Intelligence nav group — they are
// now reached only through this bell. `key` mirrors the feature-flag gate the
// nav items carried, so who can see them stays identical to the old sidebar
// entries (see sideNavUtils.js).
const ALERT_ITEMS = [
  {
    to: '/fleet-alerts',
    key: 'fleetIntelligence',
    label: 'Fleet Alerts',
    description: 'Vehicle & fuel anomalies across the fleet',
  },
  {
    to: '/owner-alerts',
    key: 'fleetIntelligence',
    label: 'Owner Alerts',
    description: 'High-priority alerts flagged for owners',
  },
];

// A small icon per alert family so the feed scans quickly.
function typeIcon(type) {
  if (!type) return <Bell size={15} />;
  if (type.includes('REFUEL')) return <Fuel size={15} />;
  if (type.includes('SIPHON') || type.includes('DRAIN') || type.includes('THEFT'))
    return <ShieldAlert size={15} />;
  if (type.includes('ADBLUE')) return <Droplets size={15} />;
  if (type.includes('IDLING') || type.includes('OVERSPEED')) return <Gauge size={15} />;
  return <AlertTriangle size={15} />;
}

const MAX_FEED = 30;

const NotificationBell = () => {
  const navigate = useNavigate();
  const { canAccess } = useFeatureFlags();
  const [open, setOpen] = React.useState(false);
  const [alerts, setAlerts] = React.useState([]);
  const [unread, setUnread] = React.useState(0);

  const items = ALERT_ITEMS.filter((item) => canAccess(item.key));
  // The feed and the nav links share the fleetIntelligence gate.
  const canSeeAlerts = canAccess('fleetIntelligence');

  // Initial load — recent unread alerts + the badge count (REST-first).
  React.useEffect(() => {
    if (!canSeeAlerts) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const data = await OwnerAlertsService.getAlerts({ acknowledged: false, limit: 15 });
        if (cancelled) return;
        setAlerts(data.records || []);
        setUnread(data.unacknowledgedCount ?? (data.records?.length || 0));
      } catch {
        // Silent — a missing feed must never break the navbar.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canSeeAlerts]);

  // Real-time — piggyback the shared SSE stream's `alerts` event (no new socket).
  React.useEffect(() => {
    if (!canSeeAlerts) return undefined;
    let cancelled = false;
    let unsub = null;
    import('../lib/liveStream')
      .then(({ getLiveStream }) => {
        if (cancelled) return;
        unsub = getLiveStream().subscribe('alerts', (incoming) => {
          const rows = Array.isArray(incoming) ? incoming : [];
          if (!rows.length) return;
          setAlerts((prev) => {
            const seen = new Set(prev.map((a) => String(a.id)));
            const fresh = rows.filter((a) => a && !seen.has(String(a.id)));
            if (fresh.length) {
              setUnread((n) => n + fresh.length);
              const first = fresh[0];
              const label = ALERT_TYPE_LABELS[first.type] || 'New alert';
              toast.info(
                fresh.length === 1
                  ? `${label}${first.vehicleNumber ? ` — ${first.vehicleNumber}` : ''}`
                  : `${fresh.length} new notifications`,
              );
            }
            return [...fresh, ...prev].slice(0, MAX_FEED);
          });
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [canSeeAlerts]);

  // Opening the bell = "seen": clear the badge and acknowledge on the server so
  // the same notifications don't light up again on the next load.
  const handleOpenChange = (next) => {
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      OwnerAlertsService.acknowledgeAllAlerts().catch(() => {});
    }
  };

  if (!canSeeAlerts && items.length === 0) return null;

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger className="navbar-bell relative" aria-label="Notifications">
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetClose
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[var(--ds-sunk)]"
            aria-label="Close notifications"
          >
            <X size={18} />
          </SheetClose>
        </SheetHeader>

        {/* Live notification feed */}
        <div className="flex max-h-[55vh] flex-col gap-1 overflow-y-auto p-3">
          {alerts.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              No new notifications.
            </p>
          ) : (
            alerts.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-[var(--ds-radius-md)] border border-transparent px-3 py-2.5 hover:border-[var(--ds-line)] hover:bg-[var(--ds-sunk)]"
              >
                <span className="mt-0.5 shrink-0 text-[var(--ds-ink3)]">{typeIcon(a.type)}</span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold">
                    {ALERT_TYPE_LABELS[a.type] || a.type}
                    {a.vehicleNumber ? ` · ${a.vehicleNumber}` : ''}
                  </span>
                  {a.message ? (
                    <span className="text-xs text-muted-foreground">{a.message}</span>
                  ) : null}
                  <span className="text-[11px] text-muted-foreground">
                    {a.at ? new Date(a.at).toLocaleString() : ''}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Jump to the full alert pages */}
        <nav className="flex flex-col gap-1 border-t border-[var(--ds-line)] p-3">
          {items.map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => go(item.to)}
              className="flex w-full items-center justify-between gap-3 rounded-[var(--ds-radius-md)] border border-transparent px-4 py-3 text-left transition-colors hover:border-[var(--ds-line)] hover:bg-[var(--ds-sunk)]"
            >
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBell;
