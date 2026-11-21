import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import '../KhataLedger.css';
import './khataTransactions.css';

const kmPerLitre = (value) => (value != null && Number.isFinite(value) ? value.toFixed(2) : '—');

/** Why a fuel refill was flagged: measured km/L against the expected baseline. */
const FuelAnomalyModal = ({ isOpen, onClose, flag, title = 'Mileage flag' }) => {
  const { actualKmPerL: actual, expectedKmPerL: expected } = flag || {};
  const variance = Number.isFinite(flag?.variancePct)
    ? flag.variancePct
    : Number.isFinite(actual) && Number.isFinite(expected) && expected > 0
      ? ((actual - expected) / expected) * 100
      : null;
  const hasVariance = variance != null;

  return (
    <Dialog
      open={Boolean(isOpen && flag)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent forceBackdrop className="khata-dialog max-w-md">
        <DialogHeader className="px-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            This refill&apos;s mileage is outside the usual range for this vehicle. A person should
            look; it is not proof of a problem.
          </DialogDescription>
        </DialogHeader>
        {flag ? (
          <div className="khata-dialog-body">
            <div className="khata-mileage-figures">
              <div className="khata-mileage-figure">
                <span>Measured</span>
                <strong>
                  {kmPerLitre(flag.actualKmPerL)}
                  <small>km/L</small>
                </strong>
              </div>
              <div className="khata-mileage-figure">
                <span>Expected</span>
                <strong>
                  {kmPerLitre(flag.expectedKmPerL)}
                  <small>km/L</small>
                </strong>
              </div>
            </div>
            <div className="khata-rows">
              <div>
                <span>Difference</span>
                <span className={hasVariance && variance < 0 ? 'khata-bad-ink' : undefined}>
                  {hasVariance ? `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%` : '—'}
                </span>
              </div>
            </div>
            {flag.reason ? (
              <div className="khata-note">
                <Info size={16} aria-hidden="true" />
                <p>{flag.reason}</p>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="khata-dialog-foot">
          <button type="button" className="khata-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FuelAnomalyModal;
