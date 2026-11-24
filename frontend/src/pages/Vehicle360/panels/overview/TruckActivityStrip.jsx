import { useState } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../../../hooks/useApi';
import { toISTDateString } from '../../../../utils/dateUtils';
import { formatDuration, formatNumber } from '../../../../utils/redesign/format';
import { trackLink } from '../../../../utils/redesign/links';
import IntelligenceService from '../../../Intelligence/IntelligenceService';

const metricDefinitions = [
  {
    kind: 'idle',
    label: 'Idling',
    tab: 'idling',
    params: { idleSubview: 'instances' },
    read: (s) => formatDuration(s?.totalMin),
  },
  {
    kind: 'fuel_unexplained',
    label: 'Fuel to explain',
    tab: 'fuel',
    params: { fuelSubview: 'instances' },
    read: (s) => (Number.isFinite(s?.totalL) ? `${formatNumber(s.totalL)} L` : '—'),
  },
  {
    kind: 'overspeed',
    label: 'Overspeed events',
    tab: 'overspeed',
    params: { overspeedSubview: 'instances' },
    read: (s) => formatNumber(s?.count),
  },
];

function TruckMetric({ definition, range, vehicle }) {
  const { kind, label, tab, params, read } = definition;
  const { from, to } = range;
  const result = useApi(
    (signal) => IntelligenceService.getInstances({ kind, from, to, vehicle, limit: 1, signal }),
    [kind, from, to, vehicle],
    { enabled: Boolean(vehicle), scopeKey: `${kind}:${from}:${to}:${vehicle}` },
  );
  const value =
    result.loading || result.error || result.data?.held || result.data?.truncated
      ? '—'
      : read(result.data?.summary);
  return (
    <Link to={`/intelligence?${new URLSearchParams({ tab, vehicle, from, to, ...params })}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {result.data?.truncated ? <small>Incomplete records</small> : null}
    </Link>
  );
}

export default function TruckActivityStrip({ vehicle, stops }) {
  const [week, setWeek] = useState(false);
  const today = toISTDateString(new Date());
  const start = new Date(`${today}T00:00:00+05:30`);
  if (week) start.setUTCDate(start.getUTCDate() - 6);
  const from = toISTDateString(start);
  const range = { from, to: today };
  const queueStops = Array.isArray(stops)
    ? stops.filter((s) => s.reason === 'QUEUE' && Date.parse(s.endAt) > start.getTime()).length
    : null;
  return (
    <section className="vdo-card vdo-truck-activity" aria-label="Truck activity">
      <header>
        <h3>Truck activity</h3>
        <div role="group" aria-label="Activity period">
          <button
            type="button"
            className="v360-btn"
            aria-pressed={!week}
            onClick={() => setWeek(false)}
          >
            Today
          </button>
          <button
            type="button"
            className="v360-btn"
            aria-pressed={week}
            onClick={() => setWeek(true)}
          >
            Last 7 days
          </button>
        </div>
      </header>
      <div>
        {metricDefinitions.map((definition) => (
          <TruckMetric
            key={definition.kind}
            definition={definition}
            range={range}
            vehicle={vehicle}
          />
        ))}
        <Link to={trackLink({ reg: vehicle, from: start, to: new Date() })}>
          <span>Recorded plant queues</span>
          <strong>{queueStops ?? '—'}</strong>
        </Link>
      </div>
    </section>
  );
}
