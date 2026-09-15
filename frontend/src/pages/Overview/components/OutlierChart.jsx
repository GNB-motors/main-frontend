import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Panel } from './overview.primitives.jsx';
import ChartTooltip from './ChartTooltip.jsx';
import { getDateLabel } from '../overviewFormat.js';

const OutlierChart = ({ data }) => {
  if (!data?.length) return null;
  return (
    <Panel eyebrow="Daily outliers" question="Abnormal fuel-consumption days">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
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
            <Tooltip content={<ChartTooltip labelFormatter={getDateLabel} />} />
            <Bar
              dataKey="outlierCount"
              name="Outlier count"
              fill="var(--critical)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Panel>
  );
};

export default OutlierChart;
