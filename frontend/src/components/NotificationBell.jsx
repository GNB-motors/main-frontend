import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, X, CheckCheck } from 'lucide-react';
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
// entries (see sideNavUtils.js). The unread badge tracks the owner-alert feed
// (which also carries refuel notifications as REFUEL_ESTIMATED).
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
    counted: true, // the unread badge comes from this feed
  },
];

const NotificationBell = () => {
  const navigate = useNavigate();
  const { canAccess } = useFeatureFlags();
  const [open, setOpen] = React.useState(false);
  const [unread, setUnread] = React.useState(0);
  // Ids we've already counted/toasted, so the SSE reconnect burst (last 24 h)
  // and repeated ticks never double-count or re-toast.
  const seenIds = React.useRef(new Set());

  const items = ALERT_ITEMS.filter((item) => canAccess(item.key));
  const canSeeAlerts = canAccess('fleetIntelligence');

  const refreshCount = React.useCallback(async () => {
    try {
      const data = await OwnerAlertsService.getAlerts({ acknowledged: false, limit: 50 });
      (data.records || []).forEach((a) => seenIds.current.add(String(a.id)));
      setUnread(data.unacknowledgedCount ?? (data.records?.length || 0));
    } catch {
      // Silent — a missing feed must never break the navbar.
    }
  }, []);

  // Initial unread count (REST-first).
  React.useEffect(() => {
    if (!canSeeAlerts) return undefined;
    let cancelled = false;
    (async () => {
      if (!cancelled) await refreshCount();
    })();
    return () => {
      cancelled = true;
    };
  }, [canSeeAlerts, refreshCount]);

  // Real-time — the shared SSE stream's `alerts` event. Only genuinely new ids
  // (not in the initial load / earlier ticks) bump the badge and toast.
  React.useEffect(() => {
    if (!canSeeAlerts) return undefined;
    let cancelled = false;
    let unsub = null;
    import('../lib/liveStream')
      .then(({ getLiveStream }) => {
        if (cancelled) return;
        unsub = getLiveStream().subscribe('alerts', (incoming) => {
          const rows = Array.isArray(incoming) ? incoming : [];
          const fresh = rows.filter((a) => a && !seenIds.current.has(String(a.id)));
          if (!fresh.length) return;
          fresh.forEach((a) => seenIds.current.add(String(a.id)));
          setUnread((n) => n + fresh.length);
          const first = fresh[0];
          const label = ALERT_TYPE_LABELS[first.type] || 'New alert';
          toast.info(
            fresh.length === 1
              ? `${label}${first.vehicleNumber ? ` — ${first.vehicleNumber}` : ''}`
              : `${fresh.length} new notifications`,
          );
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [canSeeAlerts]);

  const handleOpenChange = (next) => {
    setOpen(next);
    // Re-sync the count on open — picks up anything acknowledged on the pages.
    if (next) refreshCount();
  };

  if (!canSeeAlerts && items.length === 0) return null;

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  const markAllRead = async () => {
    setUnread(0);
    try {
      await OwnerAlertsService.acknowledgeAllAlerts();
    } catch {
      // If it fails, the next open re-syncs the real count.
      refreshCount();
    }
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

        <nav className="flex flex-col gap-1 p-3">
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
              <span className="flex shrink-0 items-center gap-2">
                {item.counted && unread > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
                <ChevronRight size={16} className="text-muted-foreground" />
              </span>
            </button>
          ))}
        </nav>

        {unread > 0 && (
          <div className="border-t border-[var(--ds-line)] p-3">
            <button
              type="button"
              onClick={markAllRead}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--ds-radius-md)] border border-[var(--ds-line)] px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-[var(--ds-sunk)]"
            >
              <CheckCheck size={15} /> Mark all read
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBell;
