import {
  CATEGORIES,
  CATEGORY_LABELS,
  SOURCE_LABELS,
  getVehicleLabel,
  getDriverName,
} from '../utils';

/**
 * The three ledger-detail filter dropdowns (category / source / cross-entity),
 * rendered inside FilterBar's right slot. Kept as components-only so
 * react-refresh doesn't mix plain-function exports into logic modules (rule 15).
 */
export const LedgerFilterSelects = ({
  isDriver,
  category,
  source,
  crossFilterId,
  crossOptions,
  onCategoryChange,
  onSourceChange,
  onCrossFilterChange,
}) => (
  <>
    <label className="fbar-field">
      <span>Category</span>
      <select
        className="fbar-select"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
    </label>
    <label className="fbar-field">
      <span>Source</span>
      <select
        className="fbar-select"
        value={source}
        onChange={(e) => onSourceChange(e.target.value)}
      >
        <option value="">All Sources</option>
        {Object.keys(SOURCE_LABELS).map((s) => (
          <option key={s} value={s}>
            {SOURCE_LABELS[s]}
          </option>
        ))}
      </select>
    </label>
    <label className="fbar-field">
      <span>{isDriver ? 'Vehicle' : 'Driver'}</span>
      <select
        className="fbar-select"
        value={crossFilterId}
        onChange={(e) => onCrossFilterChange(e.target.value)}
      >
        <option value="">All {isDriver ? 'Vehicles' : 'Drivers'}</option>
        {crossOptions.map((opt) => (
          <option key={opt._id} value={opt._id}>
            {isDriver ? getVehicleLabel(opt) : getDriverName(opt)}
          </option>
        ))}
      </select>
    </label>
  </>
);
