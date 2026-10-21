import { Fragment, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useApi from '../../../hooks/useApi';
import useMutation from '../../../hooks/useMutation';
import { getUserRole } from '../../../utils/session';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import SapPill from '../../Sap/SapPill';
import SapRequestState from '../../Sap/SapRequestState';
import { canEditSap, compareSap, kmText } from '../../Sap/sapModel';
import { minutesLabel } from './model/unitLabels';
import useReportPage from '../../Reports/reports/useReportPage';
function DeliveryDetail({ id, onChanged }) {
  const q = useApi((signal) => PlaceIntelligenceService.getDeliveryLeg(id, { signal }), [id]);
  const m = useMutation(PlaceIntelligenceService.reviewDeliveryLeg);
  const [note, setNote] = useState('');
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
  return (
    <div className="sap-panel">
      <SapRequestState query={q}>
        <div className="sap-stack">
          {canEditSap(getUserRole()) && (
            <div className="sap-row">
              <label>
                Review note (optional)
                <input
                  aria-label="Review note (optional)"
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="sap-btn"
                disabled={m.loading}
                onClick={() => act('ACCEPTED')}
              >
                Accept
              </button>
              <button
                type="button"
                className="sap-btn"
                disabled={m.loading}
                onClick={() => act('REJECTED')}
              >
                Reject
              </button>
            </div>
          )}
          <h3>Trips on this route</h3>
          {!(q.data?.samples || []).length && <p>No samples available.</p>}
          {(q.data?.samples || []).map((s, i) => (
            <div className="sap-row" key={s.autoTripId || i}>
              <Link className="sap-link" to={`/auto-trips/${s.autoTripId}`}>
                {s.registrationNumber || 'Open trip'}
              </Link>
              <span>
                {s.departedAt
                  ? new Date(s.departedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
                  : '—'}{' '}
                · {kmText(s.km)} · {minutesLabel(s.minutes)}
              </span>
            </div>
          ))}
        </div>
      </SapRequestState>
    </div>
  );
}
export default function DeliveryRoutes({ version }) {
  const [search, setSearch] = useState('');
  const [review, setReview] = useState('');
  const [page, setPage] = useReportPage(`${search}|${review}`);
  const [params, setParams] = useSearchParams();
  const openId = params.get('leg');
  const q = useApi(
    (signal) =>
      PlaceIntelligenceService.listDeliveryLegs(
        { search: search || undefined, review: review || undefined, page, limit: 50 },
        { signal },
      ),
    [search, review, page, version],
  );
  const toggle = (id) => {
    const next = new URLSearchParams(params);
    if (openId === id) next.delete('leg');
    else next.set('leg', id);
    setParams(next, { replace: true });
  };
  const rows = q.data?.records || q.data?.rows || q.data?.items || [];
  const total = q.data?.total ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / 50));
  return (
    <div className="sap-panel">
      <div className="sap-row">
        <label>
          Search deliveries
          <input
            type="search"
            aria-label="Search deliveries"
            maxLength={100}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {[
          ['', 'Usual routes'],
          ['NEEDS_REVIEW', 'Needs review'],
          ['REJECTED', 'Rejected'],
        ].map(([key, label]) => (
          <button
            type="button"
            className="sap-btn"
            key={key}
            aria-pressed={review === key}
            onClick={() => setReview(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {q.loading && q.data && <p role="status">Updating routes…</p>}
      <SapRequestState query={q}>
        <div className="sap-stack">
          {openId && !rows.some((r) => r._id === openId) && (
            <DeliveryDetail key={openId} id={openId} onChanged={q.refetch} />
          )}
          {!rows.length ? (
            <p>No delivery routes in this view.</p>
          ) : (
            <div className="sap-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Delivery</th>
                    <th>Trips</th>
                    <th>Trucks</th>
                    <th>Usual km</th>
                    <th>90th percentile km</th>
                    <th>Usual time</th>
                    <th>Fuel / km</th>
                    <th>SAP km</th>
                    <th>Review</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <Fragment key={r._id}>
                      <tr>
                        <td>
                          <button
                            className="pi-btn-quiet"
                            type="button"
                            aria-expanded={openId === r._id}
                            onClick={() => toggle(r._id)}
                          >
                            {r.fromName} → {r.toName}
                          </button>
                        </td>
                        <td>{r.n}</td>
                        <td>{r.trucks}</td>
                        <td>{kmText(r.km?.p50)}</td>
                        <td>{kmText(r.km?.p90)}</td>
                        <td>{minutesLabel(r.minutes?.p50)}</td>
                        <td>
                          {r.fuelPerKm?.p50 == null ? '—' : `${r.fuelPerKm.p50.toFixed(2)} L`}
                        </td>
                        <td>
                          {kmText(r.sap?.sapKm)}{' '}
                          <SapPill
                            comparison={
                              r.sap?.oneWay ??
                              compareSap(r.km?.p50, r.sap?.sapKm, r.sap?.tolerancePct ?? 10)
                            }
                            tolerance={r.sap?.tolerancePct ?? 10}
                          />
                        </td>
                        <td>{r.review?.replaceAll('_', ' ')}</td>
                      </tr>
                      {openId === r._id && (
                        <tr>
                          <td colSpan={9}>
                            <DeliveryDetail id={r._id} onChanged={q.refetch} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="sap-row">
            <span>
              Page {page} of {totalPages} · {total} routes
            </span>
            <button
              type="button"
              className="sap-btn"
              disabled={page <= 1 || q.loading}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <button
              type="button"
              className="sap-btn"
              disabled={page >= totalPages || q.loading}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </SapRequestState>
    </div>
  );
}
