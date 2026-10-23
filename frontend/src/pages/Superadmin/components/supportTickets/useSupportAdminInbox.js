import { useDeferredValue } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApi } from '../../../../hooks/useApi';
import { cleanParams } from '../../../../lib/supportTicket';
import { SupportAdminService } from './SupportAdminService';

const SORT_KEYS = ['createdAt', 'lastActivityAt'];

/** Reads the inbox filters out of the URL so Back from a ticket returns to the same view. */
function readFilters(params) {
  const sortBy = params.get('sortBy');
  return {
    view: params.get('view') === 'orgs' ? 'orgs' : 'tickets',
    orgId: params.get('orgId') || '',
    status: params.get('status') || '',
    priority: params.get('priority') || '',
    unread: params.get('unread') === '1',
    q: params.get('q') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
    page: Math.max(Number(params.get('page')) || 1, 1),
    limit: Number(params.get('limit')) || 25,
    sortBy: SORT_KEYS.includes(sortBy) ? sortBy : 'lastActivityAt',
    order: params.get('order') === 'asc' ? 'asc' : 'desc',
  };
}

/** Filters (in the URL), ticket list, KPI counts, per-org table and the org picker. */
export default function useSupportAdminInbox() {
  const [params, setParams] = useSearchParams();
  const filters = readFilters(params);
  const q = useDeferredValue(filters.q.trim());

  // Any change other than paging goes back to page 1.
  const update = (changes, { keepPage = false } = {}) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => {
          if (value === '' || value === null || value === undefined || value === false) {
            next.delete(key);
          } else {
            next.set(key, value === true ? '1' : String(value));
          }
        });
        if (!keepPage) next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const range = cleanParams({ from: filters.from, to: filters.to });
  const listParams = cleanParams({
    orgId: filters.orgId,
    status: filters.status,
    priority: filters.priority,
    unread: filters.unread ? 'true' : '',
    q,
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy,
    order: filters.order,
    ...range,
  });
  const summaryParams = cleanParams({ orgId: filters.orgId, ...range });

  const list = useApi(
    (signal) => SupportAdminService.list(listParams, { signal }),
    [JSON.stringify(listParams)],
    { enabled: filters.view === 'tickets' },
  );
  const summary = useApi(
    (signal) => SupportAdminService.summary(summaryParams, { signal }),
    [JSON.stringify(summaryParams)],
  );
  const byOrg = useApi(
    (signal) => SupportAdminService.byOrg(range, { signal }),
    [JSON.stringify(range)],
    { enabled: filters.view === 'orgs' },
  );
  const orgs = useApi((signal) => SupportAdminService.listOrganizations({ signal }), []);

  return { filters, update, list, summary, byOrg, orgs };
}
