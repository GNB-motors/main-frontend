import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Search,
  Inbox,
  Truck,
  Gauge,
  MessageSquare,
  Radio,
  PencilLine,
  ArrowLeft,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Fuel,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  Phone,
  ShieldCheck,
  Calendar,
  X,
  Eye,
  Sliders,
  Sparkles,
  Receipt,
} from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../../utils/session';
import ReceiptApprovalDrawer from './ReceiptApprovalDrawer';
import ImagePreviewModal from '../../Trip/components/ImagePreviewModal';
import {
  fmtMoney,
  fmtLitres,
  fmtDate,
  fmtRelativeTime,
  evaluateOcrQuality,
  getOdometerMeta,
  filterByDatePreset,
  computeReceiptKpis,
} from './ReceiptApproval.shared';
import './ReceiptApproval.css';

const ODOMETER_MODES = [
  {
    key: 'INTERACTIVE',
    label: 'Ask driver (Interactive)',
    icon: <MessageSquare size={16} />,
    desc: 'WhatsApp bot asks driver for dash photo or typed reading. Falls back to FleetEdge if unresponsive.',
  },
  {
    key: 'FLEETEDGE',
    label: 'Auto FleetEdge (Telematics Sync)',
    icon: <Radio size={16} />,
    desc: 'Pulls the CAN-bus telematics odometer at the bill timestamp automatically.',
  },
  {
    key: 'MANUAL',
    label: 'Manual only (Physical Ledger)',
    icon: <PencilLine size={16} />,
    desc: 'Requires human-verified dash photo or typed reading. Never syncs automatically from telematics.',
  },
];

const STATUS_TABS = [
  { key: 'READY', label: 'Pending' },
  { key: 'PUBLISHED', label: 'Published' },
  { key: 'REJECTED', label: 'Rejected' },
  { key: 'CLEARED', label: 'Cleared' },
  { key: 'ALL', label: 'All' },
];

const STATUS_BADGE = {
  READY: 'ra-badge--ready',
  PUBLISHED: 'ra-badge--published',
  REJECTED: 'ra-badge--rejected',
  CLEARED: 'ra-badge--cleared',
};

const ReceiptApprovalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperadminRoute = location.pathname.startsWith('/superadmin');
  const basePath = isSuperadminRoute ? '/superadmin/receipts' : '/whatsapp-approvals';

  const { organization } = useFeatureFlags();
  const [odoMode, setOdoMode] = useState(
    organization?.whatsappSettings?.odometerMode || 'INTERACTIVE',
  );
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

  // Filters
  const [query, setQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | '7DAYS' | '30DAYS'
  const [odoFilter, setOdoFilter] = useState('ALL'); // 'ALL' | 'MISSING' | 'TELEMATICS' | 'PHOTO'
  const [anomalyFilter, setAnomalyFilter] = useState('ALL'); // 'ALL' | 'NEEDS_REVIEW' | 'MATH_VERIFIED'

  // Selection
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');

  // Drawer & Lightbox preview state
  const [activeDrawerId, setActiveDrawerId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null); // { url, title }

  // Fetch settings for odometer policy
  useEffect(() => {
    let alive = true;
    apiClient
      .get('/api/whatsapp/settings')
      .then((res) => {
        if (alive && res.data?.data?.odometerMode) setOdoMode(res.data.data.odometerMode);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const changeOdoMode = async (next) => {
    if (next === odoMode || savingPolicy || !canEditPolicy) return;
    const prev = odoMode;
    setOdoMode(next);
    setSavingPolicy(true);
    try {
      await apiClient.patch('/api/whatsapp/settings', { odometerMode: next });
      toast.success('Odometer Triple-Check policy updated');
      setOdoPolicyModalOpen(false);
    } catch (err) {
      setOdoMode(prev);
      toast.error(err.response?.data?.message || 'Failed to update policy');
    } finally {
      setSavingPolicy(false);
    }
  };

  // Main fetch function
  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const [draftsRes, countsRes] = await Promise.all([
          apiClient.get('/api/whatsapp/admin/drafts', {
            params: { status, limit: 200 },
          }),
          apiClient.get('/api/whatsapp/admin/drafts/counts').catch(() => null),
        ]);
        setItems(draftsRes.data?.data?.items ?? []);
        if (countsRes?.data?.data) {
          setCounts(countsRes.data.data);
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to load receipts');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status],
  );

  useEffect(() => {
    fetchData();
    setSelectedIds(new Set());
  }, [fetchData]);

  // Comprehensive multi-filter
  const filtered = useMemo(() => {
    let result = items;

    // Date filter
    result = filterByDatePreset(result, dateFilter);

    // Odometer filter
    if (odoFilter === 'MISSING') {
      result = result.filter(
        (d) =>
          d.odometerReading == null || (d.adminNotes && d.adminNotes.includes('MISSING_ODOMETER')),
      );
    } else if (odoFilter === 'TELEMATICS') {
      result = result.filter((d) => (d.odometerSource || '').toUpperCase().includes('FLEETEDGE'));
    } else if (odoFilter === 'PHOTO') {
      result = result.filter((d) => d.odometerPhotoProvided || d.odometerSource === 'OCR');
    }

    // Anomaly filter
    if (anomalyFilter === 'NEEDS_REVIEW') {
      result = result.filter((d) => {
        const ocr = evaluateOcrQuality(d);
        const odo = getOdometerMeta(d);
        return ocr.level === 'low' || odo.isMissing || (ocr.math && !ocr.math.isValid);
      });
    } else if (anomalyFilter === 'MATH_VERIFIED') {
      result = result.filter((d) => {
        const ocr = evaluateOcrQuality(d);
        return ocr.math?.isValid;
      });
    }

    // Text search query
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((d) => {
        const veh = d.vehicleId?.registrationNumber || d.vehicleReg || '';
        const org = d.orgId?.companyName || '';
        const plate = d.plateText || '';
        const driver = `${d.userId?.firstName || ''} ${d.userId?.lastName || ''}`.trim();
        const phone = d.phoneE164 || d.waId || '';
        const station = d.stationName || d.fuelOcr?.data?.location || '';
        return (
          veh.toLowerCase().includes(q) ||
          org.toLowerCase().includes(q) ||
          plate.toLowerCase().includes(q) ||
          driver.toLowerCase().includes(q) ||
          phone.toLowerCase().includes(q) ||
          station.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [items, query, dateFilter, odoFilter, anomalyFilter]);

  // Compute KPI stats across loaded list
  const kpis = useMemo(() => computeReceiptKpis(items), [items]);

  // Selection logic
  const selectableItems = useMemo(() => filtered.filter((d) => d.status === 'READY'), [filtered]);

  const isAllSelected =
    selectableItems.length > 0 && selectableItems.every((d) => selectedIds.has(d._id));
  const isSomeSelected = selectableItems.some((d) => selectedIds.has(d._id)) && !isAllSelected;

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
  const handleSingleApprove = useCallback(
    async (draftId, vehReg, e) => {
      e?.stopPropagation();
      try {
        await apiClient.post(`/api/whatsapp/admin/drafts/${draftId}/publish`);
        toast.success(`Published receipt for ${vehReg} to Fuel Ledger`);
        await fetchData();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to publish receipt');
      }
    },
    [fetchData],
  );

  // Bulk Approve
  const handleBulkApprove = useCallback(async () => {
    if (selectedIds.size === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const res = await apiClient.post('/api/whatsapp/admin/drafts/bulk-publish', { ids });
      const data = res.data?.data || {};
      const { successCount = 0, failureCount = 0, failed = [] } = data;

      if (failureCount === 0) {
        toast.success(
          `Successfully published ${successCount} fuel receipt${successCount === 1 ? '' : 's'}`,
        );
      } else {
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
      toast.error(err.response?.data?.message || 'Error processing bulk approval');
    } finally {
      setBulkBusy(false);
    }
  }, [selectedIds, bulkBusy, clearSelection, fetchData]);

  // Bulk Reject
  const handleBulkReject = useCallback(async () => {
    if (selectedIds.size === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.allSettled(
        ids.map((id) =>
          apiClient.post(`/api/whatsapp/admin/drafts/${id}/reject`, {
            reason: bulkRejectReason.trim() || undefined,
          }),
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
      toast.error(err.response?.data?.message || 'Error processing bulk rejection');
    } finally {
      setBulkBusy(false);
    }
  }, [selectedIds, bulkRejectReason, bulkBusy, clearSelection, fetchData]);

  // Active filters count
  const activeFiltersCount = [
    dateFilter !== 'ALL',
    odoFilter !== 'ALL',
    anomalyFilter !== 'ALL',
    query.trim().length > 0,
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setDateFilter('ALL');
    setOdoFilter('ALL');
    setAnomalyFilter('ALL');
    setQuery('');
  };

  // Drawer index navigation
  const currentDrawerIndex = useMemo(
    () => filtered.findIndex((d) => d._id === activeDrawerId),
    [filtered, activeDrawerId],
  );

  const handlePrevDrawer = () => {
    if (currentDrawerIndex > 0) {
      setActiveDrawerId(filtered[currentDrawerIndex - 1]._id);
    }
  };

  const handleNextDrawer = () => {
    if (currentDrawerIndex >= 0 && currentDrawerIndex < filtered.length - 1) {
      setActiveDrawerId(filtered[currentDrawerIndex + 1]._id);
    }
  };

  return (
    <div className="ra-page">
      {/* ── Top Header & Atmospheric Bar ── */}
      <div className="ra-header">
        <button
          type="button"
          className="ra-header__back"
          onClick={() => navigate(isSuperadminRoute ? '/superadmin' : '/profile')}
        >
          <ArrowLeft size={15} />
          {isSuperadminRoute ? 'Superadmin Portal' : 'Fleet Dashboard'}
        </button>

        <div className="ra-header__top-row">
          <div className="ra-header__bar">
            <div className="ra-header__icon">
              <Fuel size={24} />
            </div>
            <div>
              <div className="ra-header__tagline">
                <Sparkles size={13} />
                <span>AI-Powered Telematics Fuel Audit</span>
              </div>
              <h1 className="ra-header__title">WhatsApp Fuel Approvals</h1>
              <p className="ra-header__subtitle">
                Review driver fuel bills captured over WhatsApp, verify against CAN-bus telematics,
                and publish atomically into the fuel ledger.
              </p>
            </div>
          </div>

          <div className="ra-header__actions">
            {/* Odometer Policy Pill Button */}
            {!isSuperadminRoute && (
              <button
                type="button"
                className="ra-policy-btn"
                onClick={() => setOdoPolicyModalOpen(true)}
                title="Configure Odometer Ingestion & Triple-Check Settings"
              >
                <Gauge size={15} />
                <span className="ra-policy-btn__text">
                  Odometer Mode:{' '}
                  <strong>
                    {ODOMETER_MODES.find((m) => m.key === odoMode)?.label.split(' ')[0]}
                  </strong>
                </span>
                <Sliders size={13} style={{ opacity: 0.6 }} />
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              className={`ra-refresh-btn ${refreshing ? 'is-spinning' : ''}`}
              onClick={() => fetchData(true)}
              disabled={refreshing}
              title="Refresh Receipts"
            >
              <RefreshCw size={15} />
              <span>{refreshing ? 'Syncing…' : 'Sync Live'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Top KPI Stat Cards (Supercrazy Wow Factor) ── */}
      <div className="ra-kpi-grid">
        <div className="ra-kpi-card ra-kpi-card--pending">
          <div className="ra-kpi-card__head">
            <span className="ra-kpi-card__title">Pending Approvals</span>
            <span className="ra-kpi-card__badge-pulse">{kpis.pendingCount} Pending</span>
          </div>
          <div className="ra-kpi-card__val font-mono">{fmtMoney(kpis.pendingAmount)}</div>
          <div className="ra-kpi-card__sub">
            Awaiting manager verification across {kpis.pendingCount} fuel slips
          </div>
        </div>

        <div className="ra-kpi-card">
          <div className="ra-kpi-card__head">
            <span className="ra-kpi-card__title">Total Volume</span>
            <Fuel size={16} className="ra-kpi-card__icon" />
          </div>
          <div className="ra-kpi-card__val font-mono">{fmtLitres(kpis.totalLitres)}</div>
          <div className="ra-kpi-card__sub">Diesel logged across {kpis.totalCount} receipts</div>
        </div>

        <div className="ra-kpi-card">
          <div className="ra-kpi-card__head">
            <span className="ra-kpi-card__title">Total Fuel Billed</span>
            <TrendingUp size={16} className="ra-kpi-card__icon" />
          </div>
          <div className="ra-kpi-card__val font-mono">{fmtMoney(kpis.totalAmount)}</div>
          <div className="ra-kpi-card__sub">
            Average price: <strong>₹{kpis.avgRate}/L</strong> across regional stations
          </div>
        </div>

        <div
          className={`ra-kpi-card ${kpis.missingOdoCount > 0 ? 'ra-kpi-card--alert' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => setOdoFilter(odoFilter === 'MISSING' ? 'ALL' : 'MISSING')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOdoFilter(odoFilter === 'MISSING' ? 'ALL' : 'MISSING');
            }
          }}
          style={{ cursor: 'pointer' }}
          title="Click to toggle missing odometer filter"
        >
          <div className="ra-kpi-card__head">
            <span className="ra-kpi-card__title">Missing Odometer</span>
            <AlertTriangle
              size={16}
              color={kpis.missingOdoCount > 0 ? 'var(--amber-500, #F59E0B)' : 'currentColor'}
            />
          </div>
          <div className="ra-kpi-card__val font-mono">{kpis.missingOdoCount}</div>
          <div className="ra-kpi-card__sub">
            {odoFilter === 'MISSING' ? (
              <span style={{ color: 'var(--amber-500, #F59E0B)' }}>Active Filter Applied ✓</span>
            ) : (
              'Slips without dash photo or telematics reading'
            )}
          </div>
        </div>
      </div>

      {/* ── Advanced Control Bar: Tabs, Filters, Search ── */}
      <div className="ra-toolbar">
        {/* Status Tabs */}
        <div className="ra-tabs">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              className={`ra-tab ${status === t.key ? 'is-active' : ''}`}
              onClick={() => setStatus(t.key)}
            >
              {t.label}
              {t.key !== 'ALL' && counts[t.key] != null && (
                <span className="ra-tab__count">{counts[t.key]}</span>
              )}
            </button>
          ))}
        </div>

        {/* Filter Dropdowns Strip */}
        <div className="ra-filter-strip">
          {/* Date Preset Filter */}
          <div className="ra-select-wrap">
            <Calendar size={14} className="ra-select-icon" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter receipts by date range"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="7DAYS">Last 7 Days</option>
              <option value="30DAYS">Last 30 Days</option>
            </select>
            <ChevronDown size={14} className="ra-select-chevron" />
          </div>

          {/* Odometer Source Filter */}
          <div className="ra-select-wrap">
            <Gauge size={14} className="ra-select-icon" />
            <select
              value={odoFilter}
              onChange={(e) => setOdoFilter(e.target.value)}
              aria-label="Filter receipts by odometer source"
            >
              <option value="ALL">All Odometer</option>
              <option value="TELEMATICS">📡 FleetEdge Auto</option>
              <option value="PHOTO">📸 Dash Photo OCR</option>
              <option value="MISSING">⚠️ Missing Odometer</option>
            </select>
            <ChevronDown size={14} className="ra-select-chevron" />
          </div>

          {/* Anomaly / Quality Filter */}
          <div className="ra-select-wrap">
            <ShieldCheck size={14} className="ra-select-icon" />
            <select
              value={anomalyFilter}
              onChange={(e) => setAnomalyFilter(e.target.value)}
              aria-label="Filter receipts by AI extraction health"
            >
              <option value="ALL">All AI Health</option>
              <option value="MATH_VERIFIED">✓ Math Verified</option>
              <option value="NEEDS_REVIEW">⚠️ Needs Review</option>
            </select>
            <ChevronDown size={14} className="ra-select-chevron" />
          </div>

          {/* Reset Filters if active */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="ra-clear-filters-btn"
              onClick={resetAllFilters}
              title="Reset all search and filters"
            >
              <X size={13} />
              Reset ({activeFiltersCount})
            </button>
          )}

          {/* Search Box */}
          <div className="ra-search">
            <span className="ra-search__icon">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Search vehicle, driver, station, plate…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search receipts by vehicle, driver, station, or plate"
            />
            {query && (
              <button
                type="button"
                className="ra-search__clear"
                onClick={() => setQuery('')}
                title="Clear query"
                aria-label="Clear search input"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="ra-alert ra-alert--error" role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Receipts Table ── */}
      <div className="ra-card">
        <div className="ra-table-wrap">
          <table className="ra-table">
            <thead>
              <tr>
                <th className="ra-table__th-select">
                  <input
                    type="checkbox"
                    className="ra-checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={toggleSelectAll}
                    disabled={selectableItems.length === 0}
                    aria-label="Select all ready receipts"
                  />
                </th>
                <th>Slip</th>
                <th>Vehicle & Plate</th>
                <th>Driver / Submitter</th>
                <th>Fuel Station</th>
                <th className="ra-right">Litres</th>
                <th className="ra-right">Amount</th>
                <th className="ra-center">Odometer</th>
                <th className="ra-center">AI Extraction</th>
                <th className="ra-center">Status</th>
                <th>Received</th>
                <th className="ra-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={12}>
                    <div className="ra-state" style={{ padding: '60px 0' }}>
                      <div className="ra-spinner" />
                      <div className="ra-state__title" style={{ marginTop: 14 }}>
                        Loading WhatsApp fuel drafts…
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={12}>
                    <div className="ra-state" style={{ padding: '50px 0' }}>
                      <div className="ra-state__icon">
                        <Inbox size={26} />
                      </div>
                      <div className="ra-state__title">No receipts found</div>
                      <div
                        style={{ color: 'var(--muted-foreground)', fontSize: '13px', marginTop: 4 }}
                      >
                        {activeFiltersCount > 0
                          ? 'No receipts matched your active filters. Try clearing some filters.'
                          : status === 'READY'
                            ? 'All caught up! No fuel bills waiting for review.'
                            : 'No fuel bills in this tab.'}
                      </div>
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          className="ra-btn ra-btn--ghost"
                          style={{ marginTop: 14 }}
                          onClick={resetAllFilters}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((d) => {
                  const veh = d.vehicleId?.registrationNumber || d.vehicleReg || '—';
                  const isSelected = selectedIds.has(d._id);
                  const canSelect = d.status === 'READY';
                  const ocr = evaluateOcrQuality(d);
                  const odo = getOdometerMeta(d);
                  const driverName =
                    [d.userId?.firstName, d.userId?.lastName].filter(Boolean).join(' ') ||
                    d.phoneE164 ||
                    'Driver';
                  const stationName = d.stationName || d.fuelOcr?.data?.location || 'Highway Pump';

                  return (
                    <tr
                      key={d._id}
                      className={`ra-clickable ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setActiveDrawerId(d._id)}
                    >
                      {/* Checkbox */}
                      <td className="ra-table__td-select" onClick={(e) => e.stopPropagation()}>
                        {canSelect ? (
                          <input
                            type="checkbox"
                            className="ra-checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelectOne(d._id, e)}
                            aria-label={`Select receipt for ${veh}`}
                          />
                        ) : (
                          <span className="ra-checkbox-placeholder" />
                        )}
                      </td>

                      {/* Slip Thumbnail / Icon */}
                      <td
                        className="ra-table__td-slip"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (d.fuelImageUrl) {
                            setPreviewImage({ url: d.fuelImageUrl, title: `Fuel Slip · ${veh}` });
                          } else {
                            setActiveDrawerId(d._id);
                          }
                        }}
                      >
                        <div className="ra-slip-thumbnail" title="Click to preview slip">
                          <Receipt size={16} />
                          <span className="ra-slip-badge">BILL</span>
                        </div>
                      </td>

                      {/* Vehicle & Plate */}
                      <td>
                        <div className="ra-veh-cell">
                          <span className="ra-veh">
                            <span className="ra-veh__avatar">
                              <Truck size={15} />
                            </span>
                            <strong>{veh}</strong>
                          </span>
                          {d.plateText && (
                            <span
                              className="ra-plate-ocr-pill font-mono"
                              title="OCR Detected Plate"
                            >
                              {d.plateText}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Driver / Submitter */}
                      <td>
                        <div className="ra-driver-cell">
                          <span className="ra-driver-name">{driverName}</span>
                          <span className="ra-driver-phone font-mono">
                            <Phone size={11} style={{ marginRight: 3, display: 'inline' }} />
                            {d.phoneE164 || d.waId || 'WhatsApp'}
                          </span>
                        </div>
                      </td>

                      {/* Fuel Station */}
                      <td>
                        <div className="ra-station-cell" title={stationName}>
                          <span className="ra-station-name">{stationName}</span>
                          <span className="ra-station-mode">{d.fuelType || 'DIESEL'}</span>
                        </div>
                      </td>

                      {/* Litres */}
                      <td className="ra-right ra-strong font-mono">{fmtLitres(d.litres)}</td>

                      {/* Amount */}
                      <td
                        className="ra-right ra-strong font-mono"
                        style={{ color: 'var(--foreground)' }}
                      >
                        {fmtMoney(d.amount)}
                      </td>

                      {/* Odometer */}
                      <td className="ra-center">
                        <div className="ra-odo-cell">
                          <span
                            className={`ra-odo-val font-mono ${
                              odo.isMissing ? 'ra-odo-val--missing' : ''
                            }`}
                          >
                            {odo.displayReading}
                          </span>
                          <span className={`ra-odo-badge ${odo.badgeClass}`}>{odo.badgeText}</span>
                        </div>
                      </td>

                      {/* AI Extraction Confidence */}
                      <td className="ra-center">
                        <div className="ra-ocr-cell">
                          <span className={`ra-ocr-tag ra-ocr-tag--${ocr.level}`}>
                            <ShieldCheck size={12} />
                            {ocr.score}%
                          </span>
                          <span className="ra-ocr-label">{ocr.label}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="ra-center">
                        <span
                          className={`ra-badge ${STATUS_BADGE[d.status] || 'ra-badge--cleared'}`}
                        >
                          <span className="ra-badge__dot" />
                          {d.status}
                        </span>
                      </td>

                      {/* Received Timestamp */}
                      <td className="ra-muted" style={{ fontSize: '12px' }}>
                        <div>{fmtDate(d.createdAt)}</div>
                        <div style={{ fontSize: '11px', opacity: 0.75 }}>
                          {fmtRelativeTime(d.createdAt)}
                        </div>
                      </td>

                      {/* Row Actions */}
                      <td className="ra-center" onClick={(e) => e.stopPropagation()}>
                        <div className="ra-row-actions">
                          {d.status === 'READY' && (
                            <button
                              type="button"
                              className="ra-action-icon-btn ra-action-icon-btn--approve"
                              onClick={(e) => handleSingleApprove(d._id, veh, e)}
                              title="Quick Approve to Fuel Ledger"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            className="ra-action-icon-btn"
                            onClick={() => setActiveDrawerId(d._id)}
                            title="Open Review Drawer"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Floating Bulk Action Bar (Both Approve and Reject) ── */}
      {selectedIds.size > 0 && (
        <div className="ra-bulk-bar">
          <div className="ra-bulk-bar__content">
            <div className="ra-bulk-bar__left">
              <span className="ra-bulk-bar__badge">
                <Check size={14} />
                {selectedIds.size} Selected
              </span>
              <div className="ra-bulk-bar__divider" />
              <span className="ra-bulk-bar__stat">
                <span className="ra-bulk-bar__stat-label">Total Litres:</span>
                <span className="ra-bulk-bar__stat-val">{fmtLitres(totalSelectedLitres)}</span>
              </span>
              <div className="ra-bulk-bar__divider" />
              <span className="ra-bulk-bar__stat">
                <span className="ra-bulk-bar__stat-label">Total Amount:</span>
                <span className="ra-bulk-bar__stat-val">{fmtMoney(totalSelectedAmount)}</span>
              </span>
            </div>

            <div className="ra-bulk-bar__actions">
              <button
                type="button"
                className="ra-bulk-btn ra-bulk-btn--ghost"
                onClick={clearSelection}
                disabled={bulkBusy}
              >
                Cancel
              </button>

              <button
                type="button"
                className="ra-bulk-btn ra-bulk-btn--reject"
                onClick={() => setShowBulkRejectModal(true)}
                disabled={bulkBusy}
              >
                <XCircle size={15} />
                Reject {selectedIds.size}
              </button>

              <button
                type="button"
                className="ra-bulk-btn ra-bulk-btn--primary"
                onClick={() => setShowBulkApproveModal(true)}
                disabled={bulkBusy}
              >
                <CheckCircle2 size={16} />
                Approve {selectedIds.size} {selectedIds.size === 1 ? 'Receipt' : 'Receipts'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Approve Modal ── */}
      {showBulkApproveModal && (
        <div
          className="ra-modal-overlay"
          onClick={() => !bulkBusy && setShowBulkApproveModal(false)}
        >
          <div className="ra-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ra-modal__head">Bulk Publish to Fuel Ledger</div>
            <div className="ra-modal__body">
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--foreground)' }}>
                Are you sure you want to approve and publish <strong>{selectedIds.size}</strong>{' '}
                fuel receipt{selectedIds.size === 1 ? '' : 's'} into the official fleet fuel ledger?
              </p>
              <div className="ra-bulk-summary-box">
                <div className="ra-bulk-summary-row">
                  <span>Selected Receipts:</span>
                  <strong>{selectedIds.size}</strong>
                </div>
                <div className="ra-bulk-summary-row">
                  <span>Total Diesel Volume:</span>
                  <strong className="font-mono">{fmtLitres(totalSelectedLitres)}</strong>
                </div>
                <div className="ra-bulk-summary-row">
                  <span>Total Bill Amount:</span>
                  <strong className="font-mono">{fmtMoney(totalSelectedAmount)}</strong>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)' }}>
                A TripFuelLog entry will be created atomically for each vehicle.
              </p>
            </div>
            <div className="ra-modal__foot">
              <button
                type="button"
                className="ra-btn ra-btn--ghost"
                onClick={() => setShowBulkApproveModal(false)}
                disabled={bulkBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ra-btn ra-btn--publish"
                onClick={handleBulkApprove}
                disabled={bulkBusy}
              >
                {bulkBusy ? 'Publishing…' : `Confirm & Publish (${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Reject Modal (solves "no reject button only approve") ── */}
      {showBulkRejectModal && (
        <div
          className="ra-modal-overlay"
          onClick={() => !bulkBusy && setShowBulkRejectModal(false)}
        >
          <div className="ra-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ra-modal__head" style={{ color: 'var(--rose-500, #EF4444)' }}>
              Bulk Reject Fuel Receipts
            </div>
            <div className="ra-modal__body">
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--foreground)' }}>
                Are you sure you want to reject <strong>{selectedIds.size}</strong> fuel receipt
                {selectedIds.size === 1 ? '' : 's'}?
              </p>
              <div className="ra-bulk-summary-box" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
                <div className="ra-bulk-summary-row">
                  <span>Receipts to Reject:</span>
                  <strong>{selectedIds.size}</strong>
                </div>
                <div className="ra-bulk-summary-row">
                  <span>Total Value:</span>
                  <strong className="font-mono">{fmtMoney(totalSelectedAmount)}</strong>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label
                  htmlFor="bulk-reject-reason-input"
                  className="ra-field__label"
                  style={{ marginBottom: 6, display: 'block' }}
                >
                  Rejection Reason (Recorded in audit trail):
                </label>
                <textarea
                  id="bulk-reject-reason-input"
                  rows={2}
                  className="ra-modal__textarea"
                  value={bulkRejectReason}
                  onChange={(e) => setBulkRejectReason(e.target.value)}
                  placeholder="e.g. Unclear pump slips, duplicate entry, rate discrepancy…"
                  aria-label="Rejection reason for bulk reject"
                />
              </div>
            </div>
            <div className="ra-modal__foot">
              <button
                type="button"
                className="ra-btn ra-btn--ghost"
                onClick={() => setShowBulkRejectModal(false)}
                disabled={bulkBusy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ra-btn ra-btn--reject"
                onClick={handleBulkReject}
                disabled={bulkBusy}
              >
                {bulkBusy ? 'Rejecting…' : `Confirm Rejection (${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Odometer Policy & Triple-Check Hub Modal ── */}
      {odoPolicyModalOpen && (
        <div
          className="ra-modal-overlay"
          onClick={() => !savingPolicy && setOdoPolicyModalOpen(false)}
        >
          <div className="ra-modal ra-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="ra-modal__head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Gauge size={18} color="var(--primary-color)" />
                <span>Odometer Capture & Triple-Check Policy</span>
              </div>
              <button
                type="button"
                className="ra-modal__close-btn"
                onClick={() => setOdoPolicyModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ra-modal__body">
              <p
                style={{ margin: '0 0 14px 0', fontSize: '13px', color: 'var(--muted-foreground)' }}
              >
                Choose how the WhatsApp assistant captures odometer readings for your fleet. This
                governs the <strong>3-tier cross-verification system</strong> across Driver OCR,
                FleetEdge Telematics, and Physical Ledger entries.
              </p>

              <div className="ra-policy-cards">
                {ODOMETER_MODES.map((m) => (
                  <div
                    key={m.key}
                    className={`ra-policy-card ${odoMode === m.key ? 'is-selected' : ''}`}
                    onClick={() => canEditPolicy && changeOdoMode(m.key)}
                  >
                    <div className="ra-policy-card__radio">
                      <div className={`ra-radio-dot ${odoMode === m.key ? 'is-checked' : ''}`} />
                    </div>
                    <div className="ra-policy-card__content">
                      <div className="ra-policy-card__title">
                        {m.icon}
                        <span>{m.label}</span>
                      </div>
                      <p className="ra-policy-card__desc">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ra-policy-footer-note">
                <SlidersHorizontal size={14} />
                <span>
                  To configure company-wide automatic thresholds, trip deviation limits, and OCR
                  tolerances, visit{' '}
                  <strong
                    style={{ cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      setOdoPolicyModalOpen(false);
                      navigate('/settings');
                    }}
                  >
                    Settings &gt; Telematics Integration
                  </strong>
                  .
                </span>
              </div>
            </div>
            <div className="ra-modal__foot">
              <button
                type="button"
                className="ra-btn ra-btn--ghost"
                onClick={() => setOdoPolicyModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slideover Quick Review Drawer ── */}
      <ReceiptApprovalDrawer
        draftId={activeDrawerId}
        isOpen={Boolean(activeDrawerId)}
        onClose={() => setActiveDrawerId(null)}
        onUpdated={() => fetchData(true)}
        onPrev={handlePrevDrawer}
        onNext={handleNextDrawer}
        hasPrev={currentDrawerIndex > 0}
        hasNext={currentDrawerIndex >= 0 && currentDrawerIndex < filtered.length - 1}
        basePath={basePath}
        navigate={navigate}
      />

      {/* ── High-Res Image Preview Modal ── */}
      {previewImage && (
        <ImagePreviewModal
          imageSrc={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};

export default ReceiptApprovalPage;
