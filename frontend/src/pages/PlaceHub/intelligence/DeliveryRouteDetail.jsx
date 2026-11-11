import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowUpRight, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../../components/ui/button';
import useApi from '../../../hooks/useApi';
import useMutation from '../../../hooks/useMutation';
import { getUserRole } from '../../../utils/session';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import SapRequestState from '../../Sap/SapRequestState';
import SetSapDialog from '../../Sap/SetSapDialog';
import { BASIS_LABEL, canEditSap, kmText, signed } from '../../Sap/sapModel';
import { minutesLabel } from './model/unitLabels';
import RouteComparison from './RouteComparison';

export default function DeliveryRouteDetail({ id, version, showSap = false, onChanged, onClose }) {
  const q = useApi(
    (signal) => PlaceIntelligenceService.getDeliveryLeg(id, { signal }),
    [id, version, showSap],
    { scopeKey: `${id}:${showSap}` },
  );
  const m = useMutation(PlaceIntelligenceService.reviewDeliveryLeg);
  const [note, setNote] = useState('');
  const [limit, setLimit] = useState(5);
  const [tab, setTab] = useState('overview');
  const [editing, setEditing] = useState(false);
  const detailRef = useRef(null);
  useEffect(() => {
    if (window.matchMedia?.('(max-width: 850px)').matches)
      detailRef.current?.scrollIntoView({ block: 'start' });
  }, [id]);
  const route = q.data;
  const act = async (status) => {
    try {
      await m.mutate({ id, status, note });
      toast.success('Route review saved');
      q.refetch();
      onChanged();
    } catch (err) {
      toast.error(err?.message || 'Could not review route');
    }
  };
  const saved = () => {
    q.refetch();
    onChanged();
    toast.success('Route SAP saved. Trip snapshots refresh shortly.');
  };
  const samples = route?.samples || [];
  const comparison = route?.sap?.comparison;
  const roundTrip = route?.sap?.basis === 'ROUND_TRIP';
  return (
    <aside ref={detailRef} className="ud-detail sap-panel" aria-label="Selected delivery route">
      <div className="ud-detail-heading">
        <small>DELIVERY ROUTE</small>
        <button type="button" aria-label="Close route details" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <SapRequestState query={q}>
        {route && (
          <>
            {showSap && <RouteComparison route={route} />}
            <h2>
              {route.fromName || 'Unnamed pickup'}
              <span>→ {route.toName || 'Unnamed drop'}</span>
            </h2>
            <p>
              {route.n
                ? `Learned from ${route.n} trips across ${route.trucks} trucks`
                : 'Configured route · no trips yet'}
            </p>
            <nav className="ud-detail-tabs" aria-label="Route detail views">
              {['overview', 'trips', ...(showSap ? ['sap'] : [])].map((t) => (
                <button type="button" key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
                  {t === 'sap' ? 'SAP history' : t === 'trips' ? 'Trips' : 'Overview'}
                </button>
              ))}
            </nav>
            {tab === 'overview' && (
              <>
                {showSap && (
                  <>
                    <div className="ud-comparison">
                      <small>
                        {roundTrip ? 'ROUND TRIP · LOADED + RETURN' : 'LOADED JOURNEY · ONE WAY'}
                      </small>
                      <div>
                        <strong>
                          {kmText(roundTrip ? route.roundTripKm?.p50 : route.km?.p50)}
                          <small>typical learned distance</small>
                        </strong>
                        <span>/</span>
                        <strong>
                          {kmText(route.sap?.sapKm)}
                          <small>agreed SAP</small>
                        </strong>
                      </div>
                      <p>
                        {!route.sap
                          ? 'SAP not set. Enter the distance agreed with your customer.'
                          : !route.n
                            ? 'SAP is saved. Waiting for this route’s first trip.'
                            : comparison?.verdict === 'NO_KM'
                              ? 'More distance evidence is needed. Missing return km is not treated as zero.'
                              : `${signed(comparison?.deltaKm, ' km')} versus SAP · ${route.sap.tolerancePct}% tolerance`}
                      </p>
                      {roundTrip && (
                        <p>
                          {route.roundTripKm?.n || 0} of {route.n} trips have loaded + return
                          distance.
                        </p>
                      )}
                    </div>
                    <Button
                      className="ud-wide"
                      variant={route.sap ? 'outline' : 'default'}
                      onClick={() => setEditing(true)}
                    >
                      <Pencil size={14} />
                      {route.sap ? 'Edit SAP distance' : 'Set SAP distance'}
                    </Button>
                  </>
                )}
                <dl className="ud-facts">
                  <div>
                    <dt>Typical loaded distance</dt>
                    <dd>{kmText(route.km?.p50)}</dd>
                  </div>
                  <div>
                    <dt>Distance evidence</dt>
                    <dd>
                      {route.km?.n ?? '—'} / {route.n} trips
                    </dd>
                  </div>
                  <div>
                    <dt>Typical loaded time</dt>
                    <dd>{minutesLabel(route.minutes?.p50)}</dd>
                  </div>
                  <div>
                    <dt>Typical fuel / km</dt>
                    <dd>
                      {route.fuelPerKm?.p50 == null ? '—' : `${route.fuelPerKm.p50.toFixed(2)} L`}
                    </dd>
                  </div>
                </dl>
                <p>
                  Typical means median across this route’s trips. Learned distances do not become
                  agreed SAP.
                </p>
                <Button variant="outline" className="ud-wide" onClick={() => setTab('trips')}>
                  See individual trips →
                </Button>
              </>
            )}
            {tab === 'trips' && (
              <>
                <h3>Trips on this route</h3>
                <p>
                  {samples.length} recent samples of {route.n} trips. Statistics use all qualifying
                  trips.
                </p>
                {!samples.length ? (
                  <p>No trips yet. This configured route and its SAP remain available.</p>
                ) : (
                  <ul className="ud-trip-list">
                    {samples.slice(0, limit).map((s) => (
                      <li key={s.autoTripId}>
                        <Link to={`/auto-trips/${s.autoTripId}`}>
                          {s.registrationNumber || 'Open trip'} <ArrowUpRight size={12} />
                        </Link>
                        <span>{kmText(s.km)}</span>
                        <small>
                          {s.departedAt
                            ? new Date(s.departedAt).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                              })
                            : 'Departure not recorded'}
                        </small>
                      </li>
                    ))}
                  </ul>
                )}
                {samples.length > limit && (
                  <Button variant="outline" onClick={() => setLimit((n) => n + 10)}>
                    Show more trips ({samples.length - limit} remaining)
                  </Button>
                )}
              </>
            )}
            {tab === 'sap' && showSap && (
              <>
                <Button className="ud-wide" variant="outline" onClick={() => setEditing(true)}>
                  {route.sap ? 'Edit SAP distance' : 'Set SAP distance'}
                </Button>
                <h3 className="ud-history-title">Current agreement</h3>
                <p>
                  {route.sap
                    ? `${kmText(route.sap.sapKm)} · ${BASIS_LABEL[route.sap.basis]}${route.sap.note ? ` · ${route.sap.note}` : ''}`
                    : 'No SAP agreement has been set.'}
                </p>
                <h3>Earlier agreements</h3>
                {!route.sapHistory?.length ? (
                  <p>No earlier SAP entries.</p>
                ) : (
                  <ul className="ud-trip-list">
                    {route.sapHistory.map((h) => (
                      <li key={h._id}>
                        <strong>
                          {kmText(h.sapKm)} · {BASIS_LABEL[h.basis]}
                        </strong>
                        <small>
                          {h.note || 'No note'} · replaced{' '}
                          {new Date(h.supersededAt).toLocaleDateString('en-IN', {
                            timeZone: 'Asia/Kolkata',
                          })}
                        </small>
                      </li>
                    ))}
                  </ul>
                )}
                <p>
                  SAP agreements and route review are separate. Reviewing a route does not change
                  its SAP.
                </p>
              </>
            )}
            {canEditSap(getUserRole()) && (
              <details className="ud-review-details">
                <summary>
                  Review this learned route ·{' '}
                  {route.review === 'AUTO'
                    ? 'Unreviewed'
                    : (route.review || 'AUTO').replaceAll('_', ' ').toLowerCase()}
                </summary>
                <p>Accept or reject the route detection. This does not edit its SAP agreement.</p>
                <label className="sap-field">
                  Review note (optional)
                  <input
                    aria-label="Review note (optional)"
                    maxLength={300}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </label>
                <div className="ud-actions">
                  <Button size="sm" disabled={m.loading} onClick={() => act('ACCEPTED')}>
                    <Check size={14} />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={m.loading}
                    onClick={() => act('REJECTED')}
                  >
                    <X size={14} />
                    Reject
                  </Button>
                </div>
              </details>
            )}
            {editing && showSap && (
              <SetSapDialog
                from={{ id: route.fromSiteId, name: route.fromName }}
                to={{ id: route.toSiteId, name: route.toName }}
                current={route.sap || null}
                onClose={() => setEditing(false)}
                onSaved={saved}
              />
            )}
          </>
        )}
      </SapRequestState>
    </aside>
  );
}
