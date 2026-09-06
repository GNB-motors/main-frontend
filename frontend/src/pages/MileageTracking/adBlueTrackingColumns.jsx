import { AdBlueDateCell, AdBlueAmountCell, AdBlueActionsCell } from './adBlueTrackingCells';

/** Column defs for the AdBlue tracking table. */
export function buildAdBlueTrackingColumns({ viewImageLoading, onView, onEdit, onDelete }) {
  return [
    { key: 'date', label: 'Date & Time', render: (log) => <AdBlueDateCell log={log} /> },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (log) => (
        <>
          <div className="cell-primary">{log.vehicleNo}</div>
          <div className="cell-secondary">{log.vehicleModel}</div>
        </>
      ),
    },
    {
      key: 'driver',
      label: 'Driver',
      render: (log) => <div className="cell-primary">{log.driverName}</div>,
    },
    {
      key: 'place',
      label: 'Place',
      render: (log) => <div className="cell-primary">{log.place}</div>,
    },
    {
      key: 'litres',
      label: 'Litres',
      render: (log) => (
        <>
          <div className="cell-primary">{log.litres ?? '-'}</div>
          <div className="cell-secondary">Litres</div>
        </>
      ),
    },
    { key: 'amount', label: 'Amount', render: (log) => <AdBlueAmountCell amount={log.amount} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (log) => (
        <AdBlueActionsCell
          log={log}
          viewImageLoading={viewImageLoading}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
    },
  ];
}
