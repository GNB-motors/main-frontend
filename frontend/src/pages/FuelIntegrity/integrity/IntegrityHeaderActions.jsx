import { RefreshCw } from 'lucide-react';
import ExportButton from '../../../components/ui/ExportButton';
import { timeAgo } from '../../../utils/formatters';

/** Last-sync time, export, Reconcile IoT and Refresh in the page header. */
const IntegrityHeaderActions = ({
  exportColumns,
  exportRows,
  fetchData,
  filteredEvents,
  handleSyncIoT,
  isLoading,
  isSyncing,
  lastSynced,
}) => (
  <div className="flex items-center gap-2">
    {lastSynced && (
      <span className="text-dim hidden text-xs sm:inline">Synced {timeAgo(lastSynced)}</span>
    )}
    <ExportButton
      rows={exportRows}
      columns={exportColumns}
      filename="fuel-integrity-report"
      disabled={filteredEvents.length === 0}
    />
    <button
      type="button"
      className="pshell-btn text-indigo-600 dark:text-indigo-400 font-medium"
      onClick={handleSyncIoT}
      disabled={isSyncing || isLoading}
      title="Trigger on-demand reconciliation of recent FleetEdge telemetry"
    >
      <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
      <span>{isSyncing ? 'Reconciling...' : 'Reconcile IoT'}</span>
    </button>
    <button
      type="button"
      className="pshell-btn"
      onClick={() => fetchData()}
      disabled={isLoading || isSyncing}
      title="Refresh telemetry stream"
    >
      <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
      <span>Refresh</span>
    </button>
  </div>
);

export default IntegrityHeaderActions;
