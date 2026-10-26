import { Link } from 'react-router-dom';
import { fmtDayTime } from './autoTripFormat';
import { deviationHref } from './tripDeviations';
import {
  costBasisLabel,
  isOpen,
  legLabel,
  runWindow,
} from '../RouteHub/views/deviation/deviationRules.js';

const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/**
 * Where this trip left its usual route. Each detour can be replayed from the
 * moment it started, or opened on the Route Hub deviation map. `focusId`
 * (from ?deviation=) is the one the owner arrived for.
 */
export default function TripDeviationsCard({ deviations, loading, playable, onPlay, focusId }) {
  if (loading && !deviations) {
    return (
      <div className="atx-card atx-dev-card">
        <h2 className="atx-card-title">Route deviations</h2>
        <div className="atx-state">Checking the route…</div>
      </div>
    );
  }
  if (!deviations) return null;

  return (
    <div className="atx-card atx-dev-card">
      <h2 className="atx-card-title">
        Route deviations{deviations.length ? ` (${deviations.length})` : ''}
      </h2>
      {deviations.length ? (
        <ul className="atx-dev-list">
          {deviations.map((d) => (
            <li key={d._id} className={`atx-dev-item${d._id === focusId ? ' is-focus' : ''}`}>
              <div className="atx-dev-main">
                <b>{runWindow(d) || fmtDayTime(d.startedAt)}</b>
                <span className={`atx-chip${d.trip?.leg === 'LADEN' ? ' atx-chip--warn' : ''}`}>
                  {legLabel(d.trip)}
                </span>
                {isOpen(d) ? <span className="atx-chip">Please review</span> : null}
              </div>
              <div className="atx-dev-nums">
                <span>{Number(d.maxOffKm || 0).toFixed(1)} km off at most</span>
                <span>
                  {d.extraKmEstimate != null ? `+${Number(d.extraKmEstimate).toFixed(1)} km` : '—'}
                </span>
                <span title={costBasisLabel(d)}>
                  {d.estimatedExtraCostInr != null ? `${inr(d.estimatedExtraCostInr)} est.` : '—'}
                </span>
              </div>
              <div className="atx-dev-actions">
                {playable(d.startedAt) ? (
                  <button
                    type="button"
                    className="atx-btn atx-btn--sm"
                    onClick={() => onPlay(d.startedAt)}
                  >
                    Replay from here
                  </button>
                ) : null}
                <Link className="atx-btn atx-btn--sm" to={deviationHref(d._id)}>
                  Open on deviation map
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="atx-dev-none">
          No detours found. Only routes the fleet drives often have a learned usual route to compare
          against.
        </p>
      )}
    </div>
  );
}
