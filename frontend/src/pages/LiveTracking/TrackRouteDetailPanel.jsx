import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Clock3, Route, Truck, Expand, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi.js';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';
import { kmLabel, minutesLabel } from '../PlaceHub/intelligence/model/unitLabels.js';
import { formatDateTimeIST } from '../../utils/dateUtils.js';

/** Learned route IDs come from routes/map and use routes/legs/:id. */
export default function TrackRouteDetailPanel({ id, leg, focus, onDetail, onFit, onClose, docked = false }) {
  const query = useApi((signal) => PlaceIntelligenceService.getLeg(id, { signal }), [id], { enabled: Boolean(id) });
  const [runLimit, setRunLimit] = useState(5);
  const detail = String(query.data?._id) === String(id) ? query.data : null;
  useEffect(() => {
    onDetail?.(detail);
    return () => onDetail?.(null);
  }, [detail, onDetail]);
  if (!id) return null;
  const route = detail || leg;
  const runs = [...(detail?.traversals || [])].sort((a, b) => (Date.parse(b.departedAt) || 0) - (Date.parse(a.departedAt) || 0));
  const count = detail?.count ?? leg?.traversals;
  const names = leg?.title?.split(' → ') || [];
  const source = focus?.source || route?.path?.source;
  const roadLabel = source === 'DRIVEN' ? 'Driven by your trucks' : source === 'ENGINE' ? 'Estimated road path' : 'Road path unavailable';
  return (
    <section role="dialog" aria-label="Route detail"
      className={docked ? 'lt-route-detail railview' : 'lt-route-detail lt-route-detail--floating'}>
      <div className="lt-route-detail-nav">
        <button type="button" onClick={onClose} className="lt-route-back"><ArrowLeft size={16} aria-hidden="true" />All routes</button>
        <span>Route overview</span>
      </div>
      <div className="lt-route-detail-scroll">
        <div className="lt-route-hero">
          <span className={`lt-route-evidence ${source === 'DRIVEN' ? 'is-driven' : ''}`}><Route size={13} aria-hidden="true" />{source === 'DRIVEN' ? 'Driven route' : source === 'ENGINE' ? 'Estimated route' : 'Learned route'}</span>
          <div className="lt-route-endpoints" aria-label="Route start and end">
            <div className="lt-route-endpoint"><span className="lt-route-letter is-start">A</span><div><small>START</small><h3>{focus?.start.name || names[0] || 'Start place'}</h3></div></div>
            <div className="lt-route-endpoint"><span className="lt-route-letter is-end">B</span><div><small>END</small><h3>{focus?.end.name || names[1] || 'End place'}</h3></div></div>
          </div>
          {onFit ? <button type="button" className="lt-route-fit" onClick={onFit}><Expand size={14} aria-hidden="true" />Fit route on map<ArrowUpRight size={14} aria-hidden="true" /></button> : null}
        </div>
        {route ? <div className="lt-route-summary">
          <div className="lt-route-section-heading"><h4>Typical journey</h4><span>Across recorded runs</span></div>
          <dl className="lt-route-metrics">
            <div><dt><Route size={14} aria-hidden="true" />Usual distance</dt><dd>{kmLabel(route.stats?.km?.p50)}</dd></div>
            <div><dt><Clock3 size={14} aria-hidden="true" />Usual time</dt><dd>{minutesLabel(route.stats?.minutes?.p50)}</dd></div>
          </dl>
          <dl className="lt-route-secondary-stats"><div><dt>Recorded runs</dt><dd>{count ?? '—'}</dd></div><div><dt>Slow run (1 in 10)</dt><dd>{minutesLabel(route.stats?.minutes?.p90)}</dd></div></dl>
          <div className="lt-route-road-note"><span className="lt-route-road-dot" /><div><strong>{roadLabel}</strong><span>{source === 'DRIVEN' || source === 'ENGINE' ? `${kmLabel(route.path?.km)} mapped road distance` : 'Only known start and end places are shown.'}</span></div></div>
        </div> : null}
        {query.loading ? <p className="lt-route-feedback" role="status">Loading route details…</p> : null}
        {query.error ? <div className="lt-route-feedback" role="alert"><p>Could not load route details.</p><button type="button" className="ph-btn ph-btn--sm" onClick={query.refetch}>Retry route details</button></div> : null}
        {detail ? <div className="lt-route-history">
          <div className="lt-route-section-heading"><h4>Recent runs</h4><span>Latest first</span></div>
          {!runs.length ? <p className="lt-route-empty">No recent runs recorded.</p> : <>
            <ul className="lt-route-run-cards">{runs.slice(0, runLimit).map((run, index) => <li key={`${run.autoTripId || run.tourId || run.registrationNumber}:${run.departedAt}:${index}`}>
              <div className="lt-route-run-head"><span className="lt-route-truck"><Truck size={15} aria-hidden="true" /></span>
                {run.autoTripId ? <Link to={`/auto-trips/${run.autoTripId}`} className="lt-route-trip-link">{run.registrationNumber || 'Vehicle unknown'}<ArrowUpRight size={13} aria-hidden="true" /></Link> : <strong>{run.registrationNumber || 'Vehicle unknown'}</strong>}
              </div>
              <time className="lt-route-run-time">{formatDateTimeIST(run.departedAt)}</time>
              <div className="lt-route-run-metrics"><span><Route size={13} aria-hidden="true" />{kmLabel(run.km)}</span><span><Clock3 size={13} aria-hidden="true" />{minutesLabel(run.minutes)}</span></div>
              {run.why?.length ? <details className="lt-route-run-notes"><summary>Run notes<ChevronDown size={13} aria-hidden="true" /></summary><p>{run.why.join('; ')}</p></details> : null}
            </li>)}</ul>
            <div className="lt-route-history-footer"><span>Showing {Math.min(runLimit, runs.length)} of {runs.length} available runs</span>
              {runLimit < runs.length ? <button type="button" onClick={() => setRunLimit((n) => n + 10)}>Show more</button> : null}
            </div>
          </>}
        </div> : null}
      </div>
    </section>
  );
}
