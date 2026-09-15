import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * useErpList — the single fetch/filter/paginate primitive for ERP list screens.
 *
 * WHY THIS EXISTS:
 * Every ERP list page hand-rolled its own useState + useEffect fetch with a
 * hardcoded `limit`, no cancellation, no URL sync and no pagination, so rows
 * past the first page were silently unreachable and fast tab-switching left
 * stale rows on screen. This centralises that.
 *
 * ── DEEP-LINK CONVENTION (the whole ERP follows this) ──────────────────────
 *   Hub tab            ?tab=<key>            (existing, owned by the hub page)
 *   Sub-tab            ?sub=<key>
 *   List state         ?q= &from= &to= &page= &limit= &sortBy= &order=
 *                      &status= &view= &bucket=
 *   Two lists on one   pass `urlPrefix` → ?ar_page= / ?ap_page=
 *   Drawer             ?drawer=<name>&id=<id>
 *
 * Filter changes use { replace: true } so Back leaves the screen rather than
 * un-typing the user's search one keystroke at a time. Navigation (following a
 * link to another record) is a normal push.
 *
 * ── THE 400 HAZARD ────────────────────────────────────────────────────────
 * The backend's validate() middleware compiles Joi WITHOUT stripUnknown, so an
 * unrecognised query param is a hard 400, not a silent ignore. We strip empty
 * strings, nulls and undefined before sending. That does not make it safe to
 * send a param the backend doesn't know — it only stops *unset* filters from
 * tripping it. New params must ship after their Joi schema is deployed.
 *
 * @param {(params:object, opts:{signal:AbortSignal}) => Promise<any>} fetcher
 *   Usually a service method. Receives cleaned params and an abort signal.
 * @param {object}  options
 * @param {object}  options.initial      Starting params. Keys here define the
 *                                       param surface; extras are passed through.
 * @param {boolean} options.syncToUrl    Mirror params into the query string.
 * @param {string}  options.urlPrefix    Namespace for URL keys (two lists/page).
 * @param {number}  options.debounceMs   Debounce for `q` only.
 * @param {Array}   options.deps         Extra deps that force a refetch.
 * @param {string[]} options.urlKeys     Which params to mirror (default: all).
 */

const DEFAULT_INITIAL = {
  page: 1,
  limit: 25,
  q: '',
};

/** Drop params the backend would either reject or treat as a meaningless filter. */
export const cleanParams = (params) => {
  const out = {};
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;
    out[key] = value;
  });
  return out;
};

/**
 * Normalise the two response envelopes in use:
 *   sendSuccess       → { status: 'success', data, meta }
 *   hand-rolled       → { success: true, data, meta }
 * Also tolerates a bare array and a { data: { entries } } statement shape.
 */
export const unwrapList = (response) => {
  if (!response) return { rows: [], meta: null, raw: null };
  if (Array.isArray(response)) return { rows: response, meta: null, raw: response };

  const meta = response.meta || null;
  const payload = response.data !== undefined ? response.data : response;

  if (Array.isArray(payload)) return { rows: payload, meta, raw: payload };
  if (payload && Array.isArray(payload.entries)) {
    return { rows: payload.entries, meta, raw: payload };
  }
  if (payload && Array.isArray(payload.data)) {
    return { rows: payload.data, meta: payload.meta || meta, raw: payload };
  }
  return { rows: [], meta, raw: payload };
};

