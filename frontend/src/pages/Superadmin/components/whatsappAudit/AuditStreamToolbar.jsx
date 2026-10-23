import { Search } from 'lucide-react';
import STAGE_LABELS from './stageLabels';

const AuditStreamToolbar = ({
  pagination,
  searchDebounceRef,
  searchQuery,
  setPagination,
  setSearchQuery,
  setStageFilter,
  setStatusFilter,
  stageFilter,
  statusFilter,
}) => (
  <header className="wa-stream-toolbar">
    {/* Status Tabs */}
    <div className="wa-status-pills">
      <button
        className={`wa-status-pill ${statusFilter === 'ALL' ? 'wa-status-pill--active' : ''}`}
        onClick={() => {
          setStatusFilter('ALL');
          setPagination((p) => ({ ...p, page: 1 }));
        }}
      >
        All Requests ({pagination.total})
      </button>
      <button
        className={`wa-status-pill ${statusFilter === 'FAILED' ? 'wa-status-pill--active' : ''}`}
        onClick={() => {
          setStatusFilter('FAILED');
          setPagination((p) => ({ ...p, page: 1 }));
        }}
      >
        Failed Only
      </button>
      <button
        className={`wa-status-pill ${statusFilter === 'SUCCEEDED' ? 'wa-status-pill--active' : ''}`}
        onClick={() => {
          setStatusFilter('SUCCEEDED');
          setPagination((p) => ({ ...p, page: 1 }));
        }}
      >
        Succeeded
      </button>
      <button
        className={`wa-status-pill ${statusFilter === 'IN_FLIGHT' ? 'wa-status-pill--active' : ''}`}
        onClick={() => {
          setStatusFilter('IN_FLIGHT');
          setPagination((p) => ({ ...p, page: 1 }));
        }}
      >
        In-Flight / Queued
      </button>
    </div>

    {/* Search Box */}
    <div className="wa-search-box">
      <Search size={16} />
      <input
        type="text"
        placeholder="Search phone, text, WAMID, error…"
        aria-label="Search phone, text, WAMID, error"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
          searchDebounceRef.current = setTimeout(() => {
            setPagination((p) => ({ ...p, page: 1 }));
          }, 300);
        }}
      />
    </div>

    {/* Stage Filter Dropdown */}
    <select
      className="wa-audit-select"
      value={stageFilter}
      onChange={(e) => {
        setStageFilter(e.target.value);
        setPagination((p) => ({ ...p, page: 1 }));
      }}
    >
      <option value="ALL">All Failure Stages</option>
      {Object.entries(STAGE_LABELS).map(([k, v]) => (
        <option key={k} value={k}>
          {v.label}
        </option>
      ))}
    </select>
  </header>
);

export default AuditStreamToolbar;
