import { useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatLogTimestamp } from './refuelLogsReportUtils';

export function useRefuelLogsReportColumns({ onEdit, onDelete }) {
  return useMemo(
    () => [
      {
        key: 'dateTime',
        label: 'Date & Time',
        render: (log) => {
          const formattedDate = formatLogTimestamp(log.date, log.time);
          return (
            <div>
              <div className="cell-primary">{formattedDate}</div>
              <div className="cell-secondary">{log.time || '-'}</div>
            </div>
          );
        },
      },
      {
        key: 'vehicle',
        label: 'Vehicle',
        render: (log) => (
          <div>
            <div className="cell-primary font-medium">{log.vehicleNo || '-'}</div>
            <div className="cell-secondary">{log.vehicleModel || '--'}</div>
          </div>
        ),
      },
      {
        key: 'driver',
        label: 'Driver',
        render: (log) => (
          <div>
            <div className="cell-primary">{log.driverName || '-'}</div>
            <div className="cell-secondary">{log.driverPhone || '--'}</div>
          </div>
        ),
      },
      {
        key: 'location',
        label: 'Location',
        render: (log) => <div className="cell-primary">{log.location || '-'}</div>,
      },
      {
        key: 'fuelType',
        label: 'Fuel Type',
        render: (log) => (
          <span
            className={`fuel-type-pill ${log.fuelType ? log.fuelType.toLowerCase() : 'unknown'}`}
          >
            {log.fuelType || 'Unknown'}
          </span>
        ),
      },
      {
        key: 'quantity',
        label: 'Quantity (L)',
        align: 'right',
        render: (log) => (
          <div>
            <div className="cell-primary">{log.quantity || '-'}</div>
            <div className="cell-secondary">Litres</div>
          </div>
        ),
      },
      {
        key: 'unitPrice',
        label: 'Unit Price',
        align: 'right',
        render: (log) => formatCurrency(log.unitPrice),
      },
      {
        key: 'totalAmount',
        label: 'Total Amount',
        align: 'right',
        render: (log) => <div className="font-medium">{formatCurrency(log.totalAmount)}</div>,
      },
      {
        key: 'odometer',
        label: 'Odometer',
        align: 'right',
        render: (log) => (
          <div>
            <div className="cell-primary">
              {log.odometer && log.odometer !== '-' ? `${log.odometer} km` : '-'}
            </div>
            <div className="cell-secondary">Reading</div>
          </div>
        ),
      },
      {
        key: 'type',
        label: 'Type',
        render: (log) => <div className="cell-primary">{log.notes || '-'}</div>,
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        render: (log) => (
          <div className="refuel-actions flex justify-end gap-1.5">
            <button
              type="button"
              className="refuel-action-btn edit"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(log);
              }}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className="refuel-action-btn delete"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(log);
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    [onEdit, onDelete],
  );
}
