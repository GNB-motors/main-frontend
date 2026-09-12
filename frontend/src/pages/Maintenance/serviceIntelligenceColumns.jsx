import StatusChip from '../../components/ui/StatusChip';
import {
  formatServiceCurrency,
  formatServiceDate,
  formatServiceKm,
} from './serviceIntelligenceFormat';
import { VehicleCell, NotesCell, FilesCell, ActionsCell } from './serviceIntelligenceCells';

/** Column defs for the records table — service entries vs repair entries. */
export function buildServiceIntelligenceColumns({ isService, onOpenVehicle, onDeleteRow }) {
  const columns = [
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (row) => <VehicleCell row={row} onOpenVehicle={onOpenVehicle} />,
    },
    {
      key: 'date',
      label: isService ? 'Service Date' : 'Repair Date',
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

  columns.push(
    { key: 'workshop', label: 'Workshop', render: (row) => row.workshop },
    {
      key: 'type',
      label: isService ? 'Service Type' : 'Repair Type',
      render: (row) => <StatusChip group="serviceType" value={row.type} />,
    },
    { key: 'amount', label: 'Amount', render: (row) => formatServiceCurrency(row.amount) },
    {
      key: 'notes',
      label: isService ? 'Notes' : 'Issue',
      render: (row) => <NotesCell text={row.notes} />,
    },
    { key: 'files', label: 'Files', render: (row) => <FilesCell attachments={row.attachments} /> },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => <ActionsCell onDelete={() => onDeleteRow(row)} />,
    },
  );

  return columns;
}
