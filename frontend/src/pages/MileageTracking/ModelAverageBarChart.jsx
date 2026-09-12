import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { BAR_COLORS } from './modelComparisonLogic';
import { ModelTooltip } from './modelComparisonCells';

/** Bar chart of average mileage per model — click a bar to select that model. */
const ModelAverageBarChart = ({ data, selectedModel, onSelectModel }) => (
  <div className="mc-card">
    <div className="mc-card-header">
      <div className="mc-card-icon" style={{ background: 'rgba(59,130,246,0.10)' }}>
        <BarChart2 size={16} color="#3B82F6" />
      </div>
      <h3 className="mc-card-title">Average Mileage by Model (km/L)</h3>
      <span className="mc-card-hint">Click a bar to inspect vehicles</span>
    </div>
    <div className="mc-chart-area">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 24, left: 0, bottom: 48 }}
          onClick={(e) => {
            if (e?.activePayload?.[0]) onSelectModel(e.activePayload[0].payload.model);
          }}
          style={{ cursor: 'pointer' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="model"
            tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
            interval={0}
            angle={-25}
            textAnchor="end"
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Inter, sans-serif' }}
            axisLine={false}
            tickLine={false}
            unit=" km/L"
            width={72}
          />
          <Tooltip content={<ModelTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
          <Bar dataKey="avgMileage" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {data.map((entry, index) => (
              <Cell
                key={entry.model}
                fill={
                  entry.model === selectedModel ? '#1D4ED8' : BAR_COLORS[index % BAR_COLORS.length]
                }
                opacity={entry.model === selectedModel ? 1 : 0.6}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default ModelAverageBarChart;
