import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Route, Truck, Pencil, ArrowUpRight, History } from 'lucide-react';
import { toast } from 'react-toastify';
import { Button } from '../../components/ui/button';
import useApi from '../../hooks/useApi';
import useMutation from '../../hooks/useMutation';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session';
import SapService from '../../services/SapService';
import SapComparison from './SapComparison';
import SapRequestState from './SapRequestState';
import SetSapDialog from './SetSapDialog';
import { BASIS_LABEL, SOURCE_LABEL, SAP_REASONS, canEditSap, kmText } from './sapModel';

/**
 * The trip's route and that route's SAP. SAP belongs to the route (pickup place → drop place),
 * so setting it here sets it for every trip on the route. Owners and managers of an org with
 * SAP (`sapV2`) only.
 */
export default function RouteSapCard({ trip }) {
  const { isEnabled } = useFeatureFlags();
  const visible = canEditSap(getUserRole()) && isEnabled('sapV2');
  const q = useApi(
    (signal) => SapService.trip(trip._id, { signal }),
    [trip._id, trip.updatedAt, trip.drop?.orgSiteId, trip.km?.laden, trip.km?.return],
    { enabled: visible },
  );
  const remove = useMutation(SapService.removeRoute);
  const [editing, setEditing] = useState(false);
  if (!visible) return null;

  const route = q.data?.route;
  const sap = q.data?.sap;
  const entry = q.data?.routeSap;
  const saved = () => {
    q.refetch();
    toast.success('Route SAP saved — its trips refresh shortly');
  };
  const removeSap = async () => {
    try {
      await remove.mutate(entry._id);
      q.refetch();
      toast.success('Route SAP removed');
    } catch (e) {
      toast.error(e?.message || 'Could not remove SAP');
    }
  };
  return (
    <section className="atx-card sap-panel sap-route-card atx-span-2" aria-label="Route SAP">
      <div className="sap-route-header">
        <div className="sap-stack">
          <h2>
            <Route size={18} aria-hidden="true" />
            Agreed distance (SAP)
          </h2>
          <p className="sap-muted">
            {route?.fromName || trip.pickup?.name || 'Plant'} →{' '}
            {route?.toName || trip.drop?.name || 'Drop not known'}
          </p>
        </div>
        <div className="sap-row">
          <Link
            className="sap-link"
            to={
              isEnabled('fleetIntelligence') && isEnabled('routesV2')
                ? '/place-hub?tab=routes&routeView=deliveries'
                : '/reports?report=laneKm'
            }
          >
            Manage routes
            <ArrowUpRight size={14} />
          </Link>
          {route && entry && (
            <Button
              variant="outline"
              size="sm"
              disabled={remove.loading}
              onClick={() => setEditing(true)}
            >
              <Pencil size={13} />
              {entry ? 'Change SAP' : 'Set SAP'}
            </Button>
          )}
        </div>
      </div>
      <SapRequestState query={q}>
        <div className="sap-stack">
          {sap?.status === 'MATCHED' ? (
            <>
              <SapComparison
                basis={sap.basis}
                sapKm={sap.sapKm}
                comparison={sap.comparison}
                tolerance={sap.tolerancePct}
              />
              <p className="sap-muted">
                {kmText(entry?.sapKm ?? sap.sapKm)} {BASIS_LABEL[sap.basis]?.toLowerCase()} ·{' '}
                {SOURCE_LABEL[sap.source] || SOURCE_LABEL.MANUAL}
                {entry?.note ? ` · ${entry.note}` : ''} · Tolerance {sap.tolerancePct ?? 10}%
              </p>
            </>
          ) : (
            <div className="sap-route-empty">
              <span className="sap-route-empty-icon">
                <Route size={25} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h3>
                {entry
                  ? 'Distance comparison unavailable'
                  : route
                    ? 'No agreed distance set'
                    : SAP_REASONS[sap?.status] || 'Route not ready for comparison'}
              </h3>
              <p>
                {route
                  ? entry
                    ? 'The agreed distance is saved. GPS distance is needed to compare this trip.'
                    : 'Add the distance agreed with the plant to compare it with the kilometres driven.'
                  : 'Save the plant and drop as places to set SAP for this route.'}
              </p>
              {route && !entry && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil size={13} aria-hidden="true" />
                  Set SAP distance
                </Button>
              )}
            </div>
          )}
          {(q.data?.history || []).length > 0 && (
            <details className="sap-disclosure">
              <summary>
                <History size={13} aria-hidden="true" /> Earlier SAP on this route
              </summary>
              <ul>
                {q.data.history.map((h) => (
                  <li key={h._id}>
                    {kmText(h.sapKm)} {BASIS_LABEL[h.basis]?.toLowerCase()} ·{' '}
                    {SOURCE_LABEL[h.source] || SOURCE_LABEL.MANUAL}
                    {h.supersededAt
                      ? ` · replaced ${new Date(h.supersededAt).toLocaleDateString('en-IN')}`
                      : ''}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </SapRequestState>
      <aside className="sap-route-help" aria-label="About SAP distance">
        <span className="sap-route-help-icon">
          <Truck size={28} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div>
          <h3>What does SAP mean here?</h3>
          <p>
            SAP is the route distance agreed with the plant for payment. We compare it with the
            truck’s actual GPS distance to show extra or fewer kilometres.
          </p>
          <p>One way counts the loaded run. Round trip counts the loaded run and the return.</p>
          <span className="sap-route-help-example">
            Example: 200 km agreed, 220 km driven = 20 km extra.
          </span>
        </div>
      </aside>
      {(entry || (isEnabled('routesV2') && trip.routeLeg)) && (
        <div className="sap-route-footer">
          {isEnabled('routesV2') && trip.routeLeg && (
            <Link
              className="sap-link"
              to={`/place-hub?tab=routes&routeView=deliveries&delivery=${trip.routeLeg._id}`}
            >
              Usual for this route: {kmText(trip.routeLeg.km?.p50)} ({trip.routeLeg.n} trips)
              <ArrowUpRight size={14} />
            </Link>
          )}
          {entry && (
            <Button variant="ghost" size="sm" disabled={remove.loading} onClick={removeSap}>
              Remove route SAP
            </Button>
          )}
        </div>
      )}
      {editing && route && (
        <SetSapDialog
          from={{ id: route.fromSiteId, name: route.fromName || trip.pickup?.name }}
          to={{ id: route.toSiteId, name: route.toName || trip.drop?.name }}
          current={entry}
          onClose={() => setEditing(false)}
          onSaved={saved}
        />
      )}
    </section>
  );
}
