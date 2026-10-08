import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Check, X } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import { useApi } from '../../hooks/useApi';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { FieldAgentFuelService } from '../FieldAgentFuel/FieldAgentFuelService';
import { agentName, fmtMoney, fmtNum } from '../FieldAgentFuel/fieldAgentFuelLogUtils';
import ImagePreviewModal from '../Trip/components/ImagePreviewModal';

const PAGE_SIZE = 50;

const STATUS_TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

const decidedBy = (user, at) =>
  [user ? agentName(user) : null, at ? formatDateTimeIST(at) : null].filter(Boolean).join(' · ');

/**
 * Field agents' fuel uploads, waiting for an owner/manager. Approving marks the log as
 * checked; rejecting takes it out of the fuel ledger (the record stays under Rejected).
 */
export default function FieldAgentApprovals({ onCounts }) {
  const [status, setStatus] = useState('PENDING');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [rejectIds, setRejectIds] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  const { data, loading, error, refetch } = useApi(
    async (signal) => {
      const [list, counts] = await Promise.all([
        FieldAgentFuelService.approvalList({ status, page, limit: PAGE_SIZE }, { signal }),
        FieldAgentFuelService.approvalCounts({ signal }),
      ]);
      return { list, counts };
    },
    [status, page],
  );

  const rows = data?.list?.data ?? [];
  const total = data?.list?.meta?.total ?? 0;
  const totalPages = data?.list?.meta?.totalPages ?? 1;
  const counts = data?.counts;

  useEffect(() => {
    if (counts) onCounts?.(counts);
  }, [counts, onCounts]);

  const changeStatus = (key) => {
    setStatus(key);
    setPage(1);
    setSelected(new Set());
  };

  const done = (message) => {
    toast.success(message);
    setSelected(new Set());
    refetch();
  };

  const approve = async (ids) => {
    setBusy(true);
    try {
      const res = await FieldAgentFuelService.approve(ids);
      done(`${res?.approved ?? ids.length} upload${ids.length === 1 ? '' : 's'} approved`);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not approve');
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async () => {
    setBusy(true);
    try {
      const res = await FieldAgentFuelService.reject(rejectIds, reason.trim());
      setRejectIds(null);
      setReason('');
      done(
        `${res?.rejected ?? rejectIds.length} upload${rejectIds.length === 1 ? '' : 's'} rejected`,
      );
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not reject');
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'refuelTime', label: 'Date', render: (r) => formatDateTimeIST(r.refuelTime) },
    {
      key: 'vehicle',
      label: 'Vehicle',
      render: (r) => <span className="font-mono">{r.vehicleId?.registrationNumber || '-'}</span>,
    },
    { key: 'agent', label: 'Field agent', render: (r) => agentName(r.loggedBy) },
    { key: 'litres', label: 'Litres', align: 'right', render: (r) => fmtNum(r.litres) },
    { key: 'amount', label: 'Amount', align: 'right', render: (r) => fmtMoney(r.totalAmount) },
    {
      key: 'odometer',
      label: 'Odometer',
      align: 'right',
      render: (r) => (r.odometerReading != null ? fmtNum(r.odometerReading, 0) : '-'),
    },
    { key: 'location', label: 'Location', render: (r) => r.location || '-' },
    {
      key: 'ocr',
      label: 'Bill reading',
      render: (r) =>
        r.reviewStatus === 'NEEDS_REVIEW' ? (
          <span className="apv-chip apv-chip--warn" title={(r.reviewReasons || []).join(', ')}>
            Check the bill
          </span>
        ) : (
          <span className="apv-chip">Read OK</span>
        ),
    },
    {
      key: 'photos',
      label: 'Photos',
      render: (r) => (
        <span className="apv-photos">
          {r.fuelSlipUrl ? (
            <button
              type="button"
              className="apv-link"
              onClick={() => setPreview({ url: r.fuelSlipUrl, title: 'Fuel bill' })}
            >
              Bill
            </button>
          ) : null}
          {r.odometerUrl ? (
            <button
              type="button"
              className="apv-link"
              onClick={() => setPreview({ url: r.odometerUrl, title: 'Odometer' })}
            >
              Odometer
            </button>
          ) : null}
          {!r.fuelSlipUrl && !r.odometerUrl ? '-' : null}
        </span>
      ),
    },
  ];

  if (status === 'PENDING') {
    columns.push({
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <span className="apv-row-actions">
          <button
            type="button"
            className="apv-row-btn apv-row-btn--reject"
            disabled={busy}
            onClick={() => setRejectIds([r._id])}
          >
            <X size={14} /> Reject
          </button>
          <button
            type="button"
            className="apv-row-btn apv-row-btn--approve"
            disabled={busy}
            onClick={() => approve([r._id])}
          >
            <Check size={14} /> Approve
          </button>
        </span>
      ),
    });
  } else if (status === 'APPROVED') {
    columns.push({
      key: 'approved',
      label: 'Approved',
      render: (r) => decidedBy(r.approvedBy, r.approvedAt) || '-',
    });
  } else {
    columns.push({
      key: 'rejected',
      label: 'Rejected',
      render: (r) => (
        <span className="apv-decision">
          <span>{decidedBy(r.rejection?.rejectedBy, r.rejection?.rejectedAt) || '-'}</span>
          {r.rejection?.reason ? (
            <span className="apv-decision__reason">{r.rejection.reason}</span>
          ) : null}
        </span>
      ),
    });
  }

  const pagination =
    totalPages > 1 ? (
      <div className="apv-pager">
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="ra-btn ra-btn--ghost"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <button
          type="button"
          className="ra-btn ra-btn--ghost"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    ) : null;

  const selectedIds = [...selected];

  return (
    <div className="apv-section">
      <div className="ra-toolbar">
        <div className="ra-tabs">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`ra-tab ${status === t.key ? 'is-active' : ''}`}
              onClick={() => changeStatus(t.key)}
            >
              {t.label}
              {counts?.[t.key] != null ? (
                <span className="ra-tab__count">{counts[t.key]}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r._id}
        loading={loading}
        error={error}
        onRetry={refetch}
        showing={rows.length}
        total={total}
        pagination={pagination}
        selectable={status === 'PENDING'}
        selectedKeys={selected}
        onSelectionChange={setSelected}
        emptyTitle={
          status === 'PENDING' ? 'Nothing waiting for approval' : 'No uploads in this view'
        }
        emptyHint={
          status === 'PENDING'
            ? 'Fuel bills uploaded by field agents show up here until you approve or reject them.'
            : null
        }
      />

      {status === 'PENDING' && selectedIds.length > 0 ? (
        <div className="ra-bulk-bar">
          <div className="ra-bulk-bar__content">
            <div className="ra-bulk-bar__left">
              <span className="ra-bulk-bar__badge">
                <Check size={14} />
                {selectedIds.length} Selected
              </span>
            </div>
            <div className="ra-bulk-bar__actions">
              <button
                type="button"
                className="ra-bulk-btn ra-bulk-btn--ghost"
                onClick={() => setSelected(new Set())}
                disabled={busy}
              >
                Clear
              </button>
              <button
                type="button"
                className="ra-bulk-btn ra-bulk-btn--reject"
                onClick={() => setRejectIds(selectedIds)}
                disabled={busy}
              >
                Reject
              </button>
              <button
                type="button"
                className="ra-bulk-btn ra-bulk-btn--primary"
                onClick={() => approve(selectedIds)}
                disabled={busy}
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectIds ? (
        <div
          className="ra-modal-overlay"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && !busy && setRejectIds(null)}
          onKeyDown={(e) => e.key === 'Escape' && !busy && setRejectIds(null)}
        >
          <div
            className="ra-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fa-reject-title"
          >
            <div
              id="fa-reject-title"
              className="ra-modal__head"
              style={{ color: 'var(--rose-500, #EF4444)' }}
            >
              Reject {rejectIds.length} field agent upload{rejectIds.length === 1 ? '' : 's'}
            </div>
            <div className="ra-modal__body">
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--foreground)' }}>
                {rejectIds.length === 1 ? 'This fuel log is' : 'These fuel logs are'} taken out of
                the fuel ledger and mileage. You can still see{' '}
                {rejectIds.length === 1 ? 'it' : 'them'} under Rejected.
              </p>
              <div style={{ marginTop: 12 }}>
                <label
                  htmlFor="fa-reject-reason"
                  className="ra-field__label"
                  style={{ marginBottom: 6, display: 'block' }}
                >
                  Reason (optional)
                </label>
                <textarea
                  id="fa-reject-reason"
                  rows={2}
                  className="ra-modal__textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Unclear bill, duplicate entry, wrong vehicle…"
                  aria-label="Reason for rejecting"
                />
              </div>
            </div>
            <div className="ra-modal__foot">
              <button
                type="button"
                className="ra-btn ra-btn--ghost"
                onClick={() => setRejectIds(null)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ra-btn ra-btn--reject"
                onClick={confirmReject}
                disabled={busy}
              >
                {busy ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {preview ? (
        <ImagePreviewModal
          imageSrc={preview.url}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </div>
  );
}
