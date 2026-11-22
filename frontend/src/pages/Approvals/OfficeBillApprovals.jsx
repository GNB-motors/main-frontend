import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AlertTriangle, Ban, FileCheck2, Inbox, RotateCw } from 'lucide-react';
import billPhotoService from '../../services/billPhotoService';
import { MileageApi } from '../Mileage/mileageApi';
import OfficeBillRow from './office/OfficeBillRow';
import OfficeBillDrawer from './office/OfficeBillDrawer';
import { HistoryDrawer } from './OfficeBillDetails';

const uploaderRole = 'OWNER,MANAGER';
// The bills owners and managers upload: their own queue, not the WhatsApp one.
const source = 'office';
const PAGE_SIZE = 50;
const STATUS_TABS = [
  ['pending', 'Pending'],
  ['submitted', 'Confirmed'],
  ['rejected', 'Rejected'],
];
const EMPTY = {
  pending: {
    title: 'No bills waiting.',
    hint: 'Fuel bills that owners and managers upload show up here until you confirm the truck.',
  },
  submitted: {
    title: 'No confirmed bills.',
    hint: 'Bills you confirm move here, with who confirmed them and when.',
  },
  rejected: {
    title: 'No rejected bills.',
    hint: 'Bills you reject move here, with who rejected them and why.',
  },
};
const plural = (n) => `${n} bill${n === 1 ? '' : 's'}`;

