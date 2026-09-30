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
      render: (row) => <VehicleCell row={row} onOpenVehicle={onOpenVehicle} />,
    },
    {
      key: 'date',
      label: isService ? 'Service Date' : 'Incident Date',
      render: (row) => formatServiceDate(row.date),
    },
  ];

  if (isService) {
    columns.push({
      key: 'currentKm',
      label: 'Current KM',
      render: (row) => formatServiceKm(row.currentKm),
    });
  }

  // Priority Column — highlights Critical (Broken Axle / Engine) vs Medium (Tyre Puncture)
  columns.push({
    key: 'priority',
    label: 'Criticality',
    render: (row) => <PriorityCell row={row} />,
  });

  columns.push(
    { key: 'workshop', label: 'Workshop / Location', render: (row) => row.workshop },
    {
      key: 'type',
      label: isService ? 'Service Category' : 'Reported Issue',
      render: (row) => <StatusChip group="serviceType" value={row.type} />,
    },
    { key: 'amount', label: 'Amount', render: (row) => formatServiceCurrency(row.amount) },
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
      render: (row) => <StatusCell row={row} />,
    });
  }

  columns.push(
    { key: 'files', label: 'Files', render: (row) => <FilesCell attachments={row.attachments} /> },
    {
      key: 'actions',
      label: 'Actions',
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
