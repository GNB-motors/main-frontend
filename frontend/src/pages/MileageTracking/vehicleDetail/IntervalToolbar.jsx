import { Search, X } from 'lucide-react';

/** Status tabs, route/status search and reset for the vehicle interval list. */
const IntervalToolbar = ({
  statusTab,
  setStatusTab,
  intervals,
  stats,
  searchQuery,
  setSearchQuery,
  hasActiveFilters,
  handleResetFilters,
}) => (
  <div className="mt-toolbar">
    <div className="mt-tabs">
      <button
        type="button"
        className={`mt-tab ${statusTab === 'all' ? 'is-active' : ''}`}
        onClick={() => setStatusTab('all')}
      >
        <span>All Intervals</span>
        <span className="mt-tab-count">{intervals.length}</span>
      </button>
      <button
        type="button"
        className={`mt-tab ${statusTab === 'flagged' ? 'is-active' : ''}`}
        onClick={() => setStatusTab('flagged')}
      >
        <span>Flagged</span>
        <span className="mt-tab-count">{stats.flaggedCount}</span>
      </button>
      <button
        type="button"
        className={`mt-tab ${statusTab === 'clean' ? 'is-active' : ''}`}
        onClick={() => setStatusTab('clean')}
      >
        <span>Validated OK</span>
        <span className="mt-tab-count">{stats.cleanCount}</span>
      </button>
      <button
        type="button"
        className={`mt-tab ${statusTab === 'pending' ? 'is-active' : ''}`}
        onClick={() => setStatusTab('pending')}
      >
        <span>Pending</span>
        <span className="mt-tab-count">{stats.pendingCount}</span>
      </button>
    </div>

    <div className="mt-toolbar__right">
      <div className="mt-search-box">
        <Search size={14} className="mt-search-icon" />
        <input
          type="text"
          className="mt-search-input"
          aria-label="Search route or status"
          placeholder="Search route or status…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="mt-search-clear"
            onClick={() => setSearchQuery('')}
            title="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          className="mt-btn-reset"
          onClick={handleResetFilters}
          title="Reset active filters"
        >
          Reset
        </button>
      )}
    </div>
  </div>
);

export default IntervalToolbar;
