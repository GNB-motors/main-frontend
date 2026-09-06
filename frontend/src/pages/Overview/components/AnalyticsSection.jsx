import { Star } from 'lucide-react';
import { Panel, SectionHeader } from './overview.primitives.jsx';
import FuelVarianceChart from './FuelVarianceChart.jsx';
import OutlierChart from './OutlierChart.jsx';
import FinancialChart from './FinancialChart.jsx';
import DriverCard from './DriverCard.jsx';
import UnderperformingList from './UnderperformingList.jsx';
import { formatINR, formatNum } from '../../../utils/formatters';

/**
 * Secondary analytics band — fuel KPIs, fuel charts, financial overview and
 * driver standings. Each block renders only when its feed has data, matching
 * the progressive-disclosure contract of the original page.
 */
const AnalyticsSection = ({ fuel, fuelAnalytics, financials, driverPerformance }) => {
  const fuelSummary = fuelAnalytics?.summary;
  const finSummary = financials?.summary;

  const hasFuel = fuel && (fuel.totalLitres > 0 || fuel.totalCost > 0);
  const hasFin = finSummary && (finSummary.totalRevenue > 0 || finSummary.totalExpenses > 0);
  const hasDriver =
    driverPerformance &&
    (driverPerformance.topPerformingDriver || driverPerformance.averageDriverRating !== undefined);
  const hasCharts =
    fuelAnalytics?.dailyVariance?.length > 0 || fuelAnalytics?.dailyOutliers?.length > 0;

  if (!(hasFuel || hasCharts || hasFin || hasDriver)) return null;

  return (
    <>
      <SectionHeader title="Analytics" question="Is performance improving or slipping?" />

      {hasFuel && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Panel eyebrow="Fuel consumed">
            <div className="num text-2xl font-bold" style={{ color: 'var(--cluster-text)' }}>
              {formatNum(fuel.totalLitres || 0)} L
            </div>
            <div className="text-dim mt-1 text-xs">Cost {formatINR(fuel.totalCost || 0)}</div>
          </Panel>
          <Panel eyebrow="Fleet efficiency">
            <div className="num text-2xl font-bold" style={{ color: 'var(--cluster-text)' }}>
              {(fuel.avgKmpl || 0).toFixed(2)} km/l
            </div>
            <div className="text-dim mt-1 text-xs">Overall average</div>
          </Panel>
          {fuelSummary && (
            <>
              <Panel eyebrow="Avg variance">
                <div className="num text-2xl font-bold" style={{ color: 'var(--cluster-text)' }}>
                  {(fuelSummary.averageVariance || 0).toFixed(2)}
                </div>
                <div className="text-dim mt-1 text-xs">
                  Fleet {(fuelAnalytics.fleetWideAverageVariance || 0).toFixed(2)} km/l
                </div>
              </Panel>
              <Panel eyebrow="Outliers">
                <div
                  className="num text-2xl font-bold"
                  style={{
                    color:
                      (fuelSummary.outlierCount || 0) > 0
                        ? 'var(--critical)'
                        : 'var(--cluster-text)',
                  }}
                >
                  {formatNum(fuelSummary.outlierCount || 0)}
                </div>
                <div className="text-dim mt-1 text-xs">
                  of {formatNum(fuelSummary.totalTrips || 0)} trips
                </div>
              </Panel>
            </>
          )}
        </div>
      )}

      {hasCharts && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <FuelVarianceChart data={fuelAnalytics.dailyVariance} />
          <OutlierChart data={fuelAnalytics.dailyOutliers} />
        </div>
      )}

      {hasFin && (
        <Panel eyebrow="Financial overview" question="Revenue, expenses and margin">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="ov-inset border-l-2 p-4" style={{ borderLeftColor: 'var(--ok)' }}>
              <p className="text-dim text-[11px] font-semibold uppercase tracking-wide">Revenue</p>
              <p className="num mt-1 text-xl font-bold" style={{ color: 'var(--ok)' }}>
                {formatINR(finSummary.totalRevenue || 0)}
              </p>
            </div>
            <div className="ov-inset border-l-2 p-4" style={{ borderLeftColor: 'var(--critical)' }}>
              <p className="text-dim text-[11px] font-semibold uppercase tracking-wide">Expenses</p>
              <p className="num mt-1 text-xl font-bold" style={{ color: 'var(--critical)' }}>
                {formatINR(finSummary.totalExpenses || 0)}
              </p>
            </div>
            <div
              className="ov-inset border-l-2 p-4"
              style={{
                borderLeftColor: (finSummary.netProfit || 0) >= 0 ? 'var(--ok)' : 'var(--critical)',
              }}
            >
              <p className="text-dim text-[11px] font-semibold uppercase tracking-wide">
                Net profit
              </p>
              <p
                className="num mt-1 text-xl font-bold"
                style={{
                  color: (finSummary.netProfit || 0) >= 0 ? 'var(--ok)' : 'var(--critical)',
                }}
              >
                {formatINR(finSummary.netProfit || 0)}
              </p>
            </div>
            <div className="ov-inset border-l-2 p-4" style={{ borderLeftColor: 'var(--caution)' }}>
              <p className="text-dim text-[11px] font-semibold uppercase tracking-wide">Margin</p>
              <p className="num mt-1 text-xl font-bold" style={{ color: 'var(--caution)' }}>
                {(finSummary.profitMargin || 0).toFixed(2)}%
              </p>
            </div>
          </div>
          {financials?.dailyTrend?.length > 0 && (
            <div className="mt-5 border-t pt-4" style={{ borderColor: 'var(--hairline)' }}>
              <h3 className="mb-3 text-sm font-semibold" style={{ color: 'var(--cluster-text)' }}>
                Daily revenue trend
              </h3>
              <FinancialChart data={financials} />
            </div>
          )}
        </Panel>
      )}

      {hasDriver && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {driverPerformance.topPerformingDriver && (
            <DriverCard
              driver={driverPerformance.topPerformingDriver}
              label="Top performing driver"
              variant="top"
            />
          )}
          {driverPerformance.averageDriverRating !== undefined && (
            <Panel eyebrow="Average rating">
              <div className="flex flex-col items-center gap-2 py-2">
                <span
                  className="num text-4xl font-bold"
                  style={{
                    color:
                      driverPerformance.averageDriverRating >= 4
                        ? 'var(--ok)'
                        : driverPerformance.averageDriverRating >= 3
                          ? 'var(--caution)'
                          : 'var(--critical)',
                  }}
                >
                  {(driverPerformance.averageDriverRating || 0).toFixed(1)}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={15}
                      fill={
                        s <= Math.round(driverPerformance.averageDriverRating)
                          ? 'currentColor'
                          : 'none'
                      }
                      style={{
                        color:
                          s <= Math.round(driverPerformance.averageDriverRating)
                            ? 'var(--caution)'
                            : 'var(--inert)',
                      }}
                    />
                  ))}
                </div>
                <p className="text-dim text-xs">
                  out of 5 ({formatNum(driverPerformance.totalDrivers || 0)} drivers)
                </p>
              </div>
            </Panel>
          )}
          {driverPerformance.underperformingDrivers?.length > 0 &&
          driverPerformance.underperformingDrivers[0]?.driverName ? (
            <UnderperformingList drivers={driverPerformance.underperformingDrivers} />
          ) : (
            <Panel eyebrow="Fleet drivers">
              <div className="flex flex-col items-center gap-2 py-2">
                <span className="num text-4xl font-bold" style={{ color: 'var(--ok)' }}>
                  {formatNum(driverPerformance.totalDrivers || 0)}
                </span>
                <p className="text-dim text-xs">active drivers in fleet</p>
              </div>
            </Panel>
          )}
        </div>
      )}
    </>
  );
};

export default AnalyticsSection;