export default function OfficeBillApprovals({ onCount }) {
  const [tab, setTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [counts, setCounts] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesError, setVehiclesError] = useState(null);
  const [vehicleRevision, setVehicleRevision] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState(null);
  const [active, setActive] = useState(null);
  const [rejectIds, setRejectIds] = useState(null);
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  const refreshVehicles = useCallback(() => setVehicleRevision((n) => n + 1), []);
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    setVehiclesError(null);
    MileageApi.vehicles(controller.signal)
      .then((v) => {
        if (live) setVehicles(Array.isArray(v) ? v : []);
      })
      .catch(() => {
        // The queue still works without the fleet list; only the truck picker
        // needs it, and it can be filled in by hand. Say so, and offer a retry:
        // an empty picker must never look like an empty fleet.
        if (live) setVehiclesError('The truck list could not be loaded.');
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [vehicleRevision]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    billPhotoService
      .listBillCaptures({
        status: tab,
        uploaderRole,
        source,
        page,
        limit: PAGE_SIZE,
        signal: controller.signal,
      })
      .then((current) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(current?.captures)) throw new Error('Invalid response');
        setData(current);
        // The server counts every status in the same read.
        const next = current.counts || { [tab]: current.total };
        setCounts(next);
        if (next.pending != null) onCount?.(next.pending);
        setLoading(false);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        setLoading(false);
        setError(
          (e?.status ?? e?.response?.status) === 404
            ? 'Office bills are unavailable right now.'
            : 'Could not load bills. Try again.',
        );
      });
    return () => controller.abort();
  }, [tab, page, revision, onCount]);
  const closeReject = () => {
    if (rejecting) return;
    setRejectIds(null);
    setReason('');
  };
  const confirmReject = async () => {
    setRejecting(true);
    try {
      const answer = await billPhotoService.rejectBillCaptures(rejectIds, reason.trim());
      const left = (answer?.results || []).filter((result) => result.status !== 'rejected');
      if (answer?.rejected) toast.success(`${plural(answer.rejected)} rejected`);
      if (left.length) toast.info(`${plural(left.length)} not rejected: ${left[0].reason}`);
      setRejectIds(null);
      setReason('');
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not reject. Try again.');
    } finally {
      setRejecting(false);
    }
  };
  return (
    <div className="apv-section">
      <div className="apv-queue-note">
        <p className="apv-queue-note__title">Owner &amp; manager bill photos</p>
        <p className="apv-queue-note__text">
          These are the bills owners and managers upload for a truck.
        </p>
        <p className="apv-queue-note__text">
          <Link className="apv-queue-note__link" to="/erp/bill-approvals">
            Driver expense bills
          </Link>{' '}
          is a separate queue.
        </p>
      </div>
      <div className="ra-toolbar">
        <div className="ra-tabs" role="tablist" aria-label="Bill status">
          {STATUS_TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`ra-tab ${tab === key ? 'is-active' : ''}`}
              onClick={() => {
                setTab(key);
                setPage(1);
              }}
            >
              {label} {counts[key] != null && <span className="ra-tab__count">{counts[key]}</span>}
            </button>
          ))}
        </div>
      </div>
      {error && (
        <div className="ra-alert ra-alert--error" role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button
            type="button"
            className="ra-btn ra-btn--ghost apv-alert__action"
            onClick={refresh}
          >
            <RotateCw size={14} /> Retry
          </button>
        </div>
      )}
      {vehiclesError && (
        <div className="ra-alert ra-alert--error" role="alert">
          <AlertTriangle size={16} />
          <span>{vehiclesError} Choosing a truck by hand still works.</span>
          <button
            type="button"
            className="ra-btn ra-btn--ghost apv-alert__action"
            onClick={refreshVehicles}
          >
            <RotateCw size={14} /> Retry trucks
          </button>
        </div>
      )}
      {!data && !error && loading && (
        <div className="ra-state apv-state" aria-live="polite">
          <div className="ra-spinner" />
          <p className="ra-state__title">Loading bills.</p>
        </div>
      )}
      {data && !error && !data.captures.length && (
        <div className="ra-state apv-state">
          <div className="ra-state__icon">
            {tab === 'pending' ? (
              <Inbox size={22} />
            ) : tab === 'rejected' ? (
              <Ban size={22} />
            ) : (
              <FileCheck2 size={22} />
            )}
          </div>
          <p className="ra-state__title">{EMPTY[tab].title}</p>
          <p className="apv-state__hint">{EMPTY[tab].hint}</p>
        </div>
      )}
      {data && data.captures.length > 0 && (
        <div className="ra-card">
          <div className="ra-table-wrap">
            <table className="ra-table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Truck</th>
                  <th>Uploaded by</th>
                  <th>Pump</th>
                  <th className="ra-right">Litres</th>
                  <th className="ra-right">Amount</th>
                  <th className="ra-right">Rate</th>
                  <th className="ra-center">Bill date/time</th>
                  <th className="ra-center">Match status</th>
                  <th className="ra-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.captures.map((capture, i) => (
                  <OfficeBillRow
                    key={capture.id}
                    capture={capture}
                    index={(page - 1) * PAGE_SIZE + i}
                    confirmed={tab === 'submitted'}
                    onOpen={setActive}
                    onHistory={setHistory}
                    onReject={tab === 'pending' ? (c) => setRejectIds([c.id]) : undefined}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {data && !error && data.total > PAGE_SIZE && (
        <div className="apv-pager">
          <button
            type="button"
            className="ra-btn ra-btn--ghost"
            disabled={page === 1}
            onClick={() => setPage((n) => n - 1)}
          >
            Previous
          </button>
          <span>
            Page {page} · {data.total} bills
          </span>
          <button
            type="button"
            className="ra-btn ra-btn--ghost"
            disabled={page * PAGE_SIZE >= data.total}
            onClick={() => setPage((n) => n + 1)}
          >
            Next
          </button>
        </div>
      )}
      <OfficeBillDrawer
        key={active?.id || 'no-bill'}
        capture={active}
        open={Boolean(active)}
        onClose={() => setActive(null)}
        vehicles={vehicles}
        onSaved={refresh}
        onHistory={setHistory}
        onReject={(c) => {
          setActive(null);
          setRejectIds([c.id]);
        }}
      />
      <HistoryDrawer capture={history} onClose={() => setHistory(null)} />
      {rejectIds && (
        <div
          className="ra-modal-overlay"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && closeReject()}
          onKeyDown={(e) => e.key === 'Escape' && closeReject()}
        >
          <div
            className="ra-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="office-reject-title"
          >
            <div
              id="office-reject-title"
              className="ra-modal__head"
              style={{ color: 'var(--rose-500, #EF4444)' }}
            >
              {`Reject ${plural(rejectIds.length)}`}
            </div>
            <div className="ra-modal__body">
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--foreground)' }}>
                Nothing is deleted. The bill moves to Rejected and is not added to the mileage list.
              </p>
              <div style={{ marginTop: 12 }}>
                <label
                  htmlFor="office-reject-reason"
                  className="ra-field__label"
                  style={{ marginBottom: 6, display: 'block' }}
                >
                  Reason (optional)
                </label>
                <textarea
                  id="office-reject-reason"
                  rows={2}
                  className="ra-modal__textarea"
                  value={reason}
                  maxLength={2000}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Unclear bill, duplicate, not our truck…"
                  aria-label="Reason for rejecting"
                />
              </div>
            </div>
            <div className="ra-modal__foot">
              <button
                type="button"
                className="ra-btn ra-btn--ghost"
                onClick={closeReject}
                disabled={rejecting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ra-btn ra-btn--reject"
                onClick={confirmReject}
                disabled={rejecting}
              >
                {rejecting ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
