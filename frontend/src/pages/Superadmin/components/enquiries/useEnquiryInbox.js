import { useDeferredValue } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../../../hooks/useApi';
import { cleanParams } from '../../../../lib/supportTicket';
import { EnquiryAdminService } from './EnquiryAdminService';

/** Filters live in the URL so a reload or a shared link opens the same view. */
function readFilters(params) {
  return {
    status: params.get('status') || '',
    q: params.get('q') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
    page: Math.max(Number(params.get('page')) || 1, 1),
    limit: Number(params.get('limit')) || 25,
    order: params.get('order') === 'asc' ? 'asc' : 'desc',
  };
}

/** Filters, the enquiry list and the per-status counts for the super-admin inbox. */
export default function useEnquiryInbox() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const q = useDeferredValue(filters.q.trim());

  // Any change other than paging goes back to page 1.
  const update = (changes, { keepPage = false } = {}) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => {
          if (value === '' || value === null || value === undefined) next.delete(key);
          else next.set(key, String(value));
        });
        if (!keepPage) next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const range = cleanParams({ from: filters.from, to: filters.to });
  const listParams = cleanParams({
    status: filters.status,
    q,
    page: filters.page,
    limit: filters.limit,
    sortBy: 'createdAt',
    order: filters.order,
    ...range,
  });

  const list = useApi(
    (signal) => EnquiryAdminService.list(listParams, { signal }),
    [JSON.stringify(listParams)],
  );
  const summary = useApi(
    (signal) => EnquiryAdminService.summary(range, { signal }),
    [JSON.stringify(range)],
  );

  return { filters, update, list, summary };
}
