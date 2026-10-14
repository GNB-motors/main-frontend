import { Search, Gauge, ChevronDown, ShieldCheck, Calendar, X } from 'lucide-react';
import Skel from './Skel';

const STATUS_TABS = [
  { key: 'READY', label: 'Pending' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CLEARED', label: 'Cleared' },
  { key: 'ALL', label: 'All' },
];

const ReceiptToolbar = ({
  status,
  setStatus,
  counts,
  loading,
  dateFilter,
  setDateFilter,
  odoFilter,
  setOdoFilter,
  anomalyFilter,
  setAnomalyFilter,
  activeFiltersCount,
  resetAllFilters,
  query,
  setQuery,
}) => (
  <div className="ra-toolbar">
    {/* Status Tabs */}
    <div className="ra-tabs">
      {STATUS_TABS.map((t) => (
        <button
          key={t.key}
          className={`ra-tab ${status === t.key ? 'is-active' : ''}`}
          onClick={() => setStatus(t.key)}
        >
          {t.label}
          {t.key !== 'ALL' &&
            (counts[t.key] != null ? (
              <span className="ra-tab__count">{counts[t.key]}</span>
            ) : loading ? (
              <Skel w={20} h={16} round />
            ) : null)}
        </button>
      ))}
    </div>

    {/* Filter Dropdowns Strip */}
    <div className="ra-filter-strip">
      {/* Date Preset Filter */}
      <div className="ra-select-wrap">
        <Calendar size={14} className="ra-select-icon" />
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          aria-label="Filter receipts by date range"
        >
          <option value="ALL">All Dates</option>
          <option value="TODAY">Today</option>
          <option value="YESTERDAY">Yesterday</option>
          <option value="7DAYS">Last 7 Days</option>
          <option value="30DAYS">Last 30 Days</option>
        </select>
        <ChevronDown size={14} className="ra-select-chevron" />
      </div>

      {/* Odometer Source Filter */}
      <div className="ra-select-wrap">
        <Gauge size={14} className="ra-select-icon" />
        <select
          value={odoFilter}
          onChange={(e) => setOdoFilter(e.target.value)}
          aria-label="Filter receipts by odometer source"
        >
          <option value="ALL">All Odometer</option>
          <option value="TELEMATICS">📡 FleetEdge Auto</option>
          <option value="PHOTO">📸 Dash Photo OCR</option>
          <option value="MISSING">⚠️ Missing Odometer</option>
        </select>
        <ChevronDown size={14} className="ra-select-chevron" />
      </div>

      {/* Anomaly / Quality Filter */}
      <div className="ra-select-wrap">
        <ShieldCheck size={14} className="ra-select-icon" />
        <select
          value={anomalyFilter}
          onChange={(e) => setAnomalyFilter(e.target.value)}
          aria-label="Filter receipts by AI extraction health"
        >
          <option value="ALL">All AI Health</option>
          <option value="MATH_VERIFIED">✓ Math Verified</option>
          <option value="NEEDS_REVIEW">⚠️ Needs Review</option>
        </select>
        <ChevronDown size={14} className="ra-select-chevron" />
      </div>

      {/* Reset Filters if active */}
      {activeFiltersCount > 0 && (
        <button
          type="button"
          className="ra-clear-filters-btn"
          onClick={resetAllFilters}
          title="Reset all search and filters"
        >
          <X size={13} />
          Reset ({activeFiltersCount})
        </button>
      )}

      {/* Search Box */}
      <div className="ra-search">
        <span className="ra-search__icon">
          <Search size={15} />
        </span>
        <input
          type="text"
          placeholder="Search vehicle, driver, station, plate…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search receipts by vehicle, driver, station, or plate"
        />
        {query && (
          <button
            type="button"
            className="ra-search__clear"
            onClick={() => setQuery('')}
            title="Clear query"
            aria-label="Clear search input"
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  </div>
);

export default ReceiptToolbar;
