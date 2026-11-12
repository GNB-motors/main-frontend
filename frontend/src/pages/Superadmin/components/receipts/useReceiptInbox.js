import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useFeatureFlags } from '../../../../contexts/FeatureFlagsContext';
import { useDebouncedValue } from '../../../../hooks/useDebouncedValue';
import { ReceiptApprovalService } from '../ReceiptApprovalService';
import { getUserRole } from '../../../../utils/session';
import { draftListParams, filterDraftsLocally } from './receiptFilters';
import { computeReceiptKpis, kpisFromSummary } from './receiptKpis';
import { plainActionError, plainLoadError, refusalMessage } from './receiptActions';

// The receipt inbox's state, fetching, selection and actions, in their original hook order.
const useReceiptInbox = ({ onCounts }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperadminRoute = location.pathname.startsWith('/superadmin');
  const basePath = isSuperadminRoute ? '/superadmin/receipts' : '/approvals/whatsapp';

  // /api/auth/me already carries organization.whatsappSettings; the server
  // treats an unset mode as INTERACTIVE. A choice made here wins until the
  // context refresh after saving brings it back.
  const { organization, refresh: refreshOrganization } = useFeatureFlags();
  const [chosenOdoMode, setChosenOdoMode] = useState(null);
  const odoMode = chosenOdoMode ?? (organization?.whatsappSettings?.odometerMode || 'INTERACTIVE');
  const [odoPolicyModalOpen, setOdoPolicyModalOpen] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  const userRole = (getUserRole() || '').toUpperCase();
  const canEditPolicy = ['OWNER', 'MANAGER', 'SUPER_ADMIN'].includes(userRole);

  const [status, setStatus] = useState('READY');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  // A refused action belongs to the row it was made on: { [draftId]: words }.
  const [rowErrors, setRowErrors] = useState({});

  // Filters
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | '7DAYS' | '30DAYS'
  const [odoFilter, setOdoFilter] = useState('ALL'); // 'ALL' | 'MISSING' | 'TELEMATICS' | 'PHOTO'
  const [anomalyFilter, setAnomalyFilter] = useState('ALL'); // 'ALL' | 'NEEDS_REVIEW' | 'MATH_VERIFIED'
  const [sortDirection, setSortDirection] = useState('desc'); // 'desc' (newest refuel date first) | 'asc'

  // Paging. The server filters, sorts and pages (B4: it used to send 200 rows
  // and the browser filtered those, hiding everything after them).
  const [pageSize, setPageSize] = useState(50);
  const debouncedQuery = useDebouncedValue(query, 350);
  // Any filter change starts again at page 1: the page is only kept while the
  // filters it was chosen under are unchanged.
  const listKey = JSON.stringify([
    status,
    debouncedQuery,
    dateFilter,
    odoFilter,
    anomalyFilter,
    sortDirection,
    pageSize,
  ]);
  const [pageState, setPageState] = useState({ key: listKey, page: 1 });
  const page = pageState.key === listKey ? pageState.page : 1;
  const setPage = (next) => setPageState({ key: listKey, page: next });
  // { total, totalPages, summary } from a paging backend; null before the first
  // answer or from a backend that predates server-side filtering.
  const [listMeta, setListMeta] = useState(null);
  const [legacyBackend, setLegacyBackend] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  // Drawer & Lightbox preview state
  const [activeDrawerId, setActiveDrawerId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // { url, title }

  // Main fetch function. Each call cancels the one before it, so a slow
  // response for a tab the user already left can't overwrite the current one.
  const fetchAbortRef = useRef(null);
  // The tab whose full window an older backend has already sent (see the effect below).
  const legacyStatusRef = useRef(null);
  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      fetchAbortRef.current?.abort();
      const controller = new AbortController();
      fetchAbortRef.current = controller;
      const { signal } = controller;

      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const [list, countsData] = await Promise.all([
          ReceiptApprovalService.listDrafts(
            draftListParams({
              status,
              page,
              // An older backend ignores the filters; fetch its whole window.
              limit: legacyBackend ? 200 : pageSize,
              query: debouncedQuery,
              dateFilter,
              odoFilter,
              anomalyFilter,
              sortDirection,
            }),
            { signal },
          ),
          // The tab counts are a badge; the list still renders without them.
          ReceiptApprovalService.getDraftCounts({ signal }).catch(() => null),
        ]);
        if (signal.aborted) return;
        const paged = list.totalPages != null;
        setLegacyBackend(!paged);
        legacyStatusRef.current = !paged && legacyBackend ? status : null;
        setItems(list.items ?? []);
        setListMeta(
          paged
            ? { total: list.total ?? 0, totalPages: list.totalPages, summary: list.summary ?? null }
            : null,
        );
        if (countsData) {
          setCounts(countsData);
          onCounts?.(countsData);
        }
      } catch (e) {
        if (signal.aborted) return;
        // A failed load is a failure, never an empty inbox.
        setError(plainLoadError(e));
      } finally {
        if (fetchAbortRef.current === controller) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [
      status,
      page,
      pageSize,
      legacyBackend,
      debouncedQuery,
      dateFilter,
      odoFilter,
      anomalyFilter,
      sortDirection,
      onCounts,
    ],
  );

  useEffect(() => () => fetchAbortRef.current?.abort(), []);

  useEffect(() => {
    setSelectedIds(new Set());
    // An older backend ignores the filters, which then apply in the browser, so
    // a filter change there needs no request (and no skeleton flash); only a
    // new tab does. Mutations and Refresh call fetchData directly and still load.
    if (legacyBackend && legacyStatusRef.current === status) return;
    fetchData();
  }, [fetchData, legacyBackend, status]);

  // The server has already filtered, sorted and paged; only an older backend's
  // 200-row window still needs filtering here.
  const filtered = useMemo(
    () =>
      legacyBackend
        ? filterDraftsLocally(items, { query, dateFilter, odoFilter, anomalyFilter, sortDirection })
        : items,
    [legacyBackend, items, query, dateFilter, odoFilter, anomalyFilter, sortDirection],
  );

  // Compute KPI stats across loaded list
  // KPIs cover the whole tab (server summary), not just the page on screen.
  const kpis = useMemo(
    () => (listMeta?.summary ? kpisFromSummary(listMeta.summary) : computeReceiptKpis(items)),
    [listMeta, items],
  );

  // Selection logic
  const selectableItems = useMemo(() => filtered.filter((d) => d.status === 'READY'), [filtered]);

  const selectedDrafts = useMemo(
    () => items.filter((d) => selectedIds.has(d._id)),
    [items, selectedIds],
  );

  const totalSelectedLitres = useMemo(
    () => selectedDrafts.reduce((sum, d) => sum + (Number(d.litres) || 0), 0),
    [selectedDrafts],
  );

  const totalSelectedAmount = useMemo(
    () => selectedDrafts.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
    [selectedDrafts],
  );

  const toggleSelectOne = useCallback((id, e) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelectableIds = selectableItems.map((d) => d._id);
      const allSelected =
        allSelectableIds.length > 0 && allSelectableIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) {
        allSelectableIds.forEach((id) => next.delete(id));
      } else {
        allSelectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [selectableItems]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Quick single actions
  const setRowError = useCallback((draftId, message) => {
    setRowErrors((prev) => {
      const next = { ...prev };
      if (!message) delete next[draftId];
      else next[draftId] = message;
      return next;
    });
  }, []);

  const handleSingleApprove = useCallback(
    async (draftId, vehReg, e) => {
      e?.stopPropagation?.();
      setRowError(draftId, '');
      try {
        const result = await ReceiptApprovalService.publishDraft(draftId);
        // A resolved promise is not always a success: the server can refuse.
        const refusal = refusalMessage(
          result,
          'The receipt was not approved. Please check the details and try again.',
        );
        if (refusal) {
          setRowError(draftId, refusal);
          return;
        }
        toast.success(`Published receipt for ${vehReg} to Fuel Ledger`);
        await fetchData();
      } catch (err) {
        // The words sit next to the row: never a silent failure.
        setRowError(
          draftId,
          plainActionError(err, 'The receipt was not approved. Please try again.'),
        );
      }
    },
    [fetchData, setRowError],
  );

  // The same approval, tried again from the row itself.
  const handleRetryRow = useCallback(
    (draftId, e) => {
      e?.stopPropagation?.();
      const draft = items.find((d) => d._id === draftId);
      return handleSingleApprove(
        draftId,
        draft?.vehicleId?.registrationNumber || draft?.vehicleReg || 'the vehicle',
        e,
      );
    },
    [items, handleSingleApprove],
  );

  // Bulk Approve
  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const data = await ReceiptApprovalService.bulkPublishDrafts(ids);
      const { successCount = 0, failureCount = 0, failed = [] } = data;

      if (failureCount === 0) {
        toast.success(
          `Successfully published ${successCount} fuel receipt${successCount === 1 ? '' : 's'}`,
        );
      } else {
        // Every refusal keeps its own words, next to its own row.
        failed.forEach((f) =>
          setRowError(
            f?.id,
            plainActionError(
              { message: f?.message },
              'The receipt was not approved. Please check it and try again.',
            ),
          ),
        );
        const failureMessages = Array.from(new Set(failed.map((f) => f.message).filter(Boolean)));
        if (successCount > 0) {
          toast.success(`Published ${successCount} fuel receipt${successCount === 1 ? '' : 's'}`);
        }
        if (failureMessages.length > 0) {
          failureMessages.forEach((msg) => toast.error(msg));
        } else {
          toast.error(`${failureCount} receipts failed to publish`);
        }
      }

      setShowBulkApproveModal(false);
      clearSelection();
      await fetchData();
    } catch (err) {
      toast.error(plainActionError(err, 'Error processing bulk approval'));
    } finally {
      setBulkBusy(false);
    }
  }, [selectedIds, bulkBusy, clearSelection, fetchData, setRowError]);

  // Bulk Reject
  const handleBulkReject = useCallback(async () => {
    if (selectedIds.size === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(
        ids.map((id) =>
          ReceiptApprovalService.rejectDraft(id, bulkRejectReason.trim() || undefined),
        ),
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      if (successCount > 0) {
        toast.success(
          `Rejected ${successCount} fuel receipt${successCount === 1 ? '' : 's'} with reason recorded`,
        );
      }
      if (failCount > 0) {
        toast.error(`${failCount} receipts could not be rejected`);
      }

      setShowBulkRejectModal(false);
      setBulkRejectReason('');
      clearSelection();
      await fetchData();
    } catch (err) {
      toast.error(plainActionError(err, 'Error processing bulk rejection'));
    } finally {
      setBulkBusy(false);
    }
  }, [selectedIds, bulkRejectReason, bulkBusy, clearSelection, fetchData]);

  // Drawer index navigation
  const currentDrawerIndex = useMemo(
    () => filtered.findIndex((d) => d._id === activeDrawerId),
    [filtered, activeDrawerId],
  );

  return {
    activeDrawerId,
    anomalyFilter,
    basePath,
    bulkBusy,
    bulkRejectReason,
    canEditPolicy,
    clearSelection,
    counts,
    currentDrawerIndex,
    dateFilter,
    error,
    fetchData,
    filtered,
    handleBulkApprove,
    handleBulkReject,
    handleRetryRow,
    handleSingleApprove,
    isSuperadminRoute,
    kpis,
    listMeta,
    loading,
    navigate,
    odoFilter,
    odoMode,
    odoPolicyModalOpen,
    page,
    pageSize,
    previewImage,
    query,
    refreshOrganization,
    refreshing,
    rowErrors,
    savingPolicy,
    selectableItems,
    selectedIds,
    setActiveDrawerId,
    setAnomalyFilter,
    setBulkRejectReason,
    setChosenOdoMode,
    setDateFilter,
    setOdoFilter,
    setOdoPolicyModalOpen,
    setPage,
    setPageSize,
    setPreviewImage,
    setQuery,
    setRowError,
    setSavingPolicy,
    setShowBulkApproveModal,
    setShowBulkRejectModal,
    setSortDirection,
    setStatus,
    showBulkApproveModal,
    showBulkRejectModal,
    sortDirection,
    status,
    toggleSelectAll,
    toggleSelectOne,
    totalSelectedAmount,
    totalSelectedLitres,
  };
};

export default useReceiptInbox;