const useErpList = (fetcher, options = {}) => {
  const {
    initial = {},
    syncToUrl = false,
    urlPrefix = '',
    debounceMs = 350,
    deps = [],
    urlKeys = null,
  } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  const baseParams = useMemo(
    () => ({ ...DEFAULT_INITIAL, ...initial }),
    // `initial` is a fresh object literal on most renders; its identity must not
    // drive this memo or every render would reset the params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const mirroredKeys = useMemo(
    () => urlKeys || Object.keys(baseParams),
    [urlKeys, baseParams],
  );

  const urlKey = useCallback((key) => `${urlPrefix}${key}`, [urlPrefix]);

  // Hydrate from the URL once, so a pasted deep link restores the exact view.
  const [params, setParamsState] = useState(() => {
    if (!syncToUrl) return baseParams;
    const hydrated = { ...baseParams };
    mirroredKeys.forEach((key) => {
      const raw = searchParams.get(`${urlPrefix}${key}`);
      if (raw === null) return;
      hydrated[key] = typeof baseParams[key] === 'number' ? Number(raw) : raw;
    });
    return hydrated;
  });

  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [raw, setRaw] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const reloadRef = useRef(0);
  const [reloadToken, setReloadToken] = useState(0);

  // `q` is debounced; everything else fires immediately.
  const [debouncedQ, setDebouncedQ] = useState(params.q);
  useEffect(() => {
    if (params.q === debouncedQ) return undefined;
    const timer = setTimeout(() => setDebouncedQ(params.q), debounceMs);
    return () => clearTimeout(timer);
  }, [params.q, debouncedQ, debounceMs]);

  const effectiveParams = useMemo(
    () => ({ ...params, q: debouncedQ }),
    [params, debouncedQ],
  );

  const serialised = JSON.stringify(cleanParams(effectiveParams));

  useEffect(() => {
    if (!syncToUrl) return;
    const next = new URLSearchParams(searchParams);
    mirroredKeys.forEach((key) => {
      const value = effectiveParams[key];
      const isDefault = value === baseParams[key];
      if (value === null || value === undefined || value === '' || isDefault) {
        next.delete(urlKey(key));
      } else {
        next.set(urlKey(key), String(value));
      }
    });
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
    // searchParams is intentionally excluded: including it re-runs this effect
    // with the value it just wrote and fights any other writer on the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialised, syncToUrl]);

  useEffect(() => {
    if (typeof fetcher !== 'function') return undefined;

    // Cancel the in-flight request so a slow earlier page can never resolve
    // after a faster later one and repaint stale rows.
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let active = true;
    setLoading(true);
    setError(null);

    fetcher(cleanParams(effectiveParams), { signal: controller.signal })
      .then((response) => {
        if (!active || controller.signal.aborted) return;
        const unwrapped = unwrapList(response);
        setRows(unwrapped.rows);
        setMeta(unwrapped.meta);
        setRaw(unwrapped.raw);
      })
      .catch((err) => {
        if (!active || controller.signal.aborted) return;
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        setError(err);
        setRows([]);
        setMeta(null);
        setRaw(null);
      })
      .finally(() => {
        if (!active || controller.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialised, reloadToken, ...deps]);

  const setParam = useCallback((key, value) => {
    setParamsState((prev) => {
      if (prev[key] === value) return prev;
      // Any filter change invalidates the current page — staying on page 4 of a
      // freshly narrowed result set shows an empty table.
      const resetsPage = key !== 'page';
      return { ...prev, [key]: value, ...(resetsPage ? { page: 1 } : {}) };
    });
  }, []);

  const setParams = useCallback((patch) => {
    setParamsState((prev) => {
      const next = { ...prev, ...patch };
      if (!Object.prototype.hasOwnProperty.call(patch, 'page')) next.page = 1;
      return next;
    });
  }, []);

  const setPage = useCallback((page) => setParam('page', page), [setParam]);

  const refresh = useCallback(() => {
    reloadRef.current += 1;
    setReloadToken(reloadRef.current);
  }, []);

  const reset = useCallback(() => setParamsState(baseParams), [baseParams]);

  const pagination = useMemo(() => {
    if (!meta) return null;
    const totalPages = meta.totalPages || 0;
    return {
      page: meta.page || params.page || 1,
      totalPages,
      totalCount: meta.total ?? meta.totalCount ?? 0,
      onPageChange: setPage,
    };
  }, [meta, params.page, setPage]);

  return {
    rows,
    meta,
    raw,
    loading,
    error,
    params,
    effectiveParams,
    setParam,
    setParams,
    setPage,
    pagination,
    refresh,
    reset,
  };
};

export default useErpList;
