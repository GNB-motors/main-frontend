import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, X } from 'lucide-react';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext';
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

const NotificationBell = () => {
  const navigate = useNavigate();
  const { canAccess } = useFeatureFlags();
  const [open, setOpen] = React.useState(false);

  const items = ALERT_ITEMS.filter((item) => canAccess(item.key));

  // Nothing this user is entitled to → no bell at all, rather than an empty panel.
  if (items.length === 0) return null;

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <Sheet open={open} onOpenChange={(next) => setOpen(next)}>
      <SheetTrigger className="navbar-bell" aria-label="Alerts">
        <Bell size={18} />
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Alerts</SheetTitle>
          <SheetClose
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-[var(--ds-sunk)]"
            aria-label="Close alerts"
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
              <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationBell;
