import { useEffect } from 'react';
import useApi from '../../../hooks/useApi';
import PlaceIntelligenceService from '../intelligence/PlaceIntelligenceService.js';
import { messageOf } from '../intelligence/model/requestOutcome.js';
import { kmLabel, minutesLabel } from '../intelligence/model/unitLabels.js';
import { formatDateTimeIST } from '../../../utils/dateUtils.js';
import { formatInrCompact } from '../../../utils/formatters.js';
import LegEnd from '../intelligence/LegEnd.jsx';
import Frame from './Frame.jsx';
import Stats from './Stats.jsx';

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
      {detail?.reverseLegId && (
        <div className="ph-route-chips" aria-label="Direction">
          <button type="button" aria-pressed="true">
            → This direction
          </button>
          <button type="button" onClick={() => onPick(String(detail.reverseLegId))}>
            ← Reverse direction
          </button>
        </div>
      )}
      <Stats
        items={[
          { label: 'Runs', value: leg.traversals },
          { label: 'Usual time', value: minutesLabel(leg.stats?.minutes?.p50) },
          { label: 'Slow run (1 in 10)', value: minutesLabel(leg.stats?.minutes?.p90) },
          { label: 'Usual distance', value: kmLabel(leg.stats?.km?.p50) },
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
      <h3>Road</h3>
      {path?.source === 'DRIVEN' ? (
        <>
          <p>Our trucks: {kmLabel(path.km)}</p>
          {path.agreement != null && path.agreement < 0.6 && (
            <p>Trucks split between more than one road on this leg.</p>
          )}
        </>
      ) : (
        <p>
          {path?.source === 'ENGINE'
            ? 'Likely road; no matched run yet.'
            : 'No road line yet; shown as a straight-line link.'}
        </p>
      )}
      {leg.detourKm != null && engine && (
        <>
          <p>
            Truck route (engine estimate): {kmLabel(engine.km)}. Our driven path is{' '}
            {kmLabel(leg.detourKm)} longer.
          </p>
          <label>
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
      {loading && <p role="status">Loading runs…</p>}
      {error && <p role="alert">{messageOf(error, 'Could not load this leg')}</p>}
      {vehicles.length > 0 && (
        <>
          <h3>Trucks on this leg</h3>
          <ul>
            {vehicles.map(([reg, count]) => (
              <li key={reg}>
                {reg} · {count} runs
              </li>
            ))}
          </ul>
        </>
      )}
      <h3>Recent runs</h3>
      {detail && !detail.traversals?.length && <p>No runs recorded yet.</p>}
      <ul className="ph-route-runs">
        {(detail?.traversals || []).slice(0, 15).map((run) => (
          <li key={`${run.autoTripId || run.tourId || run.registrationNumber}:${run.departedAt}`}>
            <strong>{run.registrationNumber}</strong>
            <span>{formatDateTimeIST(run.departedAt)}</span>
            <span>
              {minutesLabel(run.minutes)} · {kmLabel(run.km)}
            </span>
            <span>{run.why?.length ? run.why.join('; ') : 'Normal run'}</span>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
