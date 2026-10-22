import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useActiveBranch } from '../../../contexts/BranchContext';
import {
  ALL,
  EMPTY_FILTERS,
  countActiveFilters,
  readFilterParams,
  resolveRange,
  toRequestParams,
  writeFilterParams,
} from './reportFilterParams';

/**
 * Binds one report to the shared filter bar.
 *
 * The URL is the single source of truth, so this hook owns no filter state of
 * its own: every control writes a search param and the report reads whatever
 * the URL currently says. That is what makes a filtered report shareable —
 * copy the address bar and the recipient lands on the same numbers.
 *
 * Filter changes replace the history entry rather than pushing one, so Back
 * leaves the report instead of stepping through every keystroke.
 *
 * Location scope: `loc` pins the operating location the link was built for. A
 * pinned link applies that location through the same context the header
 * switcher uses (no second scope mechanism); an unpinned report simply runs
 * under whatever location the app is already on.
 *
 * Returns:
 *   filters          current filter values (unset entities read as 'all')
 *   range            the selected {from,to}, empty when unbounded
 *   requestParams    the same values shaped as API params, search debounced
 *   activeCount      how many filters are narrowing the result
 *   setFilters       merge a partial patch into the URL
 *   setFilter        single-key shorthand
 *   applyRangePreset set a quick range from a REPORT_RANGE_PRESETS entry
 *   clearFilters     drop every filter param, keep the rest of the query
 */
export default function useReportFilterParams({ searchDebounceMs = 300 } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { branchId, setBranch } = useActiveBranch();

  const filters = useMemo(() => readFilterParams(searchParams), [searchParams]);
  // Not memoised: a relative range has to re-resolve when the day rolls over,
  // or a tab left open overnight keeps reporting yesterday's "Today".
  const range = resolveRange(filters);
  const activeCount = countActiveFilters(filters);

  // The search box stays responsive because `filters.search` updates on every
  // keystroke; only the request waits for a pause.
  const debouncedSearch = useDebouncedValue(filters.search.trim(), searchDebounceMs);
  const requestParams = useMemo(
    () => toRequestParams({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  const setFilters = useCallback(
    (patch) => {
      setSearchParams(writeFilterParams(searchParams, patch), { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const setFilter = useCallback((key, value) => setFilters({ [key]: value }), [setFilters]);

  const applyRangePreset = useCallback(
    // Clicking the active preset again drops it, so the report goes back to
    // showing all time without hunting for a "clear".
    (presetKey) => setFilters({ dates: filters.dates === presetKey ? '' : presetKey }),
    [filters.dates, setFilters],
  );

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), [setFilters]);

  // A pinned `loc` wins over the app's current location, so a shared link
  // opens the numbers it was shared for. Applied once per value — the header
  // switcher stays authoritative after that.
  const appliedLoc = useRef(null);
  useEffect(() => {
    if (!setBranch) return;
    const wanted = filters.loc;
    if (!wanted || wanted === branchId || appliedLoc.current === wanted) return;
    appliedLoc.current = wanted;
    setBranch(wanted);
  }, [branchId, filters.loc, setBranch]);

  return {
    filters,
    range,
    requestParams,
    activeCount,
    setFilters,
    setFilter,
    applyRangePreset,
    clearFilters,
    entityAll: ALL,
  };
}