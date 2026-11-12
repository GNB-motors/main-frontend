import { useState } from 'react';
import { toast } from 'react-toastify';
import { Home } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import { useMutation } from '../../../hooks/useMutation';
import { Button } from '../../../components/ui/button';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PanelLoading from './PanelLoading';
import EmptyPanel from './EmptyPanel';
import PlaceMapModal from './PlaceMapModal.jsx';
import { messageOf } from './model/requestOutcome.js';

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
const coord = (lat, lng) =>
  typeof lat === 'number' && typeof lng === 'number' ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : '—';

/**
 * Inferred driver homes — where a driver overnights most, from GPS. Private to
 * owners/managers. A row opens a modal with the halt on a map so the reviewer
 * can see where the home is, then confirm or reject it there. Confirming creates
 * or links a DRIVER_HOME place so personal trips there are not charged as business.
 */
export default function DriverHomesView({ version, onChanged }) {
  const [status, setStatus] = useState('PROPOSED');
  const [openHome, setOpenHome] = useState(null);
  const { data, loading, error, refetch } = useApi(
    (signal) => PlaceIntelligenceService.listHomes({ status, limit: 200 }, { signal }),
    [status, version],
  );
  const decideM = useMutation(PlaceIntelligenceService.decideHome);

  const decide = async (id, decision) => {
    try {
      await decideM.mutate({ id, decision });
      toast.success(decision === 'CONFIRM' ? 'Home confirmed' : 'Home rejected');
      setOpenHome(null);
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
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr
                  key={h._id}
                  className="pi-row-click"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${driverLabel(h.driverId)} on the map`}
                  onClick={() => setOpenHome(h)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setOpenHome(h);
                    }
                  }}
                >
                  <td className="pi-cell-strong">{driverLabel(h.driverId)}</td>
                  <td className="pi-num">
                    {h.nights ?? '—'}
                    {h.totalNights ? ` / ${h.totalNights}` : ''}
                  </td>
                  <td className="pi-num">{pct(h.share)}</td>
                  <td className="pi-num">{h.distinctWeeks ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PlaceMapModal
        open={!!openHome}
        onOpenChange={(o) => (o ? null : setOpenHome(null))}
        icon={<Home size={18} />}
        title={openHome ? driverLabel(openHome.driverId) : ''}
        subtitle="Where this driver overnights most"
        lat={openHome?.lat}
        lng={openHome?.lng}
        label={openHome ? driverLabel(openHome.driverId) : ''}
        footer={
          openHome && openHome.status === 'PROPOSED' ? (
            <>
              <Button
                size="sm"
                variant="outline"
                disabled={decideM.loading}
                onClick={() => decide(openHome._id, 'REJECT')}
              >
                Reject
              </Button>
              <Button
                size="sm"
                disabled={decideM.loading}
                onClick={() => decide(openHome._id, 'CONFIRM')}
              >
                Confirm home
              </Button>
            </>
          ) : null
        }
      >
        {openHome ? (
          <>
            <dl className="pi-fact">
              <dt>Overnights</dt>
              <dd>
                {openHome.nights ?? '—'}
                {openHome.totalNights ? ` / ${openHome.totalNights}` : ''}
              </dd>
            </dl>
            <dl className="pi-fact">
              <dt>Share of nights</dt>
              <dd>{pct(openHome.share)}</dd>
            </dl>
            <dl className="pi-fact">
              <dt>Confidence</dt>
              <dd>{pct(openHome.q10)}</dd>
            </dl>
            <dl className="pi-fact">
              <dt>Weeks seen</dt>
              <dd>{openHome.distinctWeeks ?? '—'}</dd>
            </dl>
            <dl className="pi-fact">
              <dt>Place</dt>
              <dd>{openHome.orgSiteId ? 'Mapped place' : 'Unlinked overnight cluster'}</dd>
            </dl>
            <dl className="pi-fact">
              <dt>Coordinates</dt>
              <dd>{coord(openHome.lat, openHome.lng)}</dd>
            </dl>
          </>
        ) : null}
      </PlaceMapModal>
    </div>
  );
}
