import { Search, Plus } from 'lucide-react';

const FleetToolbar = ({
  eligible,
  tankers,
  hidden,
  showAll,
  vehicleSearch,
  setVehicleSearch,
  locations,
  locFilter,
  setLocFilter,
  sortBy,
  setSortBy,
  setShowAll,
  remaining,
  setTarget,
}) => (
  <div className="erp-toolbar" style={{ marginTop: 0 }}>
    <span className="erp-cell-muted">
      {eligible.length} of {tankers.length} can be assigned
      {hidden > 0 && !showAll && ` · ${hidden} hidden`}
    </span>

    <div className="erp-search" style={{ flex: '1 1 220px' }}>
      <Search size={16} className="search-icon" />
      <input
        type="search"
        value={vehicleSearch}
        onChange={(e) => setVehicleSearch(e.target.value)}
        placeholder="Search vehicle number…"
        aria-label="Search vehicles"
      />
    </div>

    {locations.length > 1 && (
      <select
        className="erp-filter"
        value={locFilter}
        onChange={(e) => setLocFilter(e.target.value)}
        aria-label="Filter by location"
      >
        <option value="">All locations</option>
        {locations.map((l) => (
          <option key={l} value={l}>
            {l}
          </option>
        ))}
      </select>
    )}

    <select
      className="erp-filter"
      value={sortBy}
      onChange={(e) => setSortBy(e.target.value)}
      aria-label="Sort tankers"
    >
      <option value="LOADING_POINT">At the loading point first</option>
      <option value="CAPACITY">Largest capacity first</option>
      <option value="LOCATION">By location</option>
    </select>
    {/* Hire belongs beside the fleet it is an alternative to: the choice
                is "assign one of these, or bring in an outside vehicle", and
                that reads as one decision only when both sit together. */}
    <div className="erp-toolbar-actions">
      {hidden > 0 && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? 'Only assignable' : 'Show all, with reasons'}
        </button>
      )}
      {remaining > 0 && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => setTarget({ mode: 'HIRE', suggestedQty: remaining })}
        >
          <Plus size={15} />
          Hire vehicle
        </button>
      )}
    </div>
  </div>
);

export default FleetToolbar;
