import { useState } from 'react';
import { toast } from 'react-toastify';
import { Home } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import EmptyPanel from './EmptyPanel';
import { messageOf } from './placeIntelligenceModel';

const STATUSES = [
  { key: 'PROPOSED', label: 'To review' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'REJECTED', label: 'Rejected' },
];

const driverLabel = (d) => {
  if (!d) return '—';
  if (typeof d === 'object') return d.name || d.firstName || String(d._id || '').slice(-6) || '—';
  return `Driver ${String(d).slice(-6)}`;
};
const pct = (v) => (typeof v === 'number' ? `${Math.round(v * 100)}%` : '—');

/**
 * Inferred driver homes — where a driver overnights most, from GPS. Private to
 * owners/managers. Confirming creates or links a DRIVER_HOME place so personal
 * trips there are not charged as business.
 */
export default function DriverHomesView({ version, onChanged }) {
  const [status, setStatus] = useState('PROPOSED');
  const { data, loading, error, refetch } = useApi(
    (signal) => PlaceIntelligenceService.listHomes({ status, limit: 200 }, { signal }),
    [status, version],
  );
  const decideM = useMutation(PlaceIntelligenceService.decideHome);

  const decide = async (id, decision) => {
    try {
      await decideM.mutate({ id, decision });
      toast.success(decision === 'CONFIRM' ? 'Home confirmed' : 'Home rejected');
      refetch();
      onChanged?.();
    } catch (e) {
      toast.error(e?.message || 'Could not update home');
    }
  };

  if (loading && !data) return <PanelLoading />;
  if (error)
    return (
      <EmptyPanel
        title="Could not load driver homes"
        hint={messageOf(error, 'Try again in a minute.')}
      />
    );

  const items = data?.items || [];

  return (
    <div>
      <div className="pi-filters" role="tablist" aria-label="Driver home status">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            role="tab"
            aria-selected={status === s.key}
            className={status === s.key ? 'is-active' : ''}
            onClick={() => setStatus(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {!items.length ? (
        <EmptyPanel
          Icon={Home}
          title="No driver homes here"
          hint="A home appears once a driver overnights at the same place often enough over several weeks."
        />
      ) : (
        <div className="pi-table-wrap">
          <table className="pi-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th className="pi-num">Nights</th>
                <th className="pi-num">Share</th>
                <th className="pi-num">Weeks</th>
                {status === 'PROPOSED' ? <th>Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h._id}>
                  <td>{driverLabel(h.driverId)}</td>
                  <td className="pi-num">
                    {h.nights ?? '—'}
                    {h.totalNights ? ` / ${h.totalNights}` : ''}
                  </td>
                  <td className="pi-num">{pct(h.share)}</td>
                  <td className="pi-num">{h.distinctWeeks ?? '—'}</td>
                  {status === 'PROPOSED' ? (
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="pi-btn-quiet"
                          disabled={decideM.loading}
                          onClick={() => decide(h._id, 'CONFIRM')}
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          className="pi-btn-quiet"
                          disabled={decideM.loading}
                          onClick={() => decide(h._id, 'REJECT')}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
