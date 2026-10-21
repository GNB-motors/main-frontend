import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import useApi from '../../hooks/useApi';
import useMutation from '../../hooks/useMutation';
import SapService from '../../services/SapService';
import PlacePicker from './PlacePicker';
import SapRequestState from './SapRequestState';
import SapLabelPicker from './SapLabelPicker';
import { canEditSap } from './sapModel';
import { getUserRole } from '../../utils/session';
function PlantLink({ plant, disabled, onLink }) {
  return (
    <div className="sap-stack">
      {(plant.suggestions || []).map((s) => (
        <div className="sap-row" key={s.orgSiteId || s._id}>
          <span>{s.name || s.label}</span>
          <button
            type="button"
            className="sap-btn"
            disabled={disabled}
            onClick={() => onLink(s.orgSiteId || s._id)}
          >
            Confirm suggested place
          </button>
        </div>
      ))}
      <PlacePicker label="Search a plant place" disabled={disabled} onChoose={onLink} />
    </div>
  );
}
export default function SapMatchReview() {
  const q = useApi((signal) => SapService.matchReview({ signal }), []);
  const m = useMutation(SapService.alias);
  const canEdit = canEditSap(getUserRole());
  const alias = async (kind, label, orgSiteId, status = 'CONFIRMED') => {
    try {
      await m.mutate({ kind, label, orgSiteId, status });
      q.refetch();
      toast.success('SAP updated — trips refresh shortly');
    } catch (e) {
      toast.error(e?.message || 'Could not link place');
    }
  };
  return (
    <section className="sap-panel">
      <h2>Link SAP sheet to places</h2>
      <SapRequestState query={q}>
        <div className="sap-stack">
          <h3>Sheet plants</h3>
          {(q.data?.plants || []).map((p) => (
            <article className="sap-box" key={p.label}>
              <strong>
                {p.label} · {p.laneCount} lanes
              </strong>
              <p>Linked to: {(p.sites || []).map((s) => s.name).join(', ') || 'No place yet'}</p>
              {canEdit && (
                <PlantLink
                  plant={p}
                  disabled={m.loading}
                  onLink={(id) => alias('PLANT', p.label, id)}
                />
              )}
            </article>
          ))}
          <h3>Drops, by trips affected</h3>
          {!(q.data?.drops || []).length && <p>No drops waiting for a link.</p>}
          {(q.data?.drops || []).map((d) => (
            <article className="sap-box" key={d.orgSiteId}>
              <strong>
                {d.name || 'Unnamed drop'} · {d.tripCount} trips
              </strong>
              <p>Sheet label: {d.label || 'Not linked'}</p>
              {canEdit && (
                <>
                  {(d.suggestions || []).map((s) => (
                    <div className="sap-row" key={s.label}>
                      <span>
                        {s.label} · {Math.round(s.score * 100)}% · {(s.sapValues || []).join(' / ')}{' '}
                        km
                      </span>
                      <button
                        className="sap-btn"
                        type="button"
                        disabled={m.loading}
                        onClick={() => alias('DROP', s.label, d.orgSiteId)}
                      >
                        Confirm
                      </button>
                      <button
                        className="sap-btn"
                        type="button"
                        disabled={m.loading}
                        onClick={() => alias('DROP', s.label, d.orgSiteId, 'REJECTED')}
                      >
                        Not this one
                      </button>
                    </div>
                  ))}
                  <SapLabelPicker
                    kind="DROP"
                    disabled={m.loading}
                    onChoose={(label) => alias('DROP', label, d.orgSiteId)}
                  />
                  <Link
                    className="sap-link"
                    to={`/auto-trips?dropSiteId=${encodeURIComponent(d.orgSiteId)}&dropName=${encodeURIComponent(d.name || 'Unnamed drop')}&range=all`}
                  >
                    Set SAP km manually on a trip →
                  </Link>
                </>
              )}
            </article>
          ))}
          <div className="sap-box">
            <h3>Unnamed drops: {q.data?.unnamedDrops?.count ?? 0}</h3>
            <Link className="sap-link" to="/place-hub">
              Name places in Place Hub
            </Link>
            {(q.data?.unnamedDrops?.top || []).map((d, i) => (
              <p key={i}>
                {d.lat}, {d.lng} · {d.tripCount} trips
              </p>
            ))}
            <p>Unused sheet labels: {q.data?.unusedLabels ?? 0}</p>
          </div>
        </div>
      </SapRequestState>
    </section>
  );
}
