import { BarChart3, Layers, Route, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { KhataCard, KhataEmpty } from './khataUi';
import { formatCurrency } from '../utils';

const pct = (value, max) => (max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0);

function RankSkeleton() {
  return (
    <div role="status" aria-busy="true" className="khata-rank">
      <span className="sr-only">Loading…</span>
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} className="h-8 w-full rounded" />
      ))}
    </div>
  );
}

/** Rows of label, amount and a share track, largest first. */
function RankedCard({ title, subtitle, icon, rows, loading, emptyTitle, note, label }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const max = rows.reduce((top, row) => Math.max(top, row.value), 0);
  return (
    <KhataCard title={title} subtitle={subtitle}>
      {loading ? (
        <RankSkeleton />
      ) : !rows.length ? (
        <KhataEmpty icon={icon} title={emptyTitle}>
          Try another period or clear the filters.
        </KhataEmpty>
      ) : (
        <>
          <ul className="khata-rank" aria-label={label}>
            {rows.map((row) => {
              const share = total > 0 ? Math.round((row.value / total) * 100) : 0;
              return (
                <li
                  key={row.name}
                  aria-label={`${row.name} · ${formatCurrency(row.value)} · ${share}%`}
                >
                  <span className="khata-rank-name">{row.name}</span>
                  <span className="khata-rank-value">
                    {formatCurrency(row.value)}
                    <small>{share}%</small>
                  </span>
                  <span className="khata-track" aria-hidden="true">
                    <span style={{ width: `${pct(row.value, max)}%` }} />
                  </span>
                </li>
              );
            })}
          </ul>
          {note ? <p className="khata-foot-note">{note}</p> : null}
        </>
      )}
    </KhataCard>
  );
}

function TripMarginCard({ trips, loading }) {
  const max = trips.reduce((top, trip) => Math.max(top, trip.Revenue, trip.Cost), 0);
  return (
    <KhataCard
      title="Trip revenue vs cost"
      subtitle="Recent ERP trips that have a finance summary"
      actions={
        trips.length && !loading ? (
          <span className="khata-legend">
            <span>
              <i aria-hidden="true" />
              Revenue
            </span>
            <span>
              <i className="is-cost" aria-hidden="true" />
              Cost
            </span>
          </span>
        ) : null
      }
    >
      {loading ? (
        <RankSkeleton />
      ) : !trips.length ? (
        <KhataEmpty icon={Route} title="No trip finances in this period">
          Trips show here once they have revenue or costs recorded in ERP.
        </KhataEmpty>
      ) : (
        <>
          <ul className="khata-rank" aria-label="Revenue and cost per trip">
            {trips.map((trip) => (
              <li
                key={trip.name}
                aria-label={`${trip.name} · revenue ${formatCurrency(trip.Revenue)} · cost ${formatCurrency(trip.Cost)} · margin ${formatCurrency(trip.Profit)}`}
              >
                <span className="khata-rank-name is-code">{trip.name}</span>
                <span
                  className="khata-rank-value"
                  style={{ color: trip.Profit < 0 ? 'var(--ui-bad-ink)' : 'var(--ui-ok)' }}
                >
                  {trip.Profit < 0 ? '−' : '+'}
                  {formatCurrency(Math.abs(trip.Profit))}
                </span>
                <span className="khata-track" aria-hidden="true">
                  <span style={{ width: `${pct(trip.Revenue, max)}%` }} />
                </span>
                <span className="khata-track khata-track--cost" aria-hidden="true">
                  <span style={{ width: `${pct(trip.Cost, max)}%` }} />
                </span>
              </li>
            ))}
          </ul>
          <p className="khata-foot-note">
            Up to eight trips. The figure on the right is revenue minus cost.
          </p>
        </>
      )}
    </KhataCard>
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
  const sources = sourceData
    .filter((row) => row.cost > 0)
    .map((row) => ({ name: row.name, value: row.cost }))
    .sort((a, b) => b.value - a.value);
  const vehicles = vehicleData
    .filter((row) => row.cost > 0)
    .map((row) => ({ name: row.name, value: row.cost }));

  return (
    <div
      className="khata-card-grid"
      aria-label="Spending insights"
      role="region"
      // Without ERP there is no trip card: three cards sit in one row of three.
      style={tripData ? undefined : { '--khata-cols': 3 }}
    >
      <RankedCard
        title="Where the money goes"
        subtitle="Spend by category"
        icon={Layers}
        rows={shownCategories}
        loading={loading}
        emptyTitle="No expenses in this period"
        label="Spend by category"
      />
      <RankedCard
        title="Spend by source"
        subtitle="Manual entries against imported costs"
        icon={BarChart3}
        rows={sources}
        loading={loading}
        emptyTitle="No expenses in this period"
        label="Spend by source"
      />
      <RankedCard
        title="Vehicles with the highest spend"
        subtitle="Top six vehicles in this period"
        icon={Truck}
        rows={vehicles}
        loading={loading}
        emptyTitle="No vehicle expenses in this period"
        note="Expenses without a vehicle are grouped under “No vehicle”."
        label="Spend by vehicle"
      />
      {tripData ? <TripMarginCard trips={tripData} loading={loading} /> : null}
    </div>
  );
}
