import React from 'react';
import { AlertTriangle, User, Truck, Route, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SOURCE_LABELS,
  SOURCE_COLORS,
  STATUS_LABELS,
  STATUS_COLORS,
  getVehicleLabel,
  getDriverName,
} from '../utils';

/**
 * Cell components for the ledger detail transactions table.
 */

export const LedgerCategoryBadge = ({ category }) => (
  <Badge className={`text-xs ${CATEGORY_COLORS[category] || CATEGORY_COLORS.MISCELLANEOUS}`}>
    {CATEGORY_LABELS[category] || category}
  </Badge>
);

export const LedgerSourceBadge = ({ source }) => (
  <Badge variant="outline" className={`text-xs ${SOURCE_COLORS[source] || SOURCE_COLORS.MANUAL}`}>
    {SOURCE_LABELS[source] || source}
  </Badge>
);

export const LedgerStatusBadge = ({ status }) => (
  <Badge
    className={`text-[10px] font-semibold ${STATUS_COLORS[status] || STATUS_COLORS.CONFIRMED}`}
  >
    {STATUS_LABELS[status] || status || 'CONFIRMED'}
  </Badge>
);

export const MileageFlagChip = ({ flag, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title={flag.reason}
    className="mt-1 inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 hover:bg-amber-100 transition-colors"
  >
    <AlertTriangle size={11} />
    {flag.actualKmPerL?.toFixed(2)} vs {flag.expectedKmPerL} km/L
  </button>
);

export const TxTitleCell = ({ title, description, mileageFlag, onOpenAnomaly }) => (
  <div>
    <p className="text-sm font-medium text-gray-900">{title}</p>
    {description && (
      <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">{description}</p>
    )}
    {mileageFlag && (
      <MileageFlagChip
        flag={mileageFlag}
        onClick={() => onOpenAnomaly && onOpenAnomaly(mileageFlag)}
      />
    )}
  </div>
);

export const EntityRefCell = ({ entity, kind }) =>
  entity ? (
    <span className="flex items-center gap-1 text-sm">
      {kind === 'vehicle' ? (
        <Truck size={14} className="text-gray-400" />
      ) : (
        <User size={14} className="text-gray-400" />
      )}
      {kind === 'vehicle' ? getVehicleLabel(entity) : getDriverName(entity)}
    </span>
  ) : (
    <span className="text-sm text-gray-400">-</span>
  );

export const TripRefCell = ({ trip, onOpenTrip }) => {
  if (!trip || !trip._id) {
    return <span className="text-sm text-gray-400">Unassigned</span>;
  }
  const label = trip.tripNumber || `TRIP-${trip._id.slice(-6).toUpperCase()}`;
  return (
    <button
      type="button"
      onClick={() => onOpenTrip && onOpenTrip(trip._id)}
      className="inline-flex items-center gap-1 font-semibold text-xs text-indigo-700 hover:text-indigo-900 hover:underline"
      title="View ERP Trip financial details"
    >
      <Route size={12} className="text-indigo-500" />
      <span>{label}</span>
    </button>
  );
};

export const ReceiptCell = ({ receiptUrl, onPreviewReceipt }) => {
  if (!receiptUrl) return <span className="text-gray-400 text-xs">-</span>;
  return (
    <button
      type="button"
      onClick={() => onPreviewReceipt && onPreviewReceipt(receiptUrl)}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors"
      title="Preview attached receipt"
    >
      <Eye size={12} />
      Receipt
    </button>
  );
};
