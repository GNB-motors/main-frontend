import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ChevronDown, History } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { formatDuration, formatIst } from '../../utils/redesign/format';
import { tripsHistoryLink } from '../../utils/redesign/links';
import { placeApiId } from './placePanelModel.js';
import { compactDuration } from './placeDetailFormat.js';

export default function PlaceRecentVisits({ place, limit = 10 }) {
  const siteId = placeApiId(place);
  const [expanded, setExpanded] = useState(false);
  const { data, loading, error } = useApi(
    (signal) => fleetViewService.getTripsHistory({ site: siteId, limit, signal }),
    [siteId, limit],
    { enabled: Boolean(siteId) },
  );
  const visits = useMemo(
    () => (Array.isArray(data?.items) ? data.items : []).slice(0, limit),
    [data, limit],
  );
  if (!siteId) return null;
  const shown = expanded ? visits : visits.slice(0, 5);
  return (
    <section className="pd-section pd-visits" aria-label="Recent visits">
      <div className="pd-section-head">
        <h3>
          <History size={15} aria-hidden="true" /> Recent visits
        </h3>
        <Link className="pd-text-link" to={tripsHistoryLink({ site: siteId })}>
          All visits <ArrowUpRight size={13} aria-hidden="true" />
        </Link>
      </div>
      {loading ? (
        <p className="pd-empty" role="status">
          Loading visits…
        </p>
      ) : error ? (
        <p className="pd-empty" role="status">
          Visit history could not be loaded. Reopen this place to try again.
        </p>
      ) : visits.length === 0 ? (
        <p className="pd-empty">No recorded visits to this place yet.</p>
      ) : (
        <>
          <div className="pd-visit-columns">
            <span>Vehicle / arrival</span>
            <span>Time on site</span>
          </div>
          <ul className="pd-visit-list">
            {shown.map((visit, index) => (
              <li key={`${visit.registrationNumber}-${visit.arrivedAt ?? visit.kind}-${index}`}>
                <div className="pd-visit-vehicle">
                  <strong>{visit.registrationNumber || 'Vehicle not known'}</strong>
                  <span>
                    {visit.arrivedAt ? formatIst(visit.arrivedAt) : 'Arrival not recorded'}
                  </span>
                </div>
                <span className="pd-visit-dwell" title={formatDuration(visit.dwellMin)}>
                  {compactDuration(visit.dwellMin)}
                </span>
              </li>
            ))}
          </ul>
          {visits.length > 5 ? (
            <button
              type="button"
              className="pd-show-visits"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show fewer visits' : `Show ${visits.length - 5} more visits`}
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
