import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { KhataField } from './khataUi';
import { getVehicleLabel, getDriverName } from '../utils';
import {
  LEDGER_CATEGORY_OPTIONS,
  LEDGER_SOURCE_OPTIONS,
  categoryLabel,
  sourceLabel,
} from './ledgerDetailLogic';

/**
 * The three ledger-detail filter dropdowns (category / source / the other side
 * of the ledger). Kept as components-only so react-refresh doesn't mix
 * plain-function exports into logic modules (rule 15).
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
  <div className="khata-filters">
    <KhataField label="Category" htmlFor="kld-filter-category">
      <SearchableSelect
        id="kld-filter-category"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">All categories</option>
        {LEDGER_CATEGORY_OPTIONS.map((c) => (
          <option key={c} value={c}>
            {categoryLabel(c)}
          </option>
        ))}
      </SearchableSelect>
    </KhataField>
    <KhataField label="Source" htmlFor="kld-filter-source">
      <SearchableSelect
        id="kld-filter-source"
        value={source}
        onChange={(e) => onSourceChange(e.target.value)}
      >
        <option value="">All sources</option>
        {LEDGER_SOURCE_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {sourceLabel(s)}
          </option>
        ))}
      </SearchableSelect>
    </KhataField>
    <KhataField label={isDriver ? 'Vehicle' : 'Driver'} htmlFor="kld-filter-cross">
      <SearchableSelect
        id="kld-filter-cross"
        value={crossFilterId}
        onChange={(e) => onCrossFilterChange(e.target.value)}
      >
        <option value="">All {isDriver ? 'vehicles' : 'drivers'}</option>
        {crossOptions.map((opt) => (
          <option key={opt._id} value={opt._id}>
            {isDriver ? getVehicleLabel(opt) : getDriverName(opt)}
          </option>
        ))}
      </SearchableSelect>
    </KhataField>
  </div>
);
