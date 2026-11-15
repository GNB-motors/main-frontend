import { useId } from 'react';
import { BarChart3, PieChart as PieIcon, Route, Truck } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '../utils';
import { formatInrCompact } from '../../../utils/formatters';

const BLUE = '#2563eb';
const TEAL = '#0d9488';
const SLATE = '#64748b';
const PALETTE = [BLUE, TEAL, '#7c3aed', '#0891b2', SLATE, '#94a3b8'];
const tooltipStyle = {
  border: '1px solid var(--ds-line)',
  borderRadius: 8,
  background: 'var(--card)',
  color: 'var(--ds-ink)',
  fontSize: 12,
};
const axisTick = { fill: 'var(--ds-ink3)', fontSize: 11 };

function ChartPanel({
  icon: iconComponent,
  title,
  description,
  note,
  loading,
  empty,
  emptyText,
  children,
}) {
  const Icon = iconComponent;
  const id = useId();
  return (
    <Card className="khata-chart-card" role="region" aria-labelledby={id}>
      <CardContent className="p-5">
        <header className="khata-chart-header">
          <span className="khata-chart-icon" aria-hidden="true">
            <Icon size={18} />
          </span>
          <div>
            <h3 id={id} className="khata-chart-title">
              {title}
            </h3>
            <p className="khata-chart-description">{description}</p>
          </div>
        </header>
        {loading ? (
          <Skeleton className="h-60 w-full rounded-lg" />
        ) : empty ? (
          <div className="khata-chart-empty">
            <span className="khata-chart-empty-icon" aria-hidden="true">
              <Icon size={24} />
            </span>
            <strong>{emptyText}</strong>
            <span>Try another period or adjust the filters.</span>
          </div>
        ) : (
          children
        )}
        {!loading && !empty && note ? <p className="khata-chart-note">{note}</p> : null}
      </CardContent>
    </Card>
  );
}

function CostBars({ data, color = BLUE }) {
  return (
    <div className="khata-chart-canvas">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          accessibilityLayer
        >
          <CartesianGrid stroke="var(--ds-line)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tick={axisTick}
            tickFormatter={formatInrCompact}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={axisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(name) => (name.length > 15 ? `${name.slice(0, 14)}…` : name)}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatCurrency(value), 'Spend']}
            cursor={{ fill: 'var(--ds-sunk)' }}
          />
          <Bar
            dataKey="cost"
            fill={color}
            barSize={22}
            radius={[0, 5, 5, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function KhataDashboardCharts({
  loading,
  categoryData,
  sourceData,
  vehicleData,
  tripData,
}) {
  const categories = categoryData.filter((row) => row.value > 0);
  const total = categories.reduce((sum, row) => sum + row.value, 0);
  const shownCategories =
    categories.length > 6
      ? [
          ...categories.slice(0, 5),
          {
            name: 'Other categories',
            value: categories.slice(5).reduce((sum, row) => sum + row.value, 0),
          },
        ]
      : categories;
  const sources = sourceData.filter((row) => row.cost > 0);
  const vehicles = vehicleData.filter((row) => row.cost > 0);
  return (
    <section aria-labelledby="khata-insights-heading" className="khata-insights">
      <div className="khata-section-heading">
        <div>
          <h2 id="khata-insights-heading">Spending insights</h2>
          <p>Understand where the money goes and compare trip revenue with costs.</p>
        </div>
        <span className="khata-section-note">Amounts in INR</span>
      </div>
      <div className="khata-charts-grid">
        <ChartPanel
          icon={PieIcon}
          title="Expense mix"
          description="How spending is split across categories"
          loading={loading}
          empty={!shownCategories.length}
          emptyText="No expenses in this period"
        >
          <div className="khata-donut-layout">
            <div className="khata-donut-canvas">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shownCategories}
                    innerRadius="62%"
                    outerRadius="88%"
                    paddingAngle={3}
                    dataKey="value"
                    stroke="var(--card)"
                    isAnimationActive={false}
                  >
                    {shownCategories.map((row, index) => (
                      <Cell key={row.name} fill={PALETTE[index % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="khata-donut-total" aria-hidden="true">
                <span>Total spend</span>
                <strong>{formatInrCompact(total)}</strong>
              </div>
            </div>
            <ul className="khata-chart-legend" aria-label="Expense category amounts">
              {shownCategories.map((row, index) => (
                <li key={row.name}>
                  <span className="khata-legend-label">
                    <i style={{ background: PALETTE[index % PALETTE.length] }} />
                    {row.name}
                  </span>
                  <span className="khata-legend-amount">
                    <strong>{formatCurrency(row.value)}</strong>
                    <small>{Math.round((row.value / total) * 100)}%</small>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </ChartPanel>
        <ChartPanel
          icon={BarChart3}
          title="Spending by source"
          description="Compare manual entries and imported costs"
          loading={loading}
          empty={!sources.length}
          emptyText="No transaction sources to compare"
          note="Each bar shows the total spend from one source."
        >
          <CostBars data={sources} />
        </ChartPanel>
        <ChartPanel
          icon={Truck}
          title="Vehicle costs"
          description="Vehicles with the highest recorded spend"
          loading={loading}
          empty={!vehicles.length}
          emptyText="No vehicle expenses in this period"
          note="Showing up to six vehicles, ordered by spend."
        >
          <CostBars data={vehicles} color={SLATE} />
        </ChartPanel>
        <ChartPanel
          icon={Route}
          title="Trip revenue vs cost"
          description="Compare available finances for recent trips"
          loading={loading}
          empty={!tripData.length}
          emptyText="No trip finances available"
          note="Showing up to eight trips with available financial summaries."
        >
          <div className="khata-comparison-legend">
            <span>
              <i style={{ background: TEAL }} />
              Revenue
            </span>
            <span>
              <i style={{ background: SLATE }} />
              Cost
            </span>
          </div>
          <div
            className="khata-chart-canvas"
            style={{ height: Math.max(244, tripData.length * 40 + 40) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={tripData}
                layout="vertical"
                barGap={4}
                margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
                accessibilityLayer
              >
                <CartesianGrid stroke="var(--ds-line)" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tick={axisTick}
                  tickFormatter={formatInrCompact}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={axisTick}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(name) => (name.length > 14 ? `${name.slice(0, 13)}…` : name)}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [formatCurrency(value), name]}
                  cursor={{ fill: 'var(--ds-sunk)' }}
                />
                <Bar
                  dataKey="Revenue"
                  fill={TEAL}
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="Cost"
                  fill={SLATE}
                  radius={[0, 4, 4, 0]}
                  barSize={12}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartPanel>
      </div>
    </section>
  );
}
