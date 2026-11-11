import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { formatDay } from './driverChartModel';

function TimelineTooltip({ active, payload, base }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="rounded border border-[var(--ds-line2)] bg-card p-2 text-xs shadow">
      <p className="font-medium">{row.driverName}</p>
      <p className="text-muted-foreground">
        {formatDay(base, row.offset)} →{' '}
        {row.to ? formatDay(base, row.offset + row.duration) : 'ongoing'}
      </p>
    </div>
  );
}

/**
 * One truck, one row per driver period: dates along the x-axis, the driver's
 * name and phone down the side. The bar is drawn as an offset (invisible) plus
 * a duration, because that is how a period on a timeline is actually made.
 */
export default function DriverTimelineChart({ rows = [], base = 0, span = 1, width = 720 }) {
  const height = Math.max(170, rows.length * 32 + 60);
  return (
    <div role="group" aria-label="Driver timeline chart" className="overflow-x-auto">
      <BarChart
        layout="vertical"
        width={width}
        height={height}
        data={rows}
        margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--ds-line)" />
        <XAxis
          type="number"
          dataKey="offset"
          domain={[0, span]}
          tickFormatter={(value) => formatDay(base, value)}
          tick={{ fontSize: 11 }}
        />
        <YAxis type="category" dataKey="label" width={230} tick={{ fontSize: 11 }} />
        <Tooltip content={<TimelineTooltip base={base} />} />
        <Bar dataKey="offset" stackId="period" fill="transparent" isAnimationActive={false} />
        <Bar
          dataKey="duration"
          stackId="period"
          fill="var(--ds-accent, #2563eb)"
          radius={[0, 4, 4, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </div>
  );
}
