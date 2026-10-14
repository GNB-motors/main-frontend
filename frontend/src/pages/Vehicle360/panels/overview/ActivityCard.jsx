import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { formatKm } from '../../../../utils/formatters';
import { dailyDistances, distanceInWindow } from '../../vehicle360Logic';
import CardHead from './CardHead';

/** Distance travelled per reading over the telemetry window — the "Activity" chart. */
export default function ActivityCard({ history }) {
  const series = dailyDistances(history);
  const travelled = distanceInWindow(history);

  return (
    <section className="v360-card" style={{ gridColumn: '1 / span 2' }}>
      <CardHead title="Activity" />
      {!series ? (
        <div className="v360-empty">
          <span className="v360-empty-title">Not enough history yet</span>
          <span className="v360-empty-hint">
            A trend needs at least two odometer readings in the window.
          </span>
        </div>
      ) : (
        <>
          <p className="v360-figure">
            <span className="v360-figure-value">{formatKm(travelled)}</span>
            <span className="v360-figure-note">travelled in the telemetry window</span>
          </p>
          <div style={{ height: 170, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="t" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} width={48} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--card)',
                    border: '1px solid var(--line2)',
                    borderRadius: 9,
                    fontSize: 12,
                  }}
                  formatter={(v) => [formatKm(v), 'distance']}
                />
                <Area
                  type="monotone"
                  dataKey="km"
                  stroke="var(--erp)"
                  fill="var(--erp)"
                  fillOpacity={0.14}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </section>
  );
}
