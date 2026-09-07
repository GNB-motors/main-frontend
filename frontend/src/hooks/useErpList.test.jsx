import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import useErpList, { cleanParams, unwrapList } from './useErpList';

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const listResponse = (rows, meta = {}) => ({
  status: 'success',
  data: rows,
  meta: { total: rows.length, totalPages: 1, page: 1, ...meta },
});

// useErpList always calls useSearchParams(), even with syncToUrl off,
// so every render needs a Router context.
const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;

describe('cleanParams', () => {
  it('strips null, undefined and empty-string values', () => {
    expect(cleanParams({ a: 1, b: '', c: null, d: undefined, e: 'x' })).toEqual({ a: 1, e: 'x' });
  });

  it('strips empty arrays but keeps populated ones', () => {
    expect(cleanParams({ tags: [], keep: [1] })).toEqual({ keep: [1] });
  });

  it('tolerates null/undefined input', () => {
    expect(cleanParams(null)).toEqual({});
    expect(cleanParams(undefined)).toEqual({});
  });
});

describe('unwrapList', () => {
  it('handles a bare array', () => {
    expect(unwrapList([1, 2])).toEqual({ rows: [1, 2], meta: null, raw: [1, 2] });
  });

  it('handles the sendSuccess envelope', () => {
    const res = listResponse([{ id: 1 }], { totalPages: 3 });
    expect(unwrapList(res).rows).toEqual([{ id: 1 }]);
    expect(unwrapList(res).meta.totalPages).toBe(3);
  });

  it('handles the hand-rolled { success, data } envelope', () => {
    const unwrapped = unwrapList({ success: true, data: [{ id: 2 }], meta: { page: 1 } });
    expect(unwrapped.rows).toEqual([{ id: 2 }]);
    expect(unwrapped.meta).toEqual({ page: 1 });
  });

  it('handles the statement shape { data: { entries } }', () => {
    const unwrapped = unwrapList({ data: { entries: [{ id: 3 }] } });
    expect(unwrapped.rows).toEqual([{ id: 3 }]);
  });

  it('returns empty rows for null or unrecognised responses', () => {
    expect(unwrapList(null).rows).toEqual([]);
    expect(unwrapList({ data: { nope: true } }).rows).toEqual([]);
  });
});

