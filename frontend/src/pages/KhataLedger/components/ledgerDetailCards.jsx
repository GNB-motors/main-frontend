import { useState } from 'react';
import { Route } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import KhataKpiGrid from './KhataKpiGrid';
import { KhataCard, KhataEmpty, KhataPill, KhataSectionHead, KhataTableSkeleton } from './khataUi';
import {
  formatCurrency,
  formatDate,
  formatKm,
  formatCostPerKm,
  getProfitabilityStatus,
  plural,
} from '../utils';
import {
  categoryLabel,
  costBuckets,
  getLedgerSplitItems,
  rankRows,
  resolveLedgerSplitLabel,
  sourceLabel,
  tripStateLabel,
  tripStateTone,
} from './ledgerDetailLogic';

const TRIPS_SHOWN = 6;
const share = (part, total) => (total > 0 ? (part / total) * 100 : null);
const pctText = (part, total) =>
  total > 0 ? `${Math.round((part / total) * 100)}% of the total` : 'No entries in this period';

/** The period's cost split, as the KPI strip of the header card. */
export const LedgerCostStrip = ({ summary, loading }) => {
  const { total, fuel, maintenance, other } = costBuckets(summary);
  const none = !summary.count;
  const money = (value) => (none ? '—' : formatCurrency(value));
  return (
    <KhataKpiGrid
      variant="strip"
      loading={loading}
      items={[
        {
          label: 'Total cost',
          value: money(total),
          sub: none
            ? 'No entries in this period'
            : `${plural(summary.count, 'entry', 'entries')} in this period`,
        },
        {
          label: 'Fuel',
          value: money(fuel),
          pct: none ? null : share(fuel, total),
          sub: pctText(fuel, total),
        },
        {
          label: 'Maintenance',
          value: money(maintenance),
          pct: none ? null : share(maintenance, total),
          sub: pctText(maintenance, total),
        },
        {
          label: 'Other costs',
          value: money(other),
          pct: none ? null : share(other, total),
          sub: none ? 'No entries in this period' : 'Tolls, meals, allowances and the rest',
        },
      ]}
    />
  );
};

