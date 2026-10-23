import BulkUploadVehiclesResultSummary from '../Profile/bulkUploadVehiclesResultSummary.jsx';
import EmptyState from '../../components/cluster/EmptyState';
import DataTable from '../../components/ui/DataTable';
import ExportButton from '../../components/ui/ExportButton';
import NewButton from '../../components/ui/NewButton';
import { activeFilterCount } from '../../lib/tableState';
import { isAddableRegistration, edgeRowKey } from './fleetCoverageActions.js';
import TableShell from './TableShell.jsx';

export default function EdgeOnlyPanel({
  q,
  searching,
  canAddVehicles,
  selectedKeys,
  setSelectedKeys,
  bulkAdding,
  handleAddSelected,
  bulkResult,
  setBulkResult,
  onlyEdge,
  onlyEdgeFiltered,
  edgeColumns,
  EDGE_EXPORT_COLUMNS,
}) {
  return (
    <TableShell
      title="On FleetEdge, not in your fleet"
      caption="These vehicles stream data to your FleetEdge account, but they are invisible to mileage, trips and alerts until you add them to your fleet."
      actions={
        <div className="flex items-center gap-2">
          {canAddVehicles && selectedKeys.size > 0 ? (
            <NewButton
              variant="primary"
              size="sm"
              text={`Add ${selectedKeys.size} to fleet`}
              loading={bulkAdding}
              onClick={handleAddSelected}
            />
          ) : null}
          <ExportButton
            rows={onlyEdgeFiltered}
            columns={EDGE_EXPORT_COLUMNS}
            filename="fleet-coverage-fleetedge-only"
            meta={{
              filters: [
                { label: 'Search', value: q.trim() || '—' },
                { label: 'List', value: 'On FleetEdge, not in your fleet' },
              ],
              generatedAt: new Date(),
            }}
          />
        </div>
      }
    >
      {onlyEdgeFiltered.length === 0 ? (
        <div className="px-4 pb-4">
          <EmptyState
            title={searching ? 'No vehicles match your search' : 'No gap here'}
            hint={
              searching
                ? 'Try a different registration number, model or manufacturer.'
                : 'Every vehicle on your FleetEdge account is already in your fleet master.'
            }
          />
        </div>
      ) : (
        <DataTable
          columns={edgeColumns}
          rows={onlyEdgeFiltered}
          rowKey={edgeRowKey}
          showing={onlyEdgeFiltered.length}
          total={onlyEdge.length}
          activeFilters={activeFilterCount({ q })}
          emptyTitle="No vehicles match your search"
          selectable={canAddVehicles}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          isRowSelectable={(v) => isAddableRegistration(v.registrationNumber)}
        />
      )}
      {bulkResult ? (
        <div className="px-4 pb-4">
          <BulkUploadVehiclesResultSummary result={bulkResult} />
          <button
            type="button"
            className="text-dim mt-2 text-xs underline"
            onClick={() => setBulkResult(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </TableShell>
  );
}
