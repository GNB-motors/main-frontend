import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Search,
  Inbox,
  Truck,
  ChevronRight,
  Gauge,
  MessageSquare,
  Radio,
  PencilLine,
  ArrowLeft,
  Check,
  CheckCircle2,
} from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';
import { useFeatureFlags } from '../../../contexts/FeatureFlagsContext';
import './ReceiptApproval.css';

const ODOMETER_MODES = [
  {
    key: 'INTERACTIVE',
    label: 'Ask driver',
    icon: <MessageSquare size={15} />,
    hint: 'The bot asks for the odometer — photo, typed reading, or FleetEdge.',
  },
  {
    key: 'FLEETEDGE',
    label: 'Auto FleetEdge',
    icon: <Radio size={15} />,
    hint: 'Pull the latest telematics reading; fall back to asking if none.',
  },
  {
    key: 'MANUAL',
    label: 'Manual only',
    icon: <PencilLine size={15} />,
    hint: 'Only a photo or typed reading — never offer FleetEdge.',
  },
];

/* Per-org odometer capture mode — inline control for owners/managers on the
   org WhatsApp Approvals page. Hidden on the cross-org superadmin route. */
const OdometerModeControl = () => {
  const { organization } = useFeatureFlags();
  const [mode, setMode] = useState(
    organization?.whatsappSettings?.odometerMode || 'INTERACTIVE',
  );
  const [saving, setSaving] = useState(false);

  const userRole = (localStorage.getItem('user_role') || '').toUpperCase();
  const canEdit = ['OWNER', 'MANAGER'].includes(userRole);

  useEffect(() => {
    let alive = true;
    apiClient
      .get('/api/whatsapp/settings')
      .then((res) => {
        if (alive && res.data?.data?.odometerMode) setMode(res.data.data.odometerMode);
      })
      .catch(() => {}); // keep the default; PATCH will surface any real error
    return () => {
      alive = false;
    };
  }, []);

  const change = useCallback(
    async (next) => {
      if (next === mode || saving) return;
      const prev = mode;
      setMode(next);
      setSaving(true);
      try {
        await apiClient.patch('/api/whatsapp/settings', { odometerMode: next });
        toast.success('Odometer capture mode updated');
      } catch (err) {
        setMode(prev);
        toast.error(err.response?.data?.message || 'Failed to update');
      } finally {
        setSaving(false);
      }
    },
    [mode, saving],
  );

  const activeHint = ODOMETER_MODES.find((o) => o.key === mode)?.hint;

  return (
    <div className="ra-odo">
      <div className="ra-odo__head">
        <span className="ra-odo__title">
          <Gauge size={16} /> Odometer capture
        </span>
        <span className="ra-odo__hint">{activeHint}</span>
      </div>
      <div className="ra-odo__seg" role="group" aria-label="Odometer capture mode">
        {ODOMETER_MODES.map((o) => (
          <button
            key={o.key}
            type="button"
            disabled={!canEdit || saving}
            aria-pressed={mode === o.key}
            className={`ra-odo__btn ${mode === o.key ? 'is-active' : ''}`}
            onClick={() => change(o.key)}
            title={o.hint}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
};

/* Inbox for WhatsApp fuel-bill drafts captured over WhatsApp.
   Lists drafts by status; clicking a row opens the review/approve detail. */

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

const fmtMoney = (n) =>
  n == null ? '—' : `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const fmtLitres = (n) => (n == null ? '—' : `${Number(n).toLocaleString('en-IN')} L`);

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const ReceiptApprovalPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperadminRoute = location.pathname.startsWith('/superadmin');
  const basePath = isSuperadminRoute ? '/superadmin/receipts' : '/whatsapp-approvals';

  const [status, setStatus] = useState('READY');
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showBulkConfirmModal, setShowBulkConfirmModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
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
    }
  }, [status]);

  useEffect(() => {
    fetchData();
    setSelectedIds(new Set());
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => {
      const veh = d.vehicleId?.registrationNumber || d.vehicleReg || '';
      const org = d.orgId?.companyName || '';
      const plate = d.plateText || '';
      return (
        veh.toLowerCase().includes(q) ||
        org.toLowerCase().includes(q) ||
        plate.toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  // Only READY drafts can be approved
  const selectableItems = useMemo(
    () => filtered.filter((d) => d.status === 'READY'),
    [filtered],
  );

  const isAllSelected =
    selectableItems.length > 0 &&
    selectableItems.every((d) => selectedIds.has(d._id));

  const isSomeSelected =
    selectableItems.some((d) => selectedIds.has(d._id)) && !isAllSelected;

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
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelectableIds = selectableItems.map((d) => d._id);
      const allSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => prev.has(id));
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
        // Collect distinct error messages from failed drafts
        const failureMessages = Array.from(
          new Set(failed.map((f) => f.message).filter(Boolean)),
        );

        if (successCount > 0) {
          toast.success(
            `Published ${successCount} fuel receipt${successCount === 1 ? '' : 's'}`,
          );
        }

        if (failureMessages.length > 0) {
          failureMessages.forEach((msg) => {
            toast.error(msg);
          });
        } else {
          toast.error(
            failureCount === 1
              ? '1 receipt failed to publish'
              : `${failureCount} receipts failed to publish`,
          );
        }
      }

      setShowBulkConfirmModal(false);
      clearSelection();
      await fetchData();
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || 'Error processing bulk approval';
      toast.error(msg);
    } finally {
      setBulkBusy(false);
    }
  }, [selectedIds, bulkBusy, clearSelection, fetchData]);

  return (
    <div className="ra-page">
      <div className="ra-header">
        <button
          type="button"
          className="ra-header__back"
          onClick={() => navigate(isSuperadminRoute ? '/superadmin' : '/overview')}
        >
          <ArrowLeft size={15} />
          {isSuperadminRoute ? 'Dashboard' : 'Fleet Operations'}
        </button>
        <div className="ra-header__bar">
          <div className="ra-header__icon">
            <MessageSquare size={22} />
          </div>
          <div>
            <h1 className="ra-header__title">WhatsApp Fuel Approvals</h1>
            <p className="ra-header__subtitle">
              Review fuel bills captured over WhatsApp and publish them into the fuel ledger.
            </p>
          </div>
        </div>
      </div>

      {!isSuperadminRoute && <OdometerModeControl />}

      <div className="ra-toolbar">
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

        <div className="ra-search">
          <span className="ra-search__icon">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search vehicle, org, plate"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="ra-alert ra-alert--error" role="alert">
          {error}
        </div>
      )}

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
                <th>Vehicle</th>
                <th>Organization</th>
                <th className="ra-right">Litres</th>
                <th className="ra-right">Amount</th>
                <th className="ra-center">Odometer</th>
                <th className="ra-center">Status</th>
                <th>Received</th>
                <th aria-label="Open" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9}>
                    <div className="ra-state">
                      <div className="ra-spinner" />
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="ra-state">
                      <div className="ra-state__icon">
                        <Inbox size={22} />
                      </div>
                      <div className="ra-state__title">No receipts here</div>
                      <div>
                        {status === 'READY'
                          ? 'No fuel bills are waiting for review.'
                          : 'Nothing to show for this filter.'}
                      </div>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filtered.map((d) => {
                  const veh = d.vehicleId?.registrationNumber || d.vehicleReg || '—';
                  const isSelected = selectedIds.has(d._id);
                  const canSelect = d.status === 'READY';
                  return (
                    <tr
                      key={d._id}
                      className={`ra-clickable ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => navigate(`${basePath}/${d._id}`)}
                    >
                      <td
                        className="ra-table__td-select"
                        onClick={(e) => e.stopPropagation()}
                      >
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
                      <td>
                        <span className="ra-veh">
                          <span className="ra-veh__avatar">
                            <Truck size={16} />
                          </span>
                          {veh}
                        </span>
                      </td>
                      <td className="ra-muted">{d.orgId?.companyName || '—'}</td>
                      <td className="ra-right ra-strong">{fmtLitres(d.litres)}</td>
                      <td className="ra-right ra-strong">{fmtMoney(d.amount)}</td>
                      <td className="ra-center ra-muted">
                        {d.odometerReading != null ? d.odometerReading.toLocaleString('en-IN') : '—'}
                      </td>
                      <td className="ra-center">
                        <span className={`ra-badge ${STATUS_BADGE[d.status] || 'ra-badge--cleared'}`}>
                          <span className="ra-badge__dot" />
                          {d.status}
                        </span>
                      </td>
                      <td className="ra-muted">{fmtDate(d.createdAt)}</td>
                      <td className="ra-right">
                        <span className="ra-chevron">
                          <ChevronRight size={18} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating bulk action bar */}
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
                className="ra-bulk-btn ra-bulk-btn--primary"
                onClick={() => setShowBulkConfirmModal(true)}
                disabled={bulkBusy}
              >
                <CheckCircle2 size={16} />
                Approve {selectedIds.size} {selectedIds.size === 1 ? 'Receipt' : 'Receipts'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showBulkConfirmModal && (
        <div
          className="ra-modal-overlay"
          onClick={() => !bulkBusy && setShowBulkConfirmModal(false)}
        >
          <div className="ra-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ra-modal__head">
              Bulk Approve Receipts
            </div>
            <div className="ra-modal__body">
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--foreground)' }}>
                Are you sure you want to approve and publish <strong>{selectedIds.size}</strong> fuel receipt{selectedIds.size === 1 ? '' : 's'} to the fuel ledger?
              </p>
              <div className="ra-bulk-summary-box">
                <div className="ra-bulk-summary-row">
                  <span>Selected Receipts:</span>
                  <strong>{selectedIds.size}</strong>
                </div>
                <div className="ra-bulk-summary-row">
                  <span>Total Fuel Quantity:</span>
                  <strong>{fmtLitres(totalSelectedLitres)}</strong>
                </div>
                <div className="ra-bulk-summary-row">
                  <span>Total Amount:</span>
                  <strong>{fmtMoney(totalSelectedAmount)}</strong>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--muted-foreground)' }}>
                Fuel log entries will be created atomically for each approved receipt.
              </p>
            </div>
            <div className="ra-modal__foot">
              <button
                type="button"
                className="ra-btn ra-btn--ghost"
                onClick={() => setShowBulkConfirmModal(false)}
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
    </div>
  );
};

export default ReceiptApprovalPage;
