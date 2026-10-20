import { Search, X } from 'lucide-react';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'flagged', label: 'Flagged' },
  { key: 'review', label: 'Needs Review' },
  { key: 'clean', label: 'Verified Clean' },
];

const DATE_PRESETS = [
  { key: 'ALL', label: 'All Dates' },
  { key: 'TODAY', label: 'Today' },
  { key: 'YESTERDAY', label: 'Yesterday' },
  { key: '7DAYS', label: 'Last 7 Days' },
  { key: '30DAYS', label: 'Last 30 Days' },
  { key: 'CUSTOM', label: 'Custom Range' },
];

const VARIANCE_OPTIONS = [
  { key: 'ALL', label: 'All Variances' },
  { key: 'OVERBILLED', label: 'Flagged Overbilling' },
  { key: 'CLEAN', label: 'Within Tolerance' },
  { key: 'NO_DATA', label: 'No Telematics' },
];

/** Status tabs plus the date, variance and search filters above the comparison table. */
const ComparisonToolbar = ({
  activeTab,
  setActiveTab,
  setPage,
  tabCounts,
  hubRange,
  datePreset,
  handlePresetChange,
  inputFromDate,
  setInputFromDate,
  inputToDate,
  setInputToDate,
  varianceFilter,
  setVarianceFilter,
  searchQuery,
  setSearchQuery,
  activeFilterCount,
  handleResetFilters,
}) => (
  <div className="fc-toolbar">
    {/* Status Tabs */}
    <div className="fc-tabs" role="tablist">
      {STATUS_TABS.map((t) => (
        <button
          key={t.key}
          role="tab"
          aria-selected={activeTab === t.key}
          className={`fc-tab ${activeTab === t.key ? 'is-active' : ''}`}
          onClick={() => {
            setActiveTab(t.key);
            setPage(1);
          }}
        >
          <span>{t.label}</span>
          {tabCounts[t.key] != null && (
            <span
              className={`fc-tab__count ${
                (t.key === 'flagged' || t.key === 'review') && tabCounts[t.key] > 0
                  ? 'fc-tab__count--alert'
                  : ''
              }`}
            >
              {tabCounts[t.key]}
            </span>
          )}
        </button>
      ))}
    </div>

    {/* Inline Filter Controls */}
    <div className="fc-filters-row">
      {/* Date Preset (the /mileage hub supplies its own dates) */}
      {!hubRange && (
        <div className="fc-select-wrap">
          <select
            value={datePreset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="fc-select fc-select--compact"
            aria-label="Filter by date range"
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Custom Dates */}
      {!hubRange && datePreset === 'CUSTOM' && (
        <div className="fc-custom-dates">
          <input
            type="date"
            className="fc-date-input"
            value={inputFromDate}
            onChange={(e) => setInputFromDate(e.target.value)}
            aria-label="From date"
          />
          <span className="fc-date-sep">→</span>
          <input
            type="date"
            className="fc-date-input"
            value={inputToDate}
            onChange={(e) => setInputToDate(e.target.value)}
            aria-label="To date"
          />
        </div>
      )}

      {/* Variance Severity */}
      <div className="fc-select-wrap">
        <select
          value={varianceFilter}
          onChange={(e) => {
            setVarianceFilter(e.target.value);
            setPage(1);
          }}
          className="fc-select fc-select--compact"
          aria-label="Filter by variance severity"
        >
          {VARIANCE_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search Box */}
      <div className="fc-search-box">
        <Search size={13} className="fc-search-icon" />
        <input
          type="text"
          className="fc-search-input"
          aria-label="Search plate or driver"
          placeholder="Search plate or driver…"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
        />
        {searchQuery && (
          <button
            type="button"
            className="fc-search-clear"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Reset Filters */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          className="fc-btn-reset"
          onClick={handleResetFilters}
          title="Reset all filters"
        >
          Reset
        </button>
      )}
    </div>
  </div>
);

export default ComparisonToolbar;
