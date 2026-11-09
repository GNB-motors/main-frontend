import { Link } from 'react-router-dom';
import { fmtDayTime } from './autoTripFormat';
import { deviationHref } from './tripDeviations';
import {
  costBasisLabel,
  costKnown,
  extraKnown,
  isOpen,
  legLabel,
  runWindow,
} from '../RouteHub/views/deviation/deviationRules.js';

const inr = (n) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;

/**
 * Where this trip left its usual route. Each detour can be replayed from the
 * moment it started, or opened on the Route Hub deviation map. `focusId`
 * (from ?deviation=) is the one the owner arrived for.
 *
 * A distance or cost the server could not measure is a dash, never 0 km or
 * ₹0: the old backend sent 0 for "not measured", so a measured zero and an
 * unmeasured figure are told apart by the same rules the deviation screen
 * uses.
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
  // No detours: no card at all, rather than a column of reassurance.
  if (!deviations.length) return null;

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
                <span>{d.maxOffKm != null ? `${Number(d.maxOffKm).toFixed(1)} km off at most` : '— off at most'}</span>
                <span title={extraKnown(d) ? undefined : 'Not estimated'}>
                  {extraKnown(d) ? `+${Number(d.extraKmEstimate).toFixed(1)} km` : '—'}
                </span>
                <span title={costKnown(d) ? costBasisLabel(d) : 'Not estimated'}>
                  {costKnown(d) ? `${inr(d.estimatedExtraCostInr)} est.` : '—'}
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
      ) : null}
    </div>
  );
}
