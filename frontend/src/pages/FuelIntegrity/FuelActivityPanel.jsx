import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Panel } from '../Overview/components/overview.primitives.jsx';

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
      className="lg:col-span-2"
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
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
              <defs>
                <linearGradient id="fiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metric.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={metric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline)" />
              <XAxis
                dataKey="day"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                stroke="var(--cluster-text-dim)"
              />
              <YAxis
                fontSize={11}
                tickLine={false}
                axisLine={false}
                stroke="var(--cluster-text-dim)"
                unit={metric.unit}
                width={44}
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
              <Area
                type="monotone"
                dataKey={metric.key}
                stroke={metric.color}
                strokeWidth={2}
                fill="url(#fiGrad)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}
