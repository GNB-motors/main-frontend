import Link from '@/components/redesign/FleetLink';
import { ArrowUpRight, Fuel } from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import InfoTip from '@/components/redesign/InfoTip';
import { formatIstDate } from '../../../utils/redesign/format';
import { fleetDestination } from '@/utils/redesign/fleetDestination';
import DigestSkeleton from './DigestSkeleton';

/** "41 trips" from a story card's big line ("41 trips · 4,820 km"). */
const tripsOf = (card) => {
  const match = /([\d,]+)\s+trips?\b/i.exec(card?.big || '');
  return match ? `${match[1]} ${match[1] === '1' ? 'trip' : 'trips'}` : null;
};

const fmt = (value) =>
  value == null ? '—' : value.toLocaleString('en-IN', { maximumFractionDigits: 1 });

function Panel({
  title,
  info = null,
  to,
  children,
  className = '',
  loading = false,
  skeleton = 'list',
}) {
  const destination = fleetDestination(to);
  return (
    <section className={`db-card ${className}`}>
      <header className="db-card-head">
        <h3>{title}</h3>
        {info ? <InfoTip text={info} label={`About ${title}`} /> : null}
        {destination ? (
          <span className="db-card-action">
            <Link className="db-link" to={destination}>
              Open <ArrowUpRight size={13} />
            </Link>
          </span>
        ) : null}
      </header>
      {loading ? (
        <DigestSkeleton variant={skeleton} label={`Loading ${title.toLowerCase()}`} />
      ) : (
        children
      )}
    </section>
  );
}

/**
 * Two performance cards for the "Running, fuel and drivers" row: loaded vs
 * empty distance for the report day, and seven days of measured fuel. They
 * render as siblings so the parent grid can place them beside the driver
 * lists.
 */
export default function FleetAnalytics({
  model,
  fuel,
  fuelTrend,
  loading,
  loadingSections = {},
  day,
}) {
  const { loadedKm, emptyKm } = model;
  const measured = loadedKm != null || emptyKm != null;
  const complete = loadedKm != null && emptyKm != null;
  const total = measured ? (loadedKm ?? 0) + (emptyKm ?? 0) : null;
  const knownDays = fuelTrend.filter((d) => d.litres != null);
  const summary = fuelTrend.reduce((sum, d) => sum + (d.litres ?? 0), 0);
  const runningWhy =
    model.loadedTrips != null
      ? 'The same pickup-departure day and detector version as Trips. Loaded km uses the odometer first; approach and return are empty km. Missing legs remain unknown.'
      : [model.cards.loaded?.text, model.cards.empty?.text].filter(Boolean).join(' ');

  return (
    <>
      <Panel
        title="Loaded vs empty running"
        info={runningWhy || 'Distance attributed to the selected day.'}
        to={
          model.loadedTrips != null && day
            ? `/auto-trips?range=custom&from=${day}&to=${day}`
            : model.cards.loaded?.link?.to || '/auto-trips'
        }
        className="db-running"
        loading={loadingSections.running ?? (loading && !measured)}
        skeleton="chart"
      >
        {!measured ? (
          <p className="db-empty-line">
            {loading
              ? 'Loading distance…'
              : `— ${model.runningReason || 'Loaded and empty distance are not available for this day.'}`}
          </p>
        ) : (
          <>
            <div className="db-big-number">
              {fmt(total)} <span>km attributed</span>
            </div>
            {total > 0 && complete ? (
              <div
                className="db-split"
                role="img"
                aria-label={`Loaded ${fmt(loadedKm)} km, empty ${fmt(emptyKm)} km`}
              >
                <span
                  className="db-split-loaded"
                  style={{ width: `${(loadedKm / total) * 100}%` }}
                />
                <span className="db-split-empty" style={{ width: `${(emptyKm / total) * 100}%` }} />
              </div>
            ) : total === 0 ? (
              <p className="db-muted">No attributed running distance for this day.</p>
            ) : null}
            {model.runningPartial || !complete ? (
              <p className="db-muted">
                Partial distance: some trips or legs have no recorded km yet.
              </p>
            ) : null}
            <dl className="db-kv db-kv--keyed">
              <div>
                <dt>
                  <i className="db-key db-key--loaded" />
                  Loaded
                </dt>
                <dd>
                  {fmt(loadedKm)} km
                  <small>
                    {[
                      complete && total > 0 ? `${((loadedKm / total) * 100).toFixed(1)}%` : null,
                      model.loadedTrips != null
                        ? `${fmt(model.loadedTrips)} trips`
                        : tripsOf(model.cards.loaded),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </small>
                </dd>
              </div>
              <div>
                <dt>
                  <i className="db-key db-key--empty" />
                  Empty
                </dt>
                <dd>
                  {fmt(emptyKm)} km
                  <small>
                    {complete && total > 0
                      ? `${((emptyKm / total) * 100).toFixed(1)}%`
                      : emptyKm == null
                        ? 'Not measured'
                        : null}
                  </small>
                </dd>
              </div>
            </dl>
          </>
        )}
      </Panel>

      <Panel
        title="Fuel, last 7 days"
        info={
          fuel.data?.basis ||
          'Recorded daily engine consumption in IST, using one measured source per truck/day. Gaps are missing readings; partial days show only recorded consumption.'
        }
        to="/mileage"
        className="db-fuel"
        loading={fuel.loading && !fuel.data}
        skeleton="chart"
      >
        {fuel.error ? (
          <p className="db-empty-line">
            Fuel history could not load.{' '}
            <button type="button" className="db-link" onClick={fuel.refetch}>
              Retry
            </button>
          </p>
        ) : knownDays.length === 0 ? (
          <div className="db-people-empty">
            <Fuel size={20} aria-hidden="true" />
            <p className="db-empty-line">No engine consumption readings in this window.</p>
          </div>
        ) : (
          <>
            <div className="db-big-number">
              {fmt(summary)} L <span>recorded consumption</span>
            </div>
            <p className="db-muted">
              {knownDays.length} of 7 days with readings
              {knownDays.some((d) => d.partial) ? ' · partial coverage' : ''}
            </p>
            <div
              className="db-fuel-chart"
              role="img"
              aria-label="Recorded daily engine consumption over the last seven IST days"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fuelTrend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--rd-line)" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    tickFormatter={(d) => String(Number(d.slice(8)))}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--rd-ink-3)' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--rd-ink-3)' }}
                  />
                  <Tooltip
                    labelFormatter={(d) => formatIstDate(new Date(`${d}T12:00:00+05:30`))}
                    formatter={(v, _n, item) => [
                      `${fmt(v)} L · ${item?.payload?.measuredTrucks ?? 0} trucks${item?.payload?.partial ? ' · partial' : ''}`,
                      'Consumed',
                    ]}
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: 'var(--rd-line)',
                      background: 'var(--rd-card)',
                      color: 'var(--rd-ink)',
                      fontSize: 13,
                    }}
                  />
                  <Line
                    dataKey="litres"
                    type="linear"
                    stroke="var(--rd-brand-2)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Panel>
    </>
  );
}
