import EmptyState from '../../components/cluster/EmptyState';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { activeFilterCount } from '../../lib/tableState';
import TableShell from './TableShell.jsx';
import { formatDateIST } from '../../utils/dateUtils';

const IALERT_COLUMNS = [
  { key: 'registrationNumber', label: 'Reg. No.' },
  { key: 'vin', label: 'VIN' },
  { key: 'isBs6', label: 'BS-VI', render: (row) => (row.isBs6 === true ? '✓' : '—') }, // render gets the ROW
  { key: 'vehicleType', label: 'Type' },
  { key: 'ialertAccountId', label: 'Account ID' },
  {
    key: 'firstSeenAt',
    label: 'First Seen',
    render: (row) => (row.firstSeenAt ? formatDateIST(row.firstSeenAt) : '—'),
  },
  {
    key: 'lastSeenAt',
    label: 'Last Seen',
    render: (row) => (row.lastSeenAt ? formatDateIST(row.lastSeenAt) : '—'),
  },
];

const IALERT_EXPORT_COLUMNS = [
  { key: 'registrationNumber', label: 'Registration Number' },
  { key: 'vin', label: 'VIN' },
  { key: 'isBs6', label: 'BS-VI' },
  { key: 'vehicleType', label: 'Vehicle Type' },
  { key: 'ialertAccountId', label: 'iALERT Account ID' },
  { key: 'firstSeenAt', label: 'First Seen At' },
  { key: 'lastSeenAt', label: 'Last Seen At' },
];

function ialertRowKey(row, index) {
  return row.registrationNumber || `ialert-${index}`;
}

function filterIalert(rows, q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((v) =>
    [v.registrationNumber, v.vin, v.vehicleType, v.ialertAccountId].some(
      (value) => value != null && String(value).toLowerCase().includes(needle),
    ),
  );
}

export default function IalertOnlyPanel({ q, searching, onlyIalert, staleIalert }) {
  const onlyIalertFiltered = filterIalert(onlyIalert, q);
  const staleFiltered = filterIalert(staleIalert, q);
  const totalIalert = onlyIalert.length + staleIalert.length;
  const hasOnly = onlyIalertFiltered.length > 0;
  const hasStale = staleFiltered.length > 0;

  if (totalIalert === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {hasOnly && (
        <TableShell
          title="Only in iALERT"
          caption="These vehicles stream data to your iALERT account, but they are not yet linked to your fleet."
          actions={
            <ExportButton
              rows={onlyIalertFiltered}
              columns={IALERT_EXPORT_COLUMNS}
              filename="fleet-coverage-ialert-only"
              meta={{
                filters: [
                  { label: 'Search', value: q.trim() || '—' },
                  { label: 'List', value: 'Only in iALERT' },
                ],
                generatedAt: new Date(),
              }}
            />
          }
        >
          <DataTable
            columns={IALERT_COLUMNS}
            rows={onlyIalertFiltered}
            rowKey={ialertRowKey}
            showing={onlyIalertFiltered.length}
            total={onlyIalert.length}
            activeFilters={activeFilterCount({ q })}
            emptyTitle="No vehicles match your search"
            selectable={false}
          />
        </TableShell>
      )}

      {hasStale && (
        <TableShell
          title="Stale iALERT Vehicles"
          caption="These iALERT vehicles have not reported data for 7+ days. They may have been unlinked from iALERT."
          actions={
            <ExportButton
              rows={staleFiltered}
              columns={IALERT_EXPORT_COLUMNS}
              filename="fleet-coverage-ialert-stale"
              meta={{
                filters: [
                  { label: 'Search', value: q.trim() || '—' },
                  { label: 'List', value: 'Stale iALERT Vehicles' },
                ],
                generatedAt: new Date(),
              }}
            />
          }
        >
          <DataTable
            columns={IALERT_COLUMNS}
            rows={staleFiltered}
            rowKey={(row, idx) => `stale-${ialertRowKey(row, idx)}`}
            showing={staleFiltered.length}
            total={staleIalert.length}
            activeFilters={activeFilterCount({ q })}
            emptyTitle="No stale vehicles match your search"
            selectable={false}
          />
        </TableShell>
      )}

      {!hasOnly && !hasStale && searching && (
        <div className="px-4 pb-4">
          <EmptyState
            title="No vehicles match your search"
            hint="Try a different registration number, VIN or vehicle type."
          />
        </div>
      )}
    </div>
  );
}
