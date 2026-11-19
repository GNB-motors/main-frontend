import { useEffect, useState } from 'react';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import { useSearchParams } from 'react-router-dom';
import { useActiveBranch } from '../../../../contexts/BranchContext';
import useReportFilterParams from '../useReportFilterParams';
import { EMPTY_FILTERS } from '../reportFilterParams';
import { presetRange } from '../../../Mileage/mileageDates';
import { FUEL_GROUPS, TRIP_GROUPS, reportQuery } from './consolidatedReportModel';

export default function useConsolidatedReport(kind) {
  const shared = useReportFilterParams({ syncLocation: false });
  const { setFilter } = shared;
  // Keep keystrokes local while React Router commits the shareable URL.
  // An external URL change wins immediately; only edits based on that URL may commit.
  const [searchEdit, setSearchEdit] = useState({
    url: shared.filters.search,
    value: shared.filters.search,
  });
  const search =
    searchEdit.url === shared.filters.search ? searchEdit.value : shared.filters.search;
  const debouncedSearch = useDebouncedValue(search, 300);
  useEffect(() => {
    if (
      searchEdit.url === shared.filters.search &&
      debouncedSearch === searchEdit.value &&
      debouncedSearch !== shared.filters.search
    )
      setFilter('search', debouncedSearch);
  }, [searchEdit, debouncedSearch, shared.filters.search, setFilter]);
  const [params, setParams] = useSearchParams();
  const { branchId, setBranch } = useActiveBranch();
  const location = shared.filters.loc;
  useEffect(() => {
    // Commit the URL first, then change the context that remounts the page.
    // 'all' is explicit enterprise scope; an absent loc follows the header.
    if (!location) return;
    const wanted = location === 'all' ? null : location;
    if (wanted !== branchId) setBranch(wanted);
  }, [location, branchId, setBranch]);
  const groups = kind === 'fuel' ? FUEL_GROUPS : TRIP_GROUPS;
  const groupBy = groups.some((g) => g.value === params.get('group'))
    ? params.get('group')
    : 'vehicle';
  const noPeriod = !shared.filters.dates && !shared.filters.from && !shared.filters.to;
  const range = noPeriod
    ? presetRange('30DAYS')
    : shared.filters.from || shared.filters.to
      ? { from: shared.filters.from, to: shared.filters.to }
      : shared.range;
  const dateError =
    !range.from || !range.to
      ? 'Choose both a start and end date.'
      : range.from > range.to
        ? 'The start date must be on or before the end date.'
        : null;
  useEffect(() => {
    if (noPeriod) setFilter('dates', '30DAYS');
  }, [noPeriod, setFilter]);
  const query = reportQuery(shared.filters, range, groupBy);
  const key = JSON.stringify({ ...query, branchId });
  const patch = (values) => {
    const next = new URLSearchParams(params);
    Object.entries(values).forEach(([k, v]) => (v == null ? next.delete(k) : next.set(k, v)));
    setParams(next, { replace: true });
  };
  return {
    ...shared,
    range,
    groups,
    groupBy,
    query,
    key,
    dateError,
    params,
    patch,
    search,
    setSearch: (value) => setSearchEdit({ url: shared.filters.search, value }),
    clearFilters: () => {
      setSearchEdit({ url: '', value: '' });
      shared.setFilters({ ...EMPTY_FILTERS, loc: 'all' });
    },
  };
}