/** ERP trips in the period: revenue against the ledger's cost, and the trip list. */
export const LedgerTripsCard = ({ trips, finances, totalCost, loading, isDriver, onOpenTrip }) => {
  const [showAll, setShowAll] = useState(false);
  const withFinance = trips.filter((trip) => finances[trip._id]);
  const revenue = withFinance.reduce((sum, trip) => sum + (finances[trip._id].revenue || 0), 0);
  const complete = trips.length > 0 && withFinance.length === trips.length;
  const distance = trips.reduce((sum, trip) => sum + (trip.totalKm > 0 ? trip.totalKm : 0), 0);
  const costPerKm = formatCostPerKm(totalCost, distance);
  const profit = revenue - (totalCost || 0);
  const profitStatus = getProfitabilityStatus(revenue, totalCost);
  const noTrips = 'No ERP trips in this period';
  const shown = showAll ? trips : trips.slice(0, TRIPS_SHOWN);

  return (
    <>
      <KhataSectionHead
        title={
          <>
            ERP trips
            {!loading ? <span className="khata-count">{plural(trips.length, 'trip')}</span> : null}
          </>
        }
        subtitle={`Commercial trips of this ${isDriver ? 'driver' : 'vehicle'} in the selected period.`}
      />
      <KhataKpiGrid
        label="ERP trip totals"
        loading={loading}
        items={[
          {
            label: 'Distance',
            value: distance > 0 ? formatKm(distance) : '—',
            sub: trips.length
              ? distance > 0
                ? 'Logged on the trips'
                : 'No distance on these trips'
              : noTrips,
          },
          {
            label: 'Cost per km',
            value: costPerKm || '—',
            sub: costPerKm
              ? 'Ledger cost ÷ trip distance'
              : trips.length
                ? 'Needs trip distance'
                : noTrips,
          },
          {
            label: 'Trip revenue',
            value: withFinance.length ? formatCurrency(revenue) : '—',
            sub: trips.length
              ? `Finances for ${withFinance.length} of ${trips.length} trips`
              : noTrips,
            noteTone: trips.length && !complete ? 'warn' : undefined,
          },
          {
            label: 'Net profit',
            value: complete ? formatCurrency(profit) : '—',
            sub: complete
              ? 'Revenue minus the ledger cost'
              : trips.length
                ? 'Some trip finances are missing'
                : noTrips,
            status: complete ? profitStatus.label : null,
            tone: complete && profit < 0 ? 'bad' : complete && profit > 0 ? 'ok' : 'neutral',
          },
        ]}
      />
      <KhataCard flush aria-label="ERP trips of this period">
        {loading ? (
          <KhataTableSkeleton rows={3} />
        ) : trips.length === 0 ? (
          <KhataEmpty icon={Route} title={noTrips}>
            Trips planned in ERP for this {isDriver ? 'driver' : 'vehicle'} show here with their
            revenue.
          </KhataEmpty>
        ) : (
          <>
            <Table className="khata-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="is-num">Distance</TableHead>
                  <TableHead className="is-num">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.map((trip) => {
                  const label = trip.tripNumber || `TRIP-${trip._id.slice(-6).toUpperCase()}`;
                  const fin = finances[trip._id];
                  return (
                    <TableRow key={trip._id}>
                      <TableCell>
                        <button
                          type="button"
                          className="khata-link"
                          onClick={() => onOpenTrip(trip._id)}
                          aria-label={`Open trip ${label}`}
                        >
                          {label}
                        </button>
                      </TableCell>
                      <TableCell>
                        {trip.fromLocation && trip.toLocation ? (
                          `${trip.fromLocation} → ${trip.toLocation}`
                        ) : (
                          <span className="khata-muted">Route not set</span>
                        )}
                      </TableCell>
                      <TableCell className="is-secondary">
                        {formatDate(trip.tripDate || trip.createdAt)}
                      </TableCell>
                      <TableCell>
                        <KhataPill small tone={tripStateTone(trip.state)}>
                          {tripStateLabel(trip.state)}
                        </KhataPill>
                      </TableCell>
                      <TableCell className="is-num">
                        {trip.totalKm > 0 ? formatKm(trip.totalKm) : '—'}
                      </TableCell>
                      <TableCell className="is-num">
                        {fin?.revenue != null ? formatCurrency(fin.revenue) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {trips.length > TRIPS_SHOWN ? (
              <div className="khata-strip">
                <button type="button" className="khata-link" onClick={() => setShowAll(!showAll)}>
                  {showAll ? 'Show fewer' : `Show all ${trips.length} trips`}
                </button>
              </div>
            ) : null}
          </>
        )}
      </KhataCard>
    </>
  );
};

function RankCard({ title, rows, loading }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <KhataCard title={title}>
      {loading ? (
        <div className="khata-rank-loading" role="status" aria-busy="true">
          <span className="sr-only">Loading…</span>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-7 w-full rounded" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="khata-foot-note">No entries in this period.</p>
      ) : (
        <ol className="khata-rank">
          {rows.map((row) => (
            <li key={row.name}>
              <span className="khata-rank-name">{row.name}</span>
              <span className="khata-rank-value">
                {formatCurrency(row.amount)}
                <small>{Math.round((row.amount / total) * 100)}%</small>
              </span>
              <span className="khata-track" aria-hidden="true">
                <span style={{ width: `${Math.max(2, (row.amount / rows[0].amount) * 100)}%` }} />
              </span>
            </li>
          ))}
        </ol>
      )}
    </KhataCard>
  );
}

/** Where the period's money went: by category, by source, and by vehicle or driver. */
export const LedgerBreakdownCards = ({ summary, isDriver, vehicles, drivers, loading }) => {
  const byCategory = rankRows(
    Object.entries(summary.byCategory || {}).map(([key, value]) => [categoryLabel(key), value]),
  );
  const bySource = rankRows(
    Object.entries(summary.bySource || {}).map(([key, value]) => [sourceLabel(key), value]),
  );
  const split = getLedgerSplitItems(summary, isDriver).map((item) => [
    resolveLedgerSplitLabel({ isDriver, item, vehicles, drivers, fallback: 'Unattributed' }),
    item.amount,
  ]);
  if (summary.unattributedAmount > 0) {
    split.push([isDriver ? 'No vehicle linked' : 'No driver linked', summary.unattributedAmount]);
  }

  return (
    <div className="khata-card-grid khata-breakdown">
      <RankCard title="By category" rows={byCategory} loading={loading} />
      <RankCard title="By source" rows={bySource} loading={loading} />
      <RankCard
        title={isDriver ? 'By vehicle' : 'By driver'}
        rows={rankRows(split)}
        loading={loading}
      />
    </div>
  );
};
