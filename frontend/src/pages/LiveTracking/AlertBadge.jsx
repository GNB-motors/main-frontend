import { Bell, X } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '../../components/ui/dialog';
import VehicleAlertSummary from './VehicleAlertSummary';

/**
 * An alert icon opens the truck's reasons; its accessible label retains the count.
 *
 * The count is the unacknowledged alerts of the last 24 hours for this truck.
 * Nothing to say means no badge, never a zero.
 */
export default function AlertBadge({ count, alerts = [], registrationNumber }) {
  const total = Number(count ?? alerts.length);
  if (!Number.isFinite(total) || total <= 0) return null;
  const label = `${total} unacknowledged alert${total === 1 ? '' : 's'}`;
  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="lt-alert-badge inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-[var(--rd-act)] hover:bg-[var(--rd-act-tint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand)]"
            aria-label={`View ${label}${registrationNumber ? ` for ${registrationNumber}` : ''}`}
          >
            <Bell size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        }
      />
      <DialogContent className="max-w-[min(480px,calc(100vw-32px))] border-[var(--rd-line)] bg-[var(--rd-card)]">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--rd-line)] p-4">
          <div>
            <DialogTitle className="text-[15px] text-[var(--rd-ink)]">
              {registrationNumber ? `Alerts for ${registrationNumber}` : 'Truck alerts'}
            </DialogTitle>
            <DialogDescription className="mt-1 text-[12px]">
              {label} · last 24 hours
            </DialogDescription>
          </div>
          <DialogClose
            aria-label="Close alert details"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded border border-[var(--rd-line)] text-[var(--rd-ink-2)]"
          >
            <X size={16} aria-hidden="true" />
          </DialogClose>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-4">
          {alerts.length ? (
            <VehicleAlertSummary
              alerts={alerts}
              registrationNumber={registrationNumber}
              showHeading={false}
            />
          ) : (
            <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">
              The live feed did not include details for this alert.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
