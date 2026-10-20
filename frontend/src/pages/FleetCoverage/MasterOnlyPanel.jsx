import EmptyState from '../../components/cluster/EmptyState';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import { activeFilterCount } from '../../lib/tableState';
import masterColumns from './masterColumns.jsx';
import TableShell from './TableShell.jsx';

export default function MasterOnlyPanel({
  q,
  searching,
  onlyMaster,
  onlyMasterFiltered,
  onlyMasterRows,
}) {
  return (
    <TableShell
      title="In fleet master, not on FleetEdge"
      caption="These vehicles exist in your fleet master but your FleetEdge account doesn't report them. Check the registration number or the device mapping."
      actions={
        <ExportButton
          rows={onlyMasterRows}
          columns={masterColumns}
          filename="fleet-coverage-master-only"
          meta={{
            filters: [
              { label: 'Search', value: q.trim() || '—' },
              { label: 'List', value: 'In fleet master, not on FleetEdge' },
            ],
            generatedAt: new Date(),
          }}
        />
      }
    >
      {onlyMasterFiltered.length === 0 ? (
        <div className="px-4 pb-4">
          <EmptyState
            title={searching ? 'No vehicles match your search' : 'No gap here'}
            hint={
              searching
                ? 'Try a different registration number, model or manufacturer.'
                : 'Every vehicle in your fleet master is reporting through FleetEdge.'
            }
          />
        </div>
      ) : (
        <DataTable
          columns={masterColumns}
          rows={onlyMasterRows}
          rowKey={(v) => v.registrationNumber}
          showing={onlyMasterRows.length}
          total={onlyMaster.length}
          activeFilters={activeFilterCount({ q })}
          emptyTitle="No vehicles match your search"
        />
      )}
    </TableShell>
  );
}
