import { MessageSquareWarning, RefreshCw } from 'lucide-react';

const AuditHeader = ({
  autoRefreshInterval,
  fetchData,
  loading,
  orgFilter,
  organizations,
  refreshing,
  setAutoRefreshInterval,
  setOrgFilter,
  setPagination,
  setTimeRange,
  timeRange,
}) => (
  <header className="wa-audit-header">
    <div className="wa-audit-header__title-group">
      <h1>
        <MessageSquareWarning size={28} color="#4f46e5" />
        WhatsApp Chat Reliability Audit
      </h1>
      <p>
        Real-time error tracking, failure root cause analysis, and request delivery observability
        for every chatbot user.
      </p>
    </div>

    <nav aria-label="Audit filters and actions" className="wa-audit-header__controls">
      {/* Organization filter */}
      <select
        aria-label="Filter by organization"
        className="wa-audit-select"
        value={orgFilter}
        onChange={(e) => {
          setOrgFilter(e.target.value);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
      >
        <option value="">All Organizations</option>
        {organizations.map((o) => (
          <option key={o._id} value={o._id}>
            {o.companyName}
          </option>
        ))}
      </select>

      {/* Time range */}
      <select
        aria-label="Filter by time range"
        className="wa-audit-select"
        value={timeRange}
        onChange={(e) => {
          setTimeRange(e.target.value);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
      >
        <option value="24h">Last 24 Hours</option>
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="all">All Time</option>
      </select>

      {/* Auto refresh interval */}
      <select
        aria-label="Auto-refresh interval"
        className="wa-audit-select"
        value={autoRefreshInterval}
        onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
      >
        <option value={0}>Auto-refresh: Off</option>
        <option value={15}>Auto-refresh: 15s</option>
        <option value={30}>Auto-refresh: 30s</option>
        <option value={60}>Auto-refresh: 60s</option>
      </select>

      {/* Refresh button */}
      <button
        className="wa-audit-btn"
        onClick={() => fetchData(false)}
        disabled={loading || refreshing}
        title="Refresh statistics and requests"
      >
        <RefreshCw size={15} className={refreshing ? 'wa-spin' : ''} />
        <span>Refresh</span>
      </button>
    </nav>
  </header>
);

export default AuditHeader;
