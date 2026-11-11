import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Clock, History, Truck, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../../components/ui/button';
import useApi from '../../../hooks/useApi';
import useMutation from '../../../hooks/useMutation';
import { getUserRole } from '../../../utils/session';
import { formatDateTimeIST } from '../../../utils/dateUtils.js';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import SetSapDialog from '../../Sap/SetSapDialog';
import { BASIS_LABEL, canEditSap, kmText } from '../../Sap/sapModel';
import { minutesLabel } from './model/unitLabels';
import { messageOf } from './model/requestOutcome.js';
import { countText } from './model/deliveryRoutesModel';
import RouteComparison from './RouteComparison';
import DeliverySapCard from './DeliverySapCard';
import LegEnd from './LegEnd.jsx';
import Frame from '../drawer/Frame.jsx';
import Stats from '../drawer/Stats.jsx';

const SOURCE = {
  DRIVEN: { label: 'Road our trucks drove', tone: 'driven' },
  ENGINE: { label: 'Likely road · estimated', tone: 'engine' },
  NONE: { label: 'Straight-line link', tone: 'none' },
};
const dateOnly = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium' });

/** Drawer for one delivery route (pickup → drop), in the Place Hub panel frame. */
export default function DeliveryRouteDetail({
  id,
  leg,
  sites,
  version,
  showSap = false,
  onChanged,
  onClose,
}) {
  const q = useApi(
    (signal) => PlaceIntelligenceService.getDeliveryLeg(id, { signal }),
    [id, version, showSap],
    { scopeKey: `${id}:${showSap}` },
  );
  const m = useMutation(PlaceIntelligenceService.reviewDeliveryLeg);
  const [note, setNote] = useState('');
  const [limit, setLimit] = useState(6);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    // A dialog on top owns Escape; otherwise Escape closes the drawer.
    const onKey = (e) => {
      if (e.key === 'Escape' && !document.querySelector('[role="dialog"]')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const route = q.data ? { ...leg, ...q.data } : leg?.fromName ? leg : null;
  const act = async (status) => {
    try {
      await m.mutate({ id, status, note });
      toast.success('Route review saved');
      q.refetch();
      onChanged();
    } catch (err) {
      toast.error(messageOf(err, 'Could not review route'));
    }
  };
  const saved = () => {
    q.refetch();
    onChanged();
    toast.success('Route SAP saved. Trip snapshots refresh shortly.');
  };
  const from = route && (sites?.get(String(route.fromSiteId)) || { name: route.fromName });
  const to = route && (sites?.get(String(route.toSiteId)) || { name: route.toName });
  const samples = q.data?.samples || [];
  const source = SOURCE[leg?.path?.source] || SOURCE.NONE;
  return (
    <Frame
      eyebrow="Delivery route"
      label="Selected delivery route"
      onClose={onClose}
      title={
        route ? (
          <span className="ph-delivery-title">
            <LegEnd site={from} fallback="UNKNOWN" />
            <span aria-hidden="true">→</span>
            <LegEnd site={to} fallback="UNKNOWN" />
          </span>
        ) : (
          'Delivery route'
        )
      }
    >
      {!route && q.loading && <p role="status">Loading route…</p>}
      {q.error && <p role="alert">{messageOf(q.error, 'Could not load this route')}</p>}
      {route && (
        <>
          <div className="ph-route-hero">
            <div className="ph-route-hero-primary">
              <Clock size={18} aria-hidden="true" />
              <span className="ph-route-hero-time">{minutesLabel(route.minutes?.p50)}</span>
              <span className="ph-route-hero-sep" aria-hidden="true" />
              <span className="ph-route-hero-dist">{kmText(route.km?.p50)}</span>
            </div>
            <div className="ph-route-hero-meta">
              {showSap && <RouteComparison route={route} />}
              <span className={`ph-route-badge ph-route-badge--${source.tone}`}>
                {source.label}
              </span>
            </div>
            <p className="ph-muted ph-delivery-evidence">
              {route.n
                ? `Learned from ${countText(route.n)} trips across ${countText(route.trucks)} trucks`
                : 'Configured route · no trips yet'}
            </p>
          </div>

          {showSap && <DeliverySapCard route={route} onEdit={() => setEditing(true)} />}

          <Stats
            items={[
              { label: 'Typical loaded distance', value: kmText(route.km?.p50) },
              {
                label: 'Distance evidence',
                value: `${route.km?.n ?? '—'} / ${countText(route.n)} trips`,
              },
              { label: 'Long trip (1 in 10)', value: kmText(route.km?.p90) },
              {
                label: 'Fuel per km',
                value:
                  route.fuelPerKm?.p50 == null ? '—' : `${route.fuelPerKm.p50.toFixed(2)} L/km`,
              },
            ]}
          />
          <p className="ph-muted ph-delivery-note">
            Typical = median across this route’s trips. Learned distances never become agreed SAP.
          </p>

          <section className="ph-route-sec" aria-label="Trips on this route">
            <h3 className="ph-route-sec-head">
              <Truck size={15} aria-hidden="true" /> Recent trips
            </h3>
            {q.loading && !q.data && <p className="ph-muted">Loading trips…</p>}
            {q.data && !samples.length && (
              <p className="ph-muted">
                No trips yet. This configured route and its SAP remain available.
              </p>
            )}
            <ul className="ph-route-runs">
              {samples.slice(0, limit).map((s) => (
                <li key={s.autoTripId}>
                  <div className="ph-route-run-top">
                    <Link to={`/auto-trips/${s.autoTripId}`} className="ph-delivery-trip">
                      {s.registrationNumber || 'Open trip'} <ArrowUpRight size={12} />
                    </Link>
                    <span>
                      {s.minutes != null ? `${minutesLabel(s.minutes)} · ` : ''}
                      {kmText(s.km)}
                    </span>
                  </div>
                  <span>
                    {s.departedAt ? formatDateTimeIST(s.departedAt) : 'Departure not recorded'}
                  </span>
                </li>
              ))}
            </ul>
            {samples.length > limit && (
              <Button variant="outline" size="sm" onClick={() => setLimit((n) => n + 10)}>
                Show more trips ({samples.length - limit} remaining)
              </Button>
            )}
            {samples.length > 0 && route.n > samples.length && (
              <p className="ph-muted">
                {samples.length} most recent of {countText(route.n)} trips. Figures above use all of
                them.
              </p>
            )}
          </section>

          {showSap && (
            <section className="ph-route-sec" aria-label="SAP agreements">
              <h3 className="ph-route-sec-head">
                <History size={15} aria-hidden="true" /> SAP agreements
              </h3>
              <ul className="ph-route-runs">
                <li>
                  <div className="ph-route-run-top">
                    <strong>Current</strong>
                    <span>
                      {route.sap
                        ? `${kmText(route.sap.sapKm)} · ${BASIS_LABEL[route.sap.basis] || ''}`
                        : 'Not set'}
                    </span>
                  </div>
                  {route.sap?.note && <span>{route.sap.note}</span>}
                </li>
                {(route.sapHistory || []).map((h) => (
                  <li key={h._id}>
                    <div className="ph-route-run-top">
                      <span>Replaced {dateOnly(h.supersededAt)}</span>
                      <span>
                        {kmText(h.sapKm)} · {BASIS_LABEL[h.basis] || ''}
                      </span>
                    </div>
                    <span>{h.note || 'No note'}</span>
                  </li>
                ))}
              </ul>
              {!route.sapHistory?.length && <p className="ph-muted">No earlier SAP entries.</p>}
            </section>
          )}

          {canEditSap(getUserRole()) && q.data && (
            <details className="ud-review-details">
              <summary>
                Review this learned route ·{' '}
                {route.review === 'AUTO'
                  ? 'Unreviewed'
                  : (route.review || 'AUTO').replaceAll('_', ' ').toLowerCase()}
              </summary>
              <p className="ph-muted">
                Accept or reject the route detection. This does not edit its SAP agreement.
              </p>
              <label className="ph-delivery-field">
                Review note (optional)
                <input
                  aria-label="Review note (optional)"
                  maxLength={300}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <div className="ph-delivery-review-actions">
                <Button size="sm" disabled={m.loading} onClick={() => act('ACCEPTED')}>
                  <Check size={14} /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={m.loading}
                  onClick={() => act('REJECTED')}
                >
                  <X size={14} /> Reject
                </Button>
              </div>
            </details>
          )}
        </>
      )}
      {editing && showSap && route && (
        <SetSapDialog
          from={{ id: route.fromSiteId, name: route.fromName }}
          to={{ id: route.toSiteId, name: route.toName }}
          current={route.sap || null}
          onClose={() => setEditing(false)}
          onSaved={saved}
        />
      )}
    </Frame>
  );
}
