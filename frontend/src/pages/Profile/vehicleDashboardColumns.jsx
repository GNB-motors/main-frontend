import NewButton from '@/components/ui/NewButton';
import { DOC_COLS } from './vehicleDashboardLogic';
import { DocBadge } from './vehicleDashboardCells';

/** Column defs for the fleet document-expiry table — one column per DOC_COLS entry. */
export function buildVehicleDashboardColumns({ onManage }) {
  const columns = [
    {
      key: 'vehicle',
      label: 'Vehicle #',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{row.registrationNumber}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{row.manufacturer || '—'}</div>
        </div>
      ),
    },
    { key: 'owner', label: 'Owner', render: (row) => row.ownerName || '—' },
    { key: 'model', label: 'Model', render: (row) => row.model || '—' },
    {
      key: 'chassis',
      label: 'Chassis #',
      render: (row) => (
        <span
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12 }}
        >
          {row.chassisNumber}
        </span>
      ),
    },
  ];

  DOC_COLS.forEach(({ key, label }) => {
    columns.push({ key, label, render: (row) => <DocBadge docEntry={row.documents?.[key]} /> });
  });

  columns.push({
    key: 'actions',
    label: 'Actions',
    align: 'right',
    render: (row) => (
      <NewButton variant="secondary" size="xs" text="Manage" onClick={() => onManage(row)} />
    ),
  });

  return columns;
}
