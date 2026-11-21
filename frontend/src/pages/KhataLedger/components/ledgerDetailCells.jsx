import { AlertTriangle } from 'lucide-react';
import { KhataPill } from './khataUi';
import { getVehicleLabel, getDriverName } from '../utils';
import { categoryLabel, sourceLabel, statusLabel, statusTone } from './ledgerDetailLogic';

/**
 * Cell components for the ledger detail transactions table.
 */

export const LedgerCategoryBadge = ({ category }) => (
  <KhataPill small>{categoryLabel(category)}</KhataPill>
);

export const LedgerSourceBadge = ({ source }) => (
  <span className="is-secondary">{sourceLabel(source)}</span>
);

export const LedgerStatusBadge = ({ status }) => (
  <KhataPill small tone={statusTone(status)}>
    {statusLabel(status)}
  </KhataPill>
);

export const MileageFlagChip = ({ flag, onClick }) => {
  const actual = flag.actualKmPerL != null ? flag.actualKmPerL.toFixed(2) : '—';
  return (
    <button
      type="button"
      onClick={onClick}
      className="khata-pill khata-pill--warn khata-pill--sm khata-flag"
      aria-label={`Mileage ${actual} km/L against ${flag.expectedKmPerL} km/L expected. Open details`}
    >
      <AlertTriangle size={11} aria-hidden="true" />
      {actual} vs {flag.expectedKmPerL} km/L
    </button>
  );
};

export const TxTitleCell = ({ title, description, mileageFlag, onOpenAnomaly }) => (
  <div className="khata-tx-title">
    <span className="khata-cell-main">{title}</span>
    {description ? <span className="khata-cell-sub">{description}</span> : null}
    {mileageFlag ? (
      <MileageFlagChip flag={mileageFlag} onClick={() => onOpenAnomaly?.(mileageFlag)} />
    ) : null}
  </div>
);

export const EntityRefCell = ({ entity, kind }) => {
  if (!entity) return <span className="khata-muted">—</span>;
  return kind === 'vehicle' ? (
    <span className="is-code">{getVehicleLabel(entity)}</span>
  ) : (
    <span>{getDriverName(entity)}</span>
  );
};

// Only ERP trips carry a trip number. Expense rows also link auto-detected
// trips, which the ERP trip window can't open, so those stay plain text.
export const TripRefCell = ({ trip, onOpenTrip }) => {
  if (!trip || !trip._id) return <span className="khata-muted">—</span>;
  if (!trip.tripNumber) {
    return <span className="is-code khata-muted">Trip {trip._id.slice(-6).toUpperCase()}</span>;
  }
  const label = trip.tripNumber;
  return (
    <button
      type="button"
      onClick={() => onOpenTrip?.(trip._id)}
      className="khata-link"
      aria-label={`Open trip ${label}`}
    >
      {label}
    </button>
  );
};

export const ReceiptCell = ({ receiptUrl, onPreviewReceipt }) => {
  if (!receiptUrl) return <span className="khata-muted">—</span>;
  return (
    <button type="button" onClick={() => onPreviewReceipt?.(receiptUrl)} className="khata-link">
      View
    </button>
  );
};
