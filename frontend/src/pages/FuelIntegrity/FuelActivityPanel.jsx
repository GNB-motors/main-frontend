import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Panel } from '../../components/overview.primitives.jsx';

const METRICS = [
  { key: 'volume', label: 'Fuel volume', color: 'var(--gnb-400)', unit: ' L' },
  { key: 'loss', label: 'Loss', color: 'var(--critical)', unit: ' L' },
  { key: 'events', label: 'Events', color: 'var(--gnb-300)', unit: '' },
  { key: 'def', label: 'DEF', color: 'var(--caution)', unit: '' },
];

export default function FuelActivityPanel({
  isLoading,
  chartData,
  chartMetric,
  onMetricChange,
  rangeDays,
  onRangeChange,
}) {
  const metric = METRICS.find((m) => m.key === chartMetric) || METRICS[0];
  return (
    <Panel
      className="min-w-0 lg:col-span-2"
      eyebrow="Fuel activity"
      question="Volume, loss and anomalies over time"
      action={
        <div className="flex flex-wrap items-center gap-2">
          <div className="ov-seg" role="group" aria-label="Metric">
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={chartMetric === m.key}
                onClick={() => onMetricChange(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="ov-seg" role="group" aria-label="Range">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={rangeDays === d}
                onClick={() => onRangeChange(d)}
              >
                {d}D
              </button>
            ))}
          </div>
        </div>
      }
    >
      {isLoading ? (
        <div className="ov-inset h-[260px] animate-pulse" />
      ) : chartData.length === 0 ? (
        <div className="text-dim flex h-[260px] items-center justify-center text-sm">
          No fuel activity in this window.
        </div>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 18 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline)" />
              <XAxis
                dataKey="day"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                stroke="var(--cluster-text-dim)"
              />
              <YAxis
                label={{
                  value: metric.unit.trim() || 'events',
                  angle: -90,
                  position: 'insideLeft',
                }}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                stroke="var(--cluster-text-dim)"
                width={52}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toLocaleString('en-IN')}k` : `${v}`
                }
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid var(--hairline)',
                  background: 'var(--cluster-panel)',
                  fontSize: 12,
                }}
                formatter={(v) => [`${v}${metric.unit}`, metric.label]}
              />
              <Bar dataKey={metric.key} fill={metric.color} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
