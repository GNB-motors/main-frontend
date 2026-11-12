import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, Clock, X } from 'lucide-react';
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
import DeliverySapCard from './DeliverySapCard';
import LegEnd from './LegEnd.jsx';
import Frame from '../drawer/Frame.jsx';

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
  const [limit, setLimit] = useState(5);
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
  const history = route?.sapHistory || [];
  const facts = route
    ? [
        route.n
          ? `${countText(route.n)} trips · ${countText(route.trucks)} trucks`
          : 'No trips yet',
        route.km?.p90 != null && `long trips ${kmText(route.km.p90)}`,
        route.fuelPerKm?.p50 != null && `${route.fuelPerKm.p50.toFixed(2)} L/km`,
      ].filter(Boolean)
    : [];
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
          <div
            className="ph-route-hero ph-delivery-hero"
            title="Typical = median across this route’s trips"
          >
            <div className="ph-route-hero-primary">
              <Clock size={18} aria-hidden="true" />
              <span className="ph-route-hero-time">{minutesLabel(route.minutes?.p50)}</span>
              <span className="ph-route-hero-sep" aria-hidden="true" />
              <span className="ph-route-hero-dist">{kmText(route.km?.p50)}</span>
            </div>
            <p className="ph-delivery-evidence">
              {route.n ? facts.join(' · ') : 'Configured route · no trips yet'}
            </p>
          </div>

          {showSap && <DeliverySapCard route={route} onEdit={() => setEditing(true)} />}

          <section className="ph-route-sec" aria-label="Trips on this route">
            <h3 className="ph-route-sec-head">Recent trips</h3>
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
          </section>

          {showSap && history.length > 0 && (
            <details className="ud-review-details">
              <summary>SAP history · {history.length} earlier</summary>
              <ul className="ph-route-runs">
                {history.map((h) => (
                  <li key={h._id}>
                    <div className="ph-route-run-top">
                      <span>Replaced {dateOnly(h.supersededAt)}</span>
                      <span>
                        {kmText(h.sapKm)} · {BASIS_LABEL[h.basis] || ''}
                      </span>
                    </div>
                    {h.note && <span>{h.note}</span>}
                  </li>
                ))}
              </ul>
            </details>
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
