import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Route, Link2, Pencil, ArrowUpRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../components/ui/button';
import useApi from '../../hooks/useApi';
import useMutation from '../../hooks/useMutation';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session';
import SapService from '../../services/SapService';
import SapPill from './SapPill';
import SapComparison from './SapComparison';
import SapRequestState from './SapRequestState';
import SapLabelPicker from './SapLabelPicker';
import SetSapDialog from './SetSapDialog';
import { canEditSap, kmText } from './sapModel';
import { uniqueSuggestions } from './sapReviewModel';
export default function RouteSapCard({ trip }) {
  const canEdit = canEditSap(getUserRole());
  const q = useApi(
    (signal) => SapService.trip(trip._id, { signal }),
    [
      trip._id,
      trip.updatedAt,
      trip.drop?.orgSiteId,
      trip.drop?.arrivedAt,
      trip.km?.laden,
      trip.km?.return,
    ],
    { enabled: canEdit },
  );
  const viewQuery = canEdit ? q : { data: { trip, sap: trip.sap } };
  const { isEnabled } = useFeatureFlags();
  const mutation = useMutation(({ action, body }, options) => SapService[action](body, options));
  const [editing, setEditing] = useState(false);
  const current = q.data?.trip || trip;
  const sap = q.data?.sap ?? trip.sap;
  const saved = () => {
    q.refetch();
    toast.success('SAP updated — trips refresh shortly');
  };
  const act = async (action, body) => {
    try {
      await mutation.mutate({ action, body });
      saved();
    } catch (e) {
      toast.error(e?.message || 'Could not update SAP');
    }
  };
  const alias = (kind, label, status = 'CONFIRMED') =>
    act('alias', {
      kind,
      label,
      orgSiteId: (kind === 'PLANT' ? current.pickup : current.drop)?.orgSiteId,
      status,
    });
  return (
    <section className="atx-card sap-panel sap-route-card atx-span-2" aria-label="Route SAP">
      <div className="sap-route-header">
        <div className="sap-stack">
          <h2>
            <Route size={18} aria-hidden="true" />
            Route SAP
          </h2>
          <p className="sap-muted">
            {current.pickup?.name || 'Plant'} → {current.drop?.name || 'Drop not known'}
          </p>
        </div>
        {canEdit && (
          <div className="sap-row">
            <Link className="sap-link" to="/reports?report=laneKm&sapTab=review">
              <Link2 size={14} />
              Link SAP sheet to places
            </Link>
            <Button
              variant="outline"
              size="sm"
              disabled={!current.pickup?.orgSiteId || !current.drop?.orgSiteId || mutation.loading}
              onClick={() => setEditing(true)}
            >
              <Pencil size={13} />
              Set SAP km
            </Button>
          </div>
        )}
      </div>
      <SapRequestState query={viewQuery}>
        <div className="sap-stack">
          <div className="sap-route-labels">
            <strong>
              {sap?.fromLabel || current.pickup?.name || 'Plant'} →{' '}
              {sap?.toLabel || current.drop?.name || 'Drop not known'}
            </strong>
            {sap?.status === 'MATCHED' && (
              <span className="sap-source">
                {sap.source === 'MANUAL' ? 'Manual reference' : 'SAP sheet'}
              </span>
            )}
          </div>
          {sap?.status === 'MATCHED' ? (
            <>
              <div className="sap-comparison-grid">
                <SapComparison
                  label="One-way"
                  reference={sap.sapKm}
                  comparison={sap.oneWay}
                  tolerance={sap.tolerancePct}
                />
                <SapComparison
                  label="Round trip"
                  reference={sap.roundTrip?.sapKm}
                  comparison={sap.roundTrip}
                  tolerance={sap.tolerancePct}
                />
              </div>
              <p className="sap-muted">
                Tolerance: {sap.tolerancePct ?? 10}%
                {sap.multipleSap
                  ? ` · Sheet values: ${(sap.values || []).join(' / ')} km. The selected reference is ${sap.sapKm} km.`
                  : ''}
              </p>
            </>
          ) : (
            <div className="sap-notice">
              {sap ? <SapPill sap={sap} /> : <span>SAP not computed yet</span>}
            </div>
          )}
          {canEdit && (
            <>
              {!current.drop?.orgSiteId && (
                <p className="sap-muted">Save a drop place before setting SAP for this route.</p>
              )}
              <div className="sap-link-grid">
                {['DROP', 'PLANT'].map((kind) => {
                  const site = kind === 'DROP' ? current.drop : current.pickup;
                  return site?.orgSiteId ? (
                    <details className="sap-disclosure" key={kind}>
                      <summary>This {kind.toLowerCase()} is … in the SAP sheet</summary>
                      <div className="sap-stack">
                        {uniqueSuggestions(
                          (q.data?.candidates?.suggestions || []).filter((s) => s.kind === kind),
                          'DROP',
                        ).map((s) => (
                          <div className="sap-suggestion" key={s.label}>
                            <strong>{s.label}</strong>
                            <span className="sap-muted">
                              {Math.round(s.score * 100)}% match · {(s.sapValues || []).join(' / ')}{' '}
                              km
                            </span>
                            <div className="sap-row">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={mutation.loading}
                                onClick={() => alias(kind, s.label)}
                              >
                                Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={mutation.loading}
                                onClick={() => alias(kind, s.label, 'REJECTED')}
                              >
                                Not this one
                              </Button>
                            </div>
                          </div>
                        ))}
                        <SapLabelPicker
                          kind={kind}
                          disabled={mutation.loading}
                          onChoose={(label) => alias(kind, label)}
                        />
                      </div>
                    </details>
                  ) : null;
                })}
              </div>
            </>
          )}
        </div>
      </SapRequestState>
      {(q.data?.routeKm || (isEnabled('routesV2') && trip.routeLeg)) && (
        <div className="sap-route-footer">
          {isEnabled('routesV2') && trip.routeLeg && (
            <Link className="sap-link" to={`/place-hub?tab=deliveries&leg=${trip.routeLeg._id}`}>
              Usual for this route: {kmText(trip.routeLeg.km?.p50)} ({trip.routeLeg.n} trips)
              <ArrowUpRight size={14} />
            </Link>
          )}
          {canEdit && q.data?.routeKm && (
            <Button
              variant="ghost"
              size="sm"
              disabled={mutation.loading}
              onClick={() => act('removeRouteKm', q.data.routeKm._id)}
            >
              Remove manual SAP
            </Button>
          )}
        </div>
      )}
      {editing && <SetSapDialog trip={current} onClose={() => setEditing(false)} onSaved={saved} />}
    </section>
  );
}
