import { formatDateIST } from '../../utils/dateUtils';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { formatAdBlueCurrency } from './adBlueTrackingLogic';

/**
 * Cell components for the AdBlue tracking table. Kept separate from
 * adBlueTrackingColumns.jsx because that module exports a plain function;
 * react-refresh requires a file to export components OR non-components,
 * never both (rule 15).
 */

export const AdBlueDateCell = ({ log }) => {
  const timestamp = log.date ? `${log.date}${log.time ? `T${log.time}` : ''}` : null;
  const formattedDate = timestamp ? formatDateIST(timestamp) : formatDateIST(log.date);
  return (
    <>
      <div className="cell-primary">{formattedDate || '-'}</div>
      <div className="cell-secondary">{log.time || '-'}</div>
    </>
  );
};

export const AdBlueAmountCell = ({ amount }) => formatAdBlueCurrency(amount);

export const AdBlueActionsCell = (props) => {
  const { log, viewImageLoading, onView, onEdit, onDelete } = props;
  return (
    <div className="refuel-actions">
      {log.documentId && (
        <button
          type="button"
          className="refuel-action-btn"
          title="View Proof"
          style={{ color: '#2563eb' }}
          onClick={() => onView(log)}
          disabled={viewImageLoading}
        >
          <Eye size={14} />
        </button>
      )}
      <button
        type="button"
        className="refuel-action-btn edit"
        title="Edit"
        onClick={() => onEdit(log)}
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        className="refuel-action-btn delete"
        title="Delete"
        onClick={() => onDelete(log)}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
