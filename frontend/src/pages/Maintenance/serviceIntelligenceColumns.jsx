import StatusChip from '../../components/ui/StatusChip';
import {
  formatServiceCurrency,
  formatServiceDate,
  formatServiceKm,
} from './serviceIntelligenceFormat';
import {
  VehicleCell,
  PriorityCell,
  StatusCell,
  NotesCell,
  FilesCell,
  ActionsCell,
} from './serviceIntelligenceCells';

/** Column defs for the records table — service entries vs repair entries. */
export function buildServiceIntelligenceColumns({
  isService,
  onOpenVehicle,
  onResolveRow,
  onDeleteRow,
}) {
  const columns = [
    {
      key: 'vehicle',
      label: 'Vehicle',
      width: 140,
      render: (row) => <VehicleCell row={row} onOpenVehicle={onOpenVehicle} />,
    },
    {
      key: 'date',
      label: isService ? 'Service Date' : 'Incident Date',
      width: 105,
      render: (row) => formatServiceDate(row.date),
    },
  ];

  if (isService) {
    columns.push({
      key: 'currentKm',
      label: 'Current KM',
      width: 95,
      render: (row) => formatServiceKm(row.currentKm),
    });
  }

  // Priority Column — highlights Critical (Broken Axle / Engine) vs Medium (Tyre Puncture)
  columns.push({
    key: 'priority',
    label: 'Criticality',
    width: 115,
    render: (row) => <PriorityCell row={row} />,
  });

  columns.push(
    {
      key: 'workshop',
      label: 'Workshop / Location',
      width: 135,
      render: (row) => (
        <span className="si-cell-truncate" title={row.workshop || '—'}>
          {row.workshop || '—'}
        </span>
      ),
    },
    {
      key: 'type',
      label: isService ? 'Category' : 'Issue Type',
      width: 125,
      render: (row) => <StatusChip group="serviceType" value={row.type} />,
    },
    {
      key: 'amount',
      label: 'Amount',
      width: 95,
      render: (row) => formatServiceCurrency(row.amount),
    },
    {
      key: 'notes',
      label: isService ? 'Service Notes' : 'Diagnostic Notes',
      render: (row) => <NotesCell text={row.notes} />,
    },
  );

  // Status Column for Repairs (Open vs Resolved)
  if (!isService) {
    columns.push({
      key: 'status',
      label: 'Status',
      width: 95,
      render: (row) => <StatusCell row={row} />,
    });
  }

  columns.push(
    {
      key: 'files',
      label: 'Files',
      width: 55,
      align: 'center',
      render: (row) => <FilesCell attachments={row.attachments} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 85,
      align: 'right',
      render: (row) => (
        <ActionsCell
          row={row}
          onResolve={() => onResolveRow?.(row)}
          onDelete={() => onDeleteRow?.(row)}
        />
      ),
    },
  );

  return columns;
}
