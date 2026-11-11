import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import billPhotoService from '../../services/billPhotoService';
import { MileageApi } from '../Mileage/mileageApi';
import BillsTable from '../Mileage/BillsTable';
import { ConfirmedBillRow, HistoryDrawer } from './OfficeBillDetails';

const uploaderRole = 'OWNER,MANAGER';
export default function OfficeBillApprovals({ onCount, onUnavailable }) {
  const [tab, setTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [counts, setCounts] = useState({});
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    let live = true;
    MileageApi.vehicles()
      .then((v) => {
        if (live) setVehicles(Array.isArray(v) ? v : []);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError('');
    const list = (status, p, limit) =>
      billPhotoService.listBillCaptures({
        status,
        uploaderRole,
        page: p,
        limit,
        signal: controller.signal,
      });
    Promise.all([list(tab, page, 50), list(tab === 'pending' ? 'submitted' : 'pending', 1, 1)])
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
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if ((e?.status ?? e?.response?.status) === 404) onUnavailable?.();
        else setError('Could not load bills. Please try again.');
      });
    return () => controller.abort();
  }, [tab, page, revision, onCount, onUnavailable]);
  return (
    <div className="apv-section">
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
        <p role="alert">
          {error}{' '}
          <button type="button" onClick={refresh}>
            Refresh
          </button>
        </p>
      )}
      {!data && !error && <p>Loading bills…</p>}
      {data && !data.captures.length && (
        <p>No {tab === 'pending' ? 'pending' : 'confirmed'} bills.</p>
      )}
      {data && tab === 'pending' && (
        <BillsTable
          rows={data.captures}
          vehicles={vehicles}
          via="APPROVALS"
          onSaved={refresh}
          onUnavailable={onUnavailable}
        />
      )}
      {data && tab === 'submitted' && data.captures.length > 0 && (
        <div className="bills-table-wrap">
          <table className="bills-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Bill</th>
                <th>Photo</th>
                <th>Truck</th>
                <th>Uploaded by</th>
                <th>Confirmed by</th>
                <th>Log</th>
              </tr>
            </thead>
            <tbody>
              {data.captures.map((c, i) => (
                <ConfirmedBillRow
                  key={c.id}
                  capture={c}
                  index={(page - 1) * 50 + i}
                  vehicles={vehicles}
                  onUpdated={refresh}
                  onHistory={setHistory}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && (
        <div className="apv-pager">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((n) => n - 1)}
          >
            Previous
          </Button>
          <span>
            Page {page} · {data.total} bills
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page * 50 >= data.total}
            onClick={() => setPage((n) => n + 1)}
          >
            Next
          </Button>
        </div>
      )}
      <HistoryDrawer capture={history} onClose={() => setHistory(null)} />
    </div>
  );
}
