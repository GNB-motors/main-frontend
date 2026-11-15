import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, FileCheck2, Inbox, RotateCw } from 'lucide-react';
import billPhotoService from '../../services/billPhotoService';
import { MileageApi } from '../Mileage/mileageApi';
import OfficeBillRow from './office/OfficeBillRow';
import OfficeBillDrawer from './office/OfficeBillDrawer';
import { HistoryDrawer } from './OfficeBillDetails';

const uploaderRole = 'OWNER,MANAGER';
// The bills owners and managers upload: their own queue, not the WhatsApp one.
const source = 'office';
const PAGE_SIZE = 50;

export default function OfficeBillApprovals({ onCount }) {
  const [tab, setTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [counts, setCounts] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState(null);
  const [active, setActive] = useState(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    MileageApi.vehicles(controller.signal)
      .then((v) => {
        if (live) setVehicles(Array.isArray(v) ? v : []);
      })
      .catch(() => {
        // The queue still works without the fleet list; only the truck picker
        // needs it, and it can be filled in by hand.
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const list = (status, p, limit) =>
      billPhotoService.listBillCaptures({
        status,
        uploaderRole,
        source,
        page: p,
        limit,
        signal: controller.signal,
      });
    Promise.all([list(tab, page, PAGE_SIZE), list(tab === 'pending' ? 'submitted' : 'pending', 1, 1)])
      .then(([current, other]) => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(current?.captures)) throw new Error('Invalid response');
        setData(current);
        const next = {
          [tab]: current.total,
          [tab === 'pending' ? 'submitted' : 'pending']: other.total,
        };
        setCounts(next);
        onCount?.(next.pending);
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
          {[
            ['pending', 'Pending'],
            ['submitted', 'Confirmed'],
          ].map(([key, label]) => (
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
      {!data && !error && loading && (
        <div className="ra-state apv-state" aria-live="polite">
          <div className="ra-spinner" />
          <p className="ra-state__title">Loading bills.</p>
        </div>
      )}
      {data && !error && !data.captures.length && (
        <div className="ra-state apv-state">
          <div className="ra-state__icon">
            {tab === 'pending' ? <Inbox size={22} /> : <FileCheck2 size={22} />}
          </div>
          <p className="ra-state__title">
            {tab === 'pending' ? 'No bills waiting.' : 'No confirmed bills.'}
          </p>
          <p className="apv-state__hint">
            {tab === 'pending'
              ? 'Fuel bills that owners and managers upload show up here until you confirm the truck.'
              : 'Bills you confirm move here, with who confirmed them and when.'}
          </p>
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
      />
      <HistoryDrawer capture={history} onClose={() => setHistory(null)} />
    </div>
  );
}
