import { AlertTriangle, User, Truck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  SOURCE_LABELS,
  SOURCE_COLORS,
  getVehicleLabel,
  getDriverName,
} from '../utils';

/**
 * Cell components for the ledger detail transactions table. Kept separate
 * from ledgerDetailColumns.jsx because that module exports a plain function;
 * react-refresh requires a file to export components OR non-components,
 * never both (rule 15).
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

export const MileageFlagChip = ({ flag }) => (
  <span
    title={flag.reason}
    className="mt-1 inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700"
  >
    <AlertTriangle size={11} />
    {flag.actualKmPerL?.toFixed(2)} vs {flag.expectedKmPerL} km/L
  </span>
);

export const TxTitleCell = ({ title, description, mileageFlag }) => (
  <div>
    <p className="text-sm font-medium">{title}</p>
    {description && (
      <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">{description}</p>
    )}
    {mileageFlag && <MileageFlagChip flag={mileageFlag} />}
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
