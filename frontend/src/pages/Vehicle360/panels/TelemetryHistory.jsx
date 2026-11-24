import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import useApi from '../../../hooks/useApi';
import FleetDataService from '../../../services/FleetDataService';
import { fleetViewService } from '../../../services/fleetViewService';
import { formatInIST } from '../../../utils/dateUtils';

const FUEL_LIMIT = 2000;
const windows = [
  { days: 1, label: '24 hours' },
  { days: 7, label: '7 days' },
];
const timestamp = (value) => (value == null ? NaN : new Date(value).getTime());

export function HistoryChart({ title, unit, series, query, from, to, scale, note }) {
  return (
    <section className="vdo-card">
      <h3>{title}</h3>
      {query.loading && !query.data ? (
        <p role="status">Loading history…</p>
      ) : query.error ? (
        <p role="alert">
          History could not load.{' '}
          <button type="button" className="vtelemetry-button" onClick={query.refetch}>
            Try again
          </button>
        </p>
      ) : !series.some((row) => row.value != null) ? (
        <p>No readings in this period.</p>
      ) : (
        <>
          <div className="vtelemetry-chart" role="region" aria-label={title}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ right: 12 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="at"
                  type="number"
                  domain={[from, to]}
                  allowDataOverflow
                  minTickGap={28}
                  tickFormatter={(at) => formatInIST(at, to - from > 86400000 ? 'D MMM' : 'HH:mm')}
                />
                <YAxis unit={unit} domain={scale} width={66} />
                <Tooltip
                  labelFormatter={(at) => formatInIST(at, 'D MMM, h:mm a')}
                  formatter={(value) => [`${value} ${unit}`, title]}
                />
                <Line
                  dataKey="value"
                  type="linear"
                  stroke="#315be1"
                  strokeWidth={2}
                  dot={series.length <= 25}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {note ? <p>{note}</p> : null}
        </>
      )}
    </section>
  );
}

export default function TelemetryHistory({ registrationNumber }) {
  const [days, setDays] = useState(1);
  const [end] = useState(Date.now);
  const start = end - days * 86400000;
  const scope = `${registrationNumber}:${days}`;
  const fuel = useApi(
    (signal) =>
      FleetDataService.getVehicleHealth(registrationNumber, { days, limit: FUEL_LIMIT }, signal),
    [registrationNumber, days],
    { enabled: Boolean(registrationNumber), scopeKey: scope },
  );
  const speed = useApi(
    (signal) =>
      fleetViewService.getVehicleTrack(registrationNumber, {
        from: new Date(start).toISOString(),
        to: new Date(end).toISOString(),
        signal,
      }),
    [registrationNumber, days, start, end],
    { enabled: Boolean(registrationNumber), scopeKey: scope },
  );
  const fuelSeries = (fuel.data?.history || []).flatMap((row) => {
    const at = timestamp(row.pulledAt);
    if (!Number.isFinite(at) || at < start || at > end) return [];
    const value = row.primaryFuelLevel;
    return [{ at, value: Number.isFinite(value) && value >= 0 && value <= 100 ? value : null }];
  });
  const speedSeries = [
    ...(speed.data?.points || []).map((point) => ({
      at: timestamp(point.t),
      value: Number.isFinite(point.speedKmh) && point.speedKmh >= 0 ? point.speedKmh : null,
    })),
    ...(speed.data?.segments || [])
      .filter((segment) => segment.kind === 'GAP')
      .map((segment) => ({
        at: (timestamp(segment.fromT) + timestamp(segment.toT)) / 2,
        value: null,
      })),
  ]
    .filter(({ at }) => Number.isFinite(at) && at >= start && at <= end)
    .sort((a, b) => a.at - b.at);

  return (
    <div className="vtelemetry-history">
      <div role="group" aria-label="Telemetry history period">
        {windows.map((window) => (
          <button
            key={window.days}
            type="button"
            className="vtelemetry-button"
            aria-pressed={days === window.days}
            onClick={() => setDays(window.days)}
          >
            {window.label}
          </button>
        ))}
      </div>
      <div className="vtelemetry-top">
        <HistoryChart
          title="Diesel level"
          unit="%"
          query={fuel}
          series={fuelSeries}
          from={start}
          to={end}
          scale={[0, 100]}
          note={
            (fuel.data?.history?.length ?? 0) >= FUEL_LIMIT
              ? 'Fuel history reached the reading limit for this period.'
              : null
          }
        />
        <HistoryChart
          title="Vehicle speed"
          unit=" km/h"
          query={speed}
          series={speedSeries}
          from={start}
          to={end}
          scale={[0, 'auto']}
          note={speed.data?.downsampled ? 'The route history was sampled for display.' : null}
        />
      </div>
    </div>
  );
}
