import { useDeferredValue, useReducer } from 'react';
import { useApi } from '../../hooks/useApi';
import { SupportService } from './SupportService';
import { cleanParams, rangeFor } from '../../lib/supportTicket';

const DEFAULT_SORT = { sortBy: 'lastActivityAt', order: 'desc' };

const initialFilters = {
  status: '',
  range: 'all',
  requesterId: '',
  q: '',
  page: 1,
  limit: 25,
  ...DEFAULT_SORT,
};

// Any filter change sends the user back to page 1; paging alone keeps the rest.
function reducer(state, action) {
  switch (action.type) {
    case 'status':
      return { ...state, status: action.value, page: 1 };
    case 'range':
      return { ...state, range: action.value, page: 1 };
    case 'requester':
      return { ...state, requesterId: action.value, page: 1 };
    case 'search':
      return { ...state, q: action.value, page: 1 };
    case 'sort':
      return action.order
        ? { ...state, sortBy: action.key, order: action.order, page: 1 }
        : { ...state, ...DEFAULT_SORT, page: 1 };
    case 'page':
      return { ...state, page: action.value };
    case 'pageSize':
      return { ...state, limit: action.value, page: 1 };
    default:
      return state;
  }
}

/** Filters, list, stat-card counts and requester options for the Support Portal list. */
export default function useSupportRequests() {
  const [filters, dispatch] = useReducer(reducer, initialFilters);
  const q = useDeferredValue(filters.q.trim());
  const range = rangeFor(filters.range);

  const listParams = cleanParams({
    status: filters.status,
    requesterId: filters.requesterId,
    q,
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy,
    order: filters.order,
    ...range,
  });

  const list = useApi(
    (signal) => SupportService.list(listParams, { signal }),
    [JSON.stringify(listParams)],
  );
  const summary = useApi(
    (signal) => SupportService.summary(cleanParams(range), { signal }),
    [filters.range],
  );
  const requesters = useApi((signal) => SupportService.requesters({ signal }), []);

  return { filters, dispatch, list, summary, requesters };
}
