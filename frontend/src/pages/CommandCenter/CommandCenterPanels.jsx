import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Truck,
  Users,
  Route,
  Gauge,
  Fuel,
  Receipt,
  Banknote,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { C } from '../../utils/erpChartTheme';
import { inr, compactInr, num } from '../../utils/formatMoney';
import {
  SectionLabel,
  PanelHeader,
  StageCell,
  HeroMetric,
  Tile,
  ProportionBar,
  QueueChip,
} from './CommandCenterPrimitives';

const shortDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '';

const VarianceTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-lg"
      style={{ background: C.ink, border: `1px solid ${C.inkSoft}` }}
    >
      <p
        className="font-display text-[11px] uppercase tracking-wider"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        {shortDate(label)}
      </p>
      <p className="num text-[15px] font-semibold text-white">
        {(payload[0].value || 0).toFixed(2)} km/L
      </p>
    </div>
  );
};

/**
 * CommandCenterPanels — the section-level composition of the command center
 * (WS0.10 split). Each panel derives its own display values from the raw
 * service payload; markup and behaviour are unchanged from the monolithic
 * page. The order-to-cash panel is ERP summary display only — it links to
 * the ERP pages and is deliberately not modified beyond the move.
 */

const PIPELINE_STAGES = [
  { key: 'PLACED', label: 'Placed' },
  { key: 'DISPATCHED', label: 'Dispatched' },
  { key: 'TRIP_CLOSED', label: 'Trip closed' },
  { key: 'POD_RECEIVED', label: 'POD received' },
  { key: 'UNLOADED', label: 'Unloaded' },
  { key: 'BILLED', label: 'Billed' },
];

/** The four numbers worth interrupting someone for. */
export const HeroBand = ({ erp, fleet }) => {
  const pending = erp?.pendingCounts;
  const money = erp?.financials;
  const activeTrips = pending?.activeTrips || {};

  // "In flight" = everything raised but not yet billed out.
  const tripsInFlight = PIPELINE_STAGES.filter((s) => s.key !== 'BILLED').reduce(
    (a, s) => a + (activeTrips[s.key] || 0),
    0,
  );

  const receivablesOutstanding = money?.receivablesOutstanding || 0;
  const receivablesOverdue = money?.receivablesOverdue || 0;

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ background: '#fff', borderColor: C.grid, boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex flex-col divide-y divide-slate-100 sm:flex-row sm:divide-x sm:divide-y-0">
        <HeroMetric
          icon={Receipt}
          label="Receivables"
          value={compactInr(receivablesOutstanding)}
          sub={
            receivablesOverdue > 0 ? `${compactInr(receivablesOverdue)} overdue` : 'Nothing overdue'
          }
          tone={receivablesOverdue > 0 ? C.signal.critical : undefined}
        />
        <HeroMetric
          icon={Banknote}
          label="Payables due"
          value={compactInr(money?.payablesDue)}
          sub={`${compactInr(money?.unadjustedReceipts)} unadjusted receipts`}
        />
        <HeroMetric
          icon={Route}
          label="Trips in flight"
          value={num(tripsInFlight)}
          sub={`${num(pending?.pendingApprovals)} approvals waiting`}
          tone={pending?.pendingApprovals > 0 ? C.signal.warn : undefined}
        />
        <HeroMetric
          icon={Truck}
          label="Vehicles on trip"
          value={num(fleet?.vehicles?.onTrip)}
          sub={`of ${num(fleet?.vehicles?.total)} in fleet`}
        />
      </div>
    </div>
  );
};

