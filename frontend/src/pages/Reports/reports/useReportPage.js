import { useCallback, useState } from 'react';

/**
 * The current page of a report, back at 1 whenever `filterKey` changes. The
 * reset happens in the same render as the filter change, so no request ever
 * goes out for an old page number under new filters.
 */
export default function useReportPage(filterKey) {
  const [pager, setPager] = useState({ key: filterKey, page: 1 });
  const page = pager.key === filterKey ? pager.page : 1;
  const setPage = useCallback((next) => setPager({ key: filterKey, page: next }), [filterKey]);
  return [page, setPage];
}
