import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import useMutation from '../../hooks/useMutation';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { getUserRole } from '../../utils/session';
import SapService from '../../services/SapService';
import SapPill from './SapPill';
import SapRequestState from './SapRequestState';
import SapLabelPicker from './SapLabelPicker';
import SetSapDialog from './SetSapDialog';
import { canEditSap, kmText, signed } from './sapModel';
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
    {
      enabled: canEdit,
    },
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
    <section className="atx-card sap-panel atx-span-2" aria-label="Route SAP">
      <div className="sap-row">
        <h2>Route SAP</h2>
        {canEdit && (
          <Link className="sap-link" to="/reports?report=laneKm&sapTab=review">
            Link SAP sheet to places
          </Link>
        )}
      </div>
      <p>
        {current.pickup?.name || 'Plant'} → {current.drop?.name || 'Drop not known'}
      </p>
      <SapRequestState query={viewQuery}>
        <div className="sap-stack">
          {sap?.status === 'MATCHED' ? (
            <>
              <p>
                {sap.fromLabel || current.pickup?.name} → {sap.toLabel || current.drop?.name}{' '}
                <span className="sap-muted">
                  {sap.source === 'MANUAL' ? 'entered by a person' : 'from SAP sheet'}
                </span>
              </p>
              {sap.multipleSap && (
                <p>
                  Sheet SAP values:{' '}
                  {(sap.values || []).map((v, i) => (
                    <span key={v}>
                      {i ? ' / ' : ''}
                      {v === sap.sapKm ? <strong>{v}</strong> : v}
                    </span>
                  ))}{' '}
                  km
                </p>
              )}
              <div className="sap-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Comparison</th>
                      <th>SAP</th>
                      <th>Actual</th>
                      <th>Δ km</th>
                      <th>Δ %</th>
                      <th>Verdict</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['One-way', sap.sapKm, sap.oneWay],
                      ['Round trip', sap.roundTrip?.sapKm, sap.roundTrip],
                    ].map(([label, reference, c]) => (
                      <tr key={label}>
                        <th>
                          {label}
                          <div className="sap-muted">
                            {label === 'One-way' ? 'Loaded km' : 'Loaded + return km'}
                          </div>
                        </th>
                        <td>{kmText(reference)}</td>
                        <td>{kmText(c?.actualKm)}</td>
                        <td>{signed(c?.deltaKm)}</td>
                        <td>{signed(c?.deltaPct, '%')}</td>
                        <td>
                          <SapPill comparison={c} tolerance={sap.tolerancePct} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : sap ? (
            <SapPill sap={sap} />
          ) : (
            <p className="sap-muted">SAP not computed yet</p>
          )}
          {canEdit && (
            <>
              <div className="sap-row">
                <button
                  className="sap-btn"
                  type="button"
                  disabled={
                    !current.pickup?.orgSiteId || !current.drop?.orgSiteId || mutation.loading
                  }
                  onClick={() => setEditing(true)}
                >
                  Set SAP km
                </button>
                {q.data?.routeKm && (
                  <button
                    className="sap-btn"
                    type="button"
                    disabled={mutation.loading}
                    onClick={() => act('removeRouteKm', q.data.routeKm._id)}
                  >
                    Remove manual SAP
                  </button>
                )}
              </div>
              {!current.drop?.orgSiteId && (
                <p className="sap-muted">Save a drop place before setting SAP for this route.</p>
              )}
              {['DROP', 'PLANT'].map((kind) => {
                const site = kind === 'DROP' ? current.drop : current.pickup;
                return site?.orgSiteId ? (
                  <details className="sap-box" key={kind}>
                    <summary>This {kind.toLowerCase()} is … in the SAP sheet</summary>
                    {(q.data?.candidates?.suggestions || [])
                      .filter((s) => s.kind === kind)
                      .map((s) => (
                        <div className="sap-row" key={s.label}>
                          <span>
                            {s.label} · {Math.round(s.score * 100)}% match ·{' '}
                            {(s.sapValues || []).join(' / ')} km
                          </span>
                          <button
                            type="button"
                            className="sap-btn"
                            disabled={mutation.loading}
                            onClick={() => alias(kind, s.label)}
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            className="sap-btn"
                            disabled={mutation.loading}
                            onClick={() => alias(kind, s.label, 'REJECTED')}
                          >
                            Not this one
                          </button>
                        </div>
                      ))}
                    <SapLabelPicker
                      kind={kind}
                      disabled={mutation.loading}
                      onChoose={(label) => alias(kind, label)}
                    />
                  </details>
                ) : null;
              })}
            </>
          )}
        </div>
      </SapRequestState>
      {isEnabled('routesV2') && trip.routeLeg && (
        <Link className="sap-link" to={`/place-hub?tab=deliveries&leg=${trip.routeLeg._id}`}>
          Usual for this route: {kmText(trip.routeLeg.km?.p50)} ({trip.routeLeg.n} trips)
        </Link>
      )}
      {editing && <SetSapDialog trip={current} onClose={() => setEditing(false)} onSaved={saved} />}
    </section>
  );
}