/** ERP order-to-cash column: pipeline stages + the "waiting on you" queue. */
export const OrderToCashPanel = ({ erpFailed, erp }) => {
  const pending = erp?.pendingCounts;
  const activeTrips = pending?.activeTrips || {};

  const pipelineData = PIPELINE_STAGES.map((s) => ({
    label: s.label,
    count: activeTrips[s.key] || 0,
  }));

  // "In flight" = everything raised but not yet billed out.
  const tripsInFlight = PIPELINE_STAGES.filter((s) => s.key !== 'BILLED').reduce(
    (a, s) => a + (activeTrips[s.key] || 0),
    0,
  );

  return (
    <Card
      className="flex h-full flex-col gap-0 border-0 py-0"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <PanelHeader title="Order to cash" to="/erp" linkLabel="ERP Home" />
      <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
        {erpFailed ? (
          <p className="py-8 text-center text-[13px]" style={{ color: C.muted }}>
            ERP figures are unavailable for this account.
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between pb-2.5">
              <p
                className="text-[12px] font-semibold uppercase tracking-wider"
                style={{ color: C.muted }}
              >
                Trips by stage
              </p>
              <p className="num text-[12px]" style={{ color: C.muted }}>
                {num(tripsInFlight)} in flight
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {pipelineData.map((d, i) => (
                <StageCell key={d.label} label={d.label} count={d.count} color={C.pipeline[i]} />
              ))}
            </div>

            <p
              className="pb-2.5 pt-5 text-[12px] font-semibold uppercase tracking-wider"
              style={{ color: C.muted }}
            >
              Waiting on you
            </p>
            <div className="grid flex-1 content-start gap-2 sm:grid-cols-2">
              <QueueChip
                label="Approvals"
                count={pending?.pendingApprovals || 0}
                to="/erp/approvals"
                urgent
              />
              <QueueChip
                label="Open delivery orders"
                count={pending?.dos || 0}
                to="/erp/pipeline"
              />
              <QueueChip
                label="CNs to update"
                count={pending?.pendingCns || 0}
                to="/erp/pipeline"
              />
              <QueueChip
                label="Trips to close"
                count={pending?.pendingTripClose || 0}
                to="/erp/pipeline"
              />
              <QueueChip
                label="PODs pending"
                count={pending?.pendingPods || 0}
                to="/erp/pipeline"
              />
              <QueueChip
                label="Unloadings"
                count={pending?.pendingUnloadings || 0}
                to="/erp/pipeline"
              />
              <QueueChip
                label="Bills to submit"
                count={pending?.pendingBillSubmissions || 0}
                to="/erp/billing"
              />
              <QueueChip
                label="Placements today"
                count={pending?.placementsToday || 0}
                to="/erp/pipeline"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/** Fleet column: vehicle/driver/trip/distance tiles, fuel tiles, variance trend. */
export const FleetPanel = ({ fleetFailed, fleet, fuel, days }) => {
  const hasVarianceTrend = (fuel?.dailyVariance?.length || 0) > 1;

  return (
    <Card
      className="flex h-full flex-col gap-0 border-0 py-0"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <PanelHeader
        title={`Fleet · last ${days} days`}
        to="/overview"
        linkLabel="Fleet Operations"
      />
      <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
        {fleetFailed ? (
          <p className="py-8 text-center text-[13px]" style={{ color: C.muted }}>
            Fleet figures are unavailable for this account.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Tile
                icon={Truck}
                label="Vehicles"
                value={num(fleet?.vehicles?.total)}
                sub={`${num(fleet?.vehicles?.active)} active`}
              />
              <Tile
                icon={Users}
                label="Drivers"
                value={num(fleet?.drivers?.total)}
                sub={`${num(fleet?.drivers?.active)} active`}
              />
              <Tile
                icon={Route}
                label="Trips"
                value={num(fleet?.trips?.total)}
                sub={`${num(fleet?.trips?.ongoing)} ongoing`}
              />
              <Tile icon={Gauge} label="Distance" value={`${num(fleet?.kilometers?.total)} km`} />
            </div>

            <p
              className="pb-2.5 pt-4 text-[12px] font-semibold uppercase tracking-wider"
              style={{ color: C.muted }}
            >
              Fuel
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <Tile
                icon={Fuel}
                label="Consumed"
                value={`${num(fleet?.fuel?.totalLitres)} L`}
                sub={inr(fleet?.fuel?.totalCost)}
              />
              <Tile
                label="Avg efficiency"
                value={`${(fleet?.fuel?.avgKmpl || 0).toFixed(2)}`}
                sub="km/L"
              />
              <Tile
                label="Avg variance"
                value={`${(fuel?.summary?.averageVariance || 0).toFixed(2)}`}
                sub="km/L vs benchmark"
              />
              <Tile
                label="Outliers"
                value={num(fuel?.summary?.outlierCount)}
                sub={`of ${num(fuel?.summary?.totalTrips)} trips`}
              />
            </div>

            {/* Single series, so the heading names it and no legend box is
                needed. Fills the column that used to run short. */}
            {hasVarianceTrend && (
              <div className="flex flex-1 flex-col pt-4">
                <p
                  className="pb-1 text-[12px] font-semibold uppercase tracking-wider"
                  style={{ color: C.muted }}
                >
                  Efficiency variance trend
                </p>
                <div className="min-h-[132px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={fuel.dailyVariance}
                      margin={{ top: 8, right: 8, bottom: 0, left: -22 }}
                    >
                      <CartesianGrid stroke={C.grid} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={shortDate}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: C.muted }}
                        minTickGap={24}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: C.muted }}
                        width={52}
                      />
                      <Tooltip
                        content={<VarianceTooltip />}
                        cursor={{ stroke: C.muted, strokeDasharray: '3 3' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="averageVariance"
                        stroke={C.cat[0]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

/** Receivables / payables / POD-ageing proportion cards. */
export const MoneySection = ({ erp }) => {
  const pending = erp?.pendingCounts;
  const money = erp?.financials;

  const receivablesOutstanding = money?.receivablesOutstanding || 0;
  const receivablesOverdue = money?.receivablesOverdue || 0;
  const receivablesCurrent = Math.max(0, receivablesOutstanding - receivablesOverdue);
  const podAgeing = pending?.podAgeing || {};

  return (
    <section>
      <SectionLabel>Where the money is sitting</SectionLabel>
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="border-0" style={{ boxShadow: 'var(--shadow-card)' }}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-baseline justify-between pb-1">
              <h3 className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                Receivables
              </h3>
              <span className="num text-[15px] font-semibold" style={{ color: C.ink }}>
                {inr(receivablesOutstanding)}
              </span>
            </div>
            <ProportionBar
              total={receivablesOutstanding}
              formatValue={inr}
              emptyLabel="No outstanding receivables"
              segments={[
                { label: 'Current', value: receivablesCurrent, color: C.signal.good },
                { label: 'Overdue', value: receivablesOverdue, color: C.signal.critical },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="border-0" style={{ boxShadow: 'var(--shadow-card)' }}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-baseline justify-between pb-1">
              <h3 className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                Payables
              </h3>
              <span className="num text-[15px] font-semibold" style={{ color: C.ink }}>
                {inr(money?.payablesDue)}
              </span>
            </div>
            <ProportionBar
              total={money?.payablesDue}
              formatValue={inr}
              emptyLabel="No approved payables"
              segments={[
                { label: 'Vendors', value: money?.vendorPayables || 0, color: C.cat[0] },
                { label: 'Suppliers', value: money?.supplierPayables || 0, color: C.cat[1] },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="border-0" style={{ boxShadow: 'var(--shadow-card)' }}>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-baseline justify-between pb-1">
              <h3 className="text-[13.5px] font-bold" style={{ color: C.ink }}>
                POD ageing
              </h3>
              <span className="num text-[15px] font-semibold" style={{ color: C.ink }}>
                {num(pending?.pendingPods)}
              </span>
            </div>
            <ProportionBar
              total={pending?.pendingPods}
              emptyLabel="No PODs pending"
              segments={[
                { label: 'Under 7 days', value: podAgeing.under7d || 0, color: C.signal.good },
                { label: '7–14 days', value: podAgeing.from7to14d || 0, color: C.signal.warn },
                { label: 'Over 14 days', value: podAgeing.over14d || 0, color: C.signal.critical },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

/** Fleet P&L strip (only rendered when the endpoint returned something). */
export const FleetPLSection = ({ fin, days }) => (
  <section>
    <SectionLabel>Fleet P&amp;L · last {days} days</SectionLabel>
    <Card className="border-0" style={{ boxShadow: 'var(--shadow-card)' }}>
      <CardContent className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4 sm:p-5">
        <Tile icon={TrendingUp} label="Revenue" value={inr(fin.totalRevenue)} />
        <Tile icon={TrendingDown} label="Expenses" value={inr(fin.totalExpenses)} />
        <div
          className="rounded-xl border p-3.5"
          style={{ borderColor: C.grid, background: '#fff' }}
        >
          <span
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: C.muted }}
          >
            Net profit
          </span>
          <div
            className="num pt-1.5 text-[20px] font-semibold leading-none"
            style={{ color: (fin.netProfit || 0) >= 0 ? C.signal.good : C.signal.critical }}
          >
            {inr(fin.netProfit)}
          </div>
        </div>
        <Tile label="Margin" value={`${(fin.profitMargin || 0).toFixed(1)}%`} />
      </CardContent>
    </Card>
  </section>
);