describe('useErpList', () => {
  it('fetches immediately with cleaned default params', async () => {
    const fetcher = vi.fn(() => Promise.resolve(listResponse([{ id: 1 }])));
    const { result } = renderHook(() => useErpList(fetcher), { wrapper });

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetcher).toHaveBeenCalledWith(
      { page: 1, limit: 25 },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(result.current.rows).toEqual([{ id: 1 }]);
    expect(result.current.error).toBeNull();
  });

  it('starts with empty rows and no meta before the first response', () => {
    const d = deferred();
    const fetcher = vi.fn(() => d.promise);
    const { result } = renderHook(() => useErpList(fetcher), { wrapper });
    expect(result.current.rows).toEqual([]);
    expect(result.current.meta).toBeNull();
  });

  it('does not fetch when the fetcher is not a function', () => {
    const { result } = renderHook(() => useErpList(null), { wrapper });
    expect(result.current.loading).toBe(true);
    expect(result.current.rows).toEqual([]);
  });

  it('stores the error and clears rows on failure', async () => {
    const failure = new Error('backend down');
    const fetcher = vi.fn(() => Promise.reject(failure));
    const { result } = renderHook(() => useErpList(fetcher), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe(failure);
    expect(result.current.rows).toEqual([]);
    expect(result.current.meta).toBeNull();
  });

  it('setParam on a filter resets the page to 1 and refetches', async () => {
    const fetcher = vi.fn(() => Promise.resolve(listResponse([])));
    const { result } = renderHook(() => useErpList(fetcher), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setParam('status', 'active');
    });
    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(
        { page: 1, limit: 25, status: 'active' },
        expect.anything(),
      ),
    );
    expect(result.current.params.status).toBe('active');
    expect(result.current.params.page).toBe(1);
  });

  it('setParam("page") navigates without resetting other filters', async () => {
    const fetcher = vi.fn(() => Promise.resolve(listResponse([])));
    const { result } = renderHook(() => useErpList(fetcher), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.setParam('status', 'active');
    });
    await waitFor(() => expect(result.current.params.status).toBe('active'));

    act(() => {
      result.current.setPage(3);
    });
    await waitFor(() =>
      expect(fetcher).toHaveBeenLastCalledWith(
        { page: 3, limit: 25, status: 'active' },
        expect.anything(),
      ),
    );
  });

  it('setParams merges a patch and resets page when not provided', async () => {
    const fetcher = vi.fn(() => Promise.resolve(listResponse([])));
    const { result } = renderHook(() => useErpList(fetcher), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setPage(2);
    });
    await waitFor(() => expect(result.current.params.page).toBe(2));

    act(() => {
      result.current.setParams({ status: 'inactive' });
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.params.page).toBe(1);
    expect(result.current.params.status).toBe('inactive');
  });

  it('setParam with an unchanged value is a no-op (no refetch)', async () => {
    const fetcher = vi.fn(() => Promise.resolve(listResponse([])));
    const { result } = renderHook(() => useErpList(fetcher), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setParam('limit', 25);
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('exposes pagination derived from meta', async () => {
    const fetcher = vi.fn(() =>
      Promise.resolve(listResponse([{ id: 1 }], { totalPages: 4, page: 1, total: 100 })),
    );
    const { result } = renderHook(() => useErpList(fetcher), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.pagination).toEqual({
      page: 1,
      totalPages: 4,
      totalCount: 100,
      onPageChange: expect.any(Function),
    });

    act(() => {
      result.current.pagination.onPageChange(2);
    });
    await waitFor(() => expect(result.current.params.page).toBe(2));
  });

  it('pagination is null when the response carries no meta', async () => {
    const fetcher = vi.fn(() => Promise.resolve([{ id: 1 }]));
    const { result } = renderHook(() => useErpList(fetcher), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.pagination).toBeNull();
  });

  it('refresh() refetches with unchanged params', async () => {
    const fetcher = vi.fn(() => Promise.resolve(listResponse([])));
    const { result } = renderHook(() => useErpList(fetcher), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetcher).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.refresh();
    });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    expect(result.current.params.page).toBe(1);
  });

  it('reset() restores the initial params', async () => {
    const fetcher = vi.fn(() => Promise.resolve(listResponse([])));
    const { result } = renderHook(
      () => useErpList(fetcher, { initial: { status: 'active', limit: 10 } }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.setParam('status', 'inactive');
      result.current.setPage(5);
    });
    act(() => {
      result.current.reset();
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.params).toEqual({ page: 1, limit: 10, q: '', status: 'active' });
  });

  it('aborts the in-flight request on param change and ignores its late result', async () => {
    const first = deferred();
    const second = deferred();
    const fetcher = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockImplementationOnce(() => second.promise);
    const { result } = renderHook(() => useErpList(fetcher), { wrapper });

    act(() => {
      result.current.setPage(2);
    });
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);

    await act(async () => {
      first.resolve(listResponse([{ id: 'stale' }]));
      await first.promise;
    });
    expect(result.current.rows).toEqual([]);
    expect(result.current.error).toBeNull();

    await act(async () => {
      second.resolve(listResponse([{ id: 'fresh' }]));
      await second.promise;
    });
    expect(result.current.rows).toEqual([{ id: 'fresh' }]);
  });

  it('hydrates params from the URL when syncToUrl is on', async () => {
    const fetcher = vi.fn(() => Promise.resolve(listResponse([])));
    const urlWrapper = ({ children }) => (
      <MemoryRouter initialEntries={['/?erp_page=2&erp_q=ford']}>{children}</MemoryRouter>
    );
    renderHook(
      () =>
        useErpList(fetcher, {
          syncToUrl: true,
          urlPrefix: 'erp_',
          initial: { q: '', page: 1 },
        }),
      { wrapper: urlWrapper },
    );

    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    expect(fetcher).toHaveBeenLastCalledWith({ page: 2, limit: 25, q: 'ford' }, expect.anything());
  });

  it('mirrors non-default params into the URL when syncToUrl is on', async () => {
    const fetcher = vi.fn(() => Promise.resolve(listResponse([])));
    let lastSearch = '';
    const Probe = () => {
      lastSearch = useLocation().search;
      return null;
    };
    const probeWrapper = ({ children }) => (
      <MemoryRouter>
        <Probe />
        {children}
      </MemoryRouter>
    );
    const { result } = renderHook(
      () => useErpList(fetcher, { syncToUrl: true, initial: { status: 'active' } }),
      { wrapper: probeWrapper },
    );

    act(() => {
      result.current.setParam('status', 'inactive');
    });
    await waitFor(() => expect(lastSearch).toContain('status=inactive'));
  });
});
