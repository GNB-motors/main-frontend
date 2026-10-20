import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Trend({ data, dataKey, format }) {
  return (
    <div style={{ height: 170 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="t" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
            width={58}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--line2)',
              borderRadius: 9,
              fontSize: 12,
            }}
            formatter={(v) => [format(v), '']}
          />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="var(--erp)"
            fill="var(--erp)"
            fillOpacity={0.14}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
