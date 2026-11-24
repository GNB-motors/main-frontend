import { Link } from 'react-router-dom';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import { intelligenceLink, trackLink } from '../../utils/redesign/links';
import { HistoryChart } from '../Vehicle360/panels/TelemetryHistory';
import { fuelReadingLabel, isFuelIssue } from './inboxModel';

const stamp = (value) => (value ? Date.parse(value) : NaN);

export default function FuelAlertEvidence({ item }) {
  if (
    !isFuelIssue(item) ||
    !item.subjectKey ||
    item.subjectKey === 'ORG' ||
    item.subjectKey.includes(':')
  )
    return null;
  const reading = [...(item.sources || [])]
    .reverse()
    .find((source) => Number.isFinite(stamp(source.from)) && stamp(source.to) > stamp(source.from));
  const reg = item.subjectKey;
  const fuelLink = intelligenceLink({
    tab: 'fuel',
    vehicle: reg,
    from: reading?.from,
    to: reading?.to,
  });
  return (
    <section className="ai-detail-card" aria-label="Fuel evidence">
      <h3>Fuel evidence</h3>
      {fuelReadingLabel(item) ? <p>{fuelReadingLabel(item)}</p> : null}
      <div className="ai-toolbar-controls">
        <Link to={`/vehicles/${encodeURIComponent(reg)}?tab=fuel`}>Open truck fuel tab</Link>
        <Link to={`${fuelLink}&fuelView=drain`}>Open Fuel checks</Link>
        {reading ? (
          <Link to={trackLink({ reg, from: reading.from, to: reading.to })}>
            Open tracking for this window
          </Link>
        ) : null}
      </div>
      {reading ? (
        <ReportedFuelHistory reg={reg} from={stamp(reading.from)} to={stamp(reading.to)} />
      ) : (
        <p>The source did not provide a time window for a fuel-level chart.</p>
      )}
    </section>
  );
}

function ReportedFuelHistory({ reg, from, to }) {
  const age = Math.max(1, Math.ceil((Date.now() - from) / 86400000));
  const query = useApi(
    (signal) =>
      FleetDataService.getVehicleHealth(reg, { days: Math.min(90, age), limit: 2000 }, signal),
    [reg, from, to],
    { scopeKey: `${reg}:${from}:${to}` },
  );
  const series = (query.data?.history || []).flatMap((point) => {
    const at = stamp(point.pulledAt);
    if (!Number.isFinite(at) || at < from || at > to) return [];
    const n = point.primaryFuelLevel;
    return [{ at, value: Number.isFinite(n) && n >= 0 && n <= 100 ? n : null }];
  });
  return (
    <HistoryChart
      title="Recorded tank level in the report window"
      unit="%"
      series={series}
      query={query}
      from={from}
      to={to}
      scale={[0, 100]}
      note="Recorded sensor readings can include both driving and parked periods."
    />
  );
}
