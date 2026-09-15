import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Panel } from './overview.primitives.jsx';
import ChartTooltip from './ChartTooltip.jsx';
import { getDateLabel } from '../overviewFormat.js';

const FuelVarianceChart = ({ data }) => {
  if (!data?.length) return null;
  return (
    <Panel eyebrow="Fuel efficiency variance" question="Daily km/l deviation from baseline">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--hairline)" />
            <XAxis
              dataKey="date"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={getDateLabel}
              stroke="var(--cluster-text-dim)"
            />
            <YAxis
              fontSize={12}
              tickLine={false}
              axisLine={false}
              stroke="var(--cluster-text-dim)"
            />
            <Tooltip
              content={
                <ChartTooltip
                  formatter={(v) => v.toFixed(2) + ' km/l'}
                  labelFormatter={getDateLabel}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="averageVariance"
              name="Avg. variance"
              stroke="var(--gnb-400)"
              strokeWidth={2}
              dot={{ r: 3, fill: 'var(--gnb-400)' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
};

export default FuelVarianceChart;
