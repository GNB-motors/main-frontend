import { useEffect } from 'react';
import { ArrowRight, Clock, Route } from 'lucide-react';
import useApi from '../../../hooks/useApi';
import PlaceIntelligenceService from '../intelligence/PlaceIntelligenceService.js';
import { messageOf } from '../intelligence/model/requestOutcome.js';
import { kmLabel, minutesLabel } from '../intelligence/model/unitLabels.js';
import { formatDateTimeIST } from '../../../utils/dateUtils.js';
import { formatInrCompact } from '../../../utils/formatters.js';
import LegEnd from '../intelligence/LegEnd.jsx';
import Frame from './Frame.jsx';
import Stats from './Stats.jsx';

// How the drawn line was obtained, phrased the way the map legend and tooltip do.
const SOURCE = {
  DRIVEN: { label: 'Road our trucks drove', tone: 'driven' },
  ENGINE: { label: 'Likely road · estimated', tone: 'engine' },
  NONE: { label: 'Straight-line link', tone: 'none' },
};

export default function LegDetail({
  leg,
  sites,
  onClose,
  onPick,
  onDetail,
  showEngine,
  onShowEngine,
  version,
}) {
  const { data, loading, error } = useApi(
    (signal) => PlaceIntelligenceService.getLeg(leg._id, { signal }),
    [leg._id, version],
  );
  useEffect(() => {
    onDetail(data?._id === leg._id ? data : null);
    return () => onDetail(null);
  }, [data, leg._id, onDetail]);
  const detail = data?._id === leg._id ? data : null;
  const path = detail?.path || leg.path;
  const engine = detail?.engine || leg.engine;
  const vehicles = Object.entries(detail?.byVehicle || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topTruck = vehicles.length ? vehicles[0][1] : 1;
  const source = SOURCE[path?.source] || SOURCE.NONE;
  return (
    <Frame
      title={
        <>
          <LegEnd site={sites.get(String(leg.fromSiteId))} fallback="UNKNOWN" /> →{' '}
          <LegEnd site={sites.get(String(leg.toSiteId))} fallback="UNKNOWN" />
        </>
      }
      eyebrow="Route leg"
      label="Route leg details"
      onClose={onClose}
    >
      {/* Google-Maps-style summary: the route's headline time and distance up top. */}
      <div className="ph-route-hero">
        <div className="ph-route-hero-primary">
          <Clock size={18} aria-hidden="true" />
          <span className="ph-route-hero-time">{minutesLabel(leg.stats?.minutes?.p50)}</span>
          <span className="ph-route-hero-sep" aria-hidden="true" />
          <span className="ph-route-hero-dist">{kmLabel(leg.stats?.km?.p50)}</span>
        </div>
        <div className="ph-route-hero-meta">
          <span className={`ph-route-badge ph-route-badge--${source.tone}`}>{source.label}</span>
          <span className="ph-route-hero-passes">
            {leg.traversals} {leg.traversals === 1 ? 'pass' : 'passes'}
            {leg.fuelCostP50 != null && (
              <>
                {' · '}
                <span title={leg.costBasis}>{formatInrCompact(leg.fuelCostP50)} fuel</span>
              </>
            )}
          </span>
        </div>
      </div>

      {detail?.reverseLegId && (
        <div className="ph-route-dir" role="group" aria-label="Direction">
          <button type="button" className="is-active" aria-pressed="true">
            <ArrowRight size={14} aria-hidden="true" /> This direction
          </button>
          <button type="button" onClick={() => onPick(String(detail.reverseLegId))}>
            Reverse
          </button>
        </div>
      )}

      <Stats
        items={[
          { label: 'Leg passes', value: leg.traversals },
          { label: 'Slow pass (1 in 10)', value: minutesLabel(leg.stats?.minutes?.p90) },
          {
            label: 'Fuel per km',
            value:
              leg.stats?.fuelPerKm?.p50 != null
                ? `${leg.stats.fuelPerKm.p50.toFixed(2)} L/km`
                : '—',
          },
          {
            label: 'Fuel cost',
            value: (
              <span title={leg.costBasis}>
                {leg.fuelCostP50 != null ? formatInrCompact(leg.fuelCostP50) : '—'}
              </span>
            ),
          },
        ]}
      />

      <section className="ph-route-sec" aria-labelledby="ph-road-h">
        <h3 id="ph-road-h" className="ph-route-sec-head">
          <Route size={15} aria-hidden="true" /> Road
        </h3>
        <div className="ph-route-road">
          {path?.source === 'DRIVEN' ? (
            <>
              <p>
                Our trucks drove <strong>{kmLabel(path.km)}</strong> on this leg.
              </p>
              {path.agreement != null && path.agreement < 0.6 && (
                <p className="ph-route-note">Trucks split between more than one road here.</p>
              )}
            </>
          ) : (
            <p>
              {path?.source === 'ENGINE'
                ? 'Likely road; no matched pass yet.'
                : 'No road line yet; shown as a straight-line link.'}
            </p>
          )}
          {leg.detourKm != null && engine && (
            <>
              <p className="ph-route-note">
                Engine estimate {kmLabel(engine.km)} — driven path is {kmLabel(leg.detourKm)}{' '}
                longer.
              </p>
              <label className="ph-route-toggle">
                <input
                  type="checkbox"
                  aria-label="Show engine estimate on map"
                  checked={showEngine}
                  disabled={!detail?.engine?.geom}
                  onChange={(e) => onShowEngine(e.target.checked)}
                />{' '}
                Show estimate on map
              </label>
            </>
          )}
        </div>
      </section>

      {loading && <p role="status">Loading leg passes…</p>}
      {error && <p role="alert">{messageOf(error, 'Could not load this leg')}</p>}

      {vehicles.length > 0 && (
        <section className="ph-route-sec" aria-label="Trucks on this leg">
          <h3 className="ph-route-sec-head">Trucks on this leg</h3>
          <ul className="ph-route-trucks">
            {vehicles.map(([reg, count]) => (
              <li key={reg}>
                <span className="ph-route-truck-reg">{reg}</span>
                <span className="ph-route-truck-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(8, (count / topTruck) * 100)}%` }} />
                </span>
                <span className="ph-route-truck-count">
                  {count} {count === 1 ? 'pass' : 'passes'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="ph-route-sec" aria-label="Recent leg passes">
        <h3 className="ph-route-sec-head">Recent leg passes</h3>
        {detail && !detail.traversals?.length && (
          <p className="ph-muted">No leg passes recorded yet.</p>
        )}
        <ul className="ph-route-runs">
          {(detail?.traversals || []).slice(0, 15).map((run) => (
            <li key={`${run.autoTripId || run.tourId || run.registrationNumber}:${run.departedAt}`}>
              <div className="ph-route-run-top">
                <strong>{run.registrationNumber}</strong>
                <span>
                  {minutesLabel(run.minutes)} · {kmLabel(run.km)}
                </span>
              </div>
              <span>{formatDateTimeIST(run.departedAt)}</span>
              <span>{run.why?.length ? run.why.join('; ') : 'Normal run'}</span>
            </li>
          ))}
        </ul>
      </section>
    </Frame>
  );
}
