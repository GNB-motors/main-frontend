import { RefreshCw } from 'lucide-react';
import ExportButton from '../../components/ui/ExportButton';

/** Sync Live and Export buttons in the Fuel Comparison page header. */
const ComparisonHeaderActions = ({
  handleSyncPipeline,
  isSyncing,
  exportRows,
  exportColumns,
  activeTab,
  records,
}) => (
  <div className="fc-header-actions">
    <button
      type="button"
      className="pshell-btn"
      onClick={handleSyncPipeline}
      disabled={isSyncing}
      title="Refresh comparisons and run on-demand backend audit"
      aria-label="Sync comparisons"
    >
      <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
      <span>{isSyncing ? 'Auditing…' : 'Sync Live'}</span>
    </button>

    <ExportButton
      rows={exportRows}
      columns={exportColumns}
      filename={`fuel-comparison-audit-${activeTab !== 'all' ? activeTab : 'all'}`}
      disabled={records.length === 0}
      buttonClass="pshell-btn pshell-btn--primary"
    />
  </div>
);

export default ComparisonHeaderActions;
