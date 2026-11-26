import InfoTip from '../../components/redesign/InfoTip';
import { formatNum } from '../../utils/formatters';
import { fmtDuration, fmtKm } from './autoTripFormat';
import { MIN_MILEAGE_KM, MIN_SAMPLE, shareText } from './tripListModel';

/**
 * The Trips KPI strip. The four status tiles are also the list's status tabs:
 * the count you read is the filter you click, so the page never shows the same
 * number twice. The last two tiles, the typical loaded run and the loaded
 * mileage, are measured on the latest delivered trips of the period.
 */
function KpiTab({ tabKey, label, count, sub, tone, selected, onSelect }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-label={`${label} ${formatNum(count)}`}
      className={`atx-kpi atx-kpi--tab${selected ? ' is-selected' : ''}`}
      onClick={() => onSelect(tabKey)}
    >
      <span className="atx-kpi-label">
        {tone ? <span className={`atx-kpi-dot atx-kpi-dot--${tone}`} aria-hidden="true" /> : null}
        {label}
      </span>
      <span className="atx-kpi-value">{formatNum(count)}</span>
      <span className="atx-kpi-sub">{sub}</span>
    </button>
  );
}

function RunTile({ run, loading, failed }) {
  const known = run?.km != null;
  let sub;
  if (known) {
    sub = `${run.min != null ? `${fmtDuration(run.min)} · ` : ''}median of ${formatNum(run.sample)}`;
  } else if (loading) {
    sub = 'Measuring…';
  } else if (failed) {
    sub = 'Could not load delivered trips';
  } else {
    sub = `Needs ${MIN_SAMPLE} delivered trips in this period`;
  }
  return (
    <div className="atx-kpi">
      <span className="atx-kpi-label">
        Typical loaded run
        <InfoTip
          text="The middle value of the loaded km (plant to last drop) of the latest delivered trips in this period. The odometer when the truck has one, else the GPS path."
          basis={
            known
              ? `The latest ${formatNum(run.sample)} delivered trips; ${formatNum(run.measured)} had a measured run.`
              : null
          }
          label="How the typical run is measured"
        />
      </span>
      <span className="atx-kpi-value">{known ? fmtKm(run.km) : '—'}</span>
      <span className="atx-kpi-sub">{sub}</span>
    </div>
  );
}

function MileageTile({ mileage, loading, failed }) {
  const known = mileage?.kmpl != null;
  let sub;
  if (known) {
    sub = `median of ${formatNum(mileage.measured)} trips`;
  } else if (loading) {
    sub = 'Measuring…';
  } else if (failed) {
    sub = 'Could not load delivered trips';
  } else {
    sub = `Needs ${MIN_SAMPLE} trips with a fuel reading`;
  }
  return (
    <div className="atx-kpi">
      <span className="atx-kpi-label">
        Loaded mileage
        <InfoTip
          text={`The middle km per litre of the loaded run (plant to last drop) of the latest delivered trips in this period: loaded km ÷ the diesel the truck's fuel sensor says it burned on that run. Runs under ${MIN_MILEAGE_KM} km, and trips whose fuel was not measured for the whole run, are left out.`}
          basis={
            mileage && !loading && !failed
              ? `${formatNum(mileage.measured)} of the latest ${formatNum(mileage.sample)} delivered trips had a full fuel reading.`
              : null
          }
          label="How the loaded mileage is measured"
        />
      </span>
      <span className="atx-kpi-value">{known ? `${mileage.kmpl.toFixed(2)} km/L` : '—'}</span>
      <span className="atx-kpi-sub">{sub}</span>
    </div>
  );
}

export default function TripKpiStrip({
  counts,
  todayCount = null,
  rangeIsToday = false,
  selectedTab,
  onSelect,
  run,
  mileage = null,
  runLoading,
  runFailed,
}) {
  const { all = 0, delivered = 0, open = 0, review = 0 } = counts || {};
  const tiles = [
    {
      tabKey: '',
      label: 'Trips',
      count: all,
      sub: rangeIsToday
        ? 'left a plant since midnight'
        : todayCount != null
          ? `${formatNum(todayCount)} left a plant today`
          : 'left a plant in this period',
    },
    {
      tabKey: 'COMPLETE',
      label: 'Delivered',
      count: delivered,
      tone: 'good',
      sub: `${shareText(delivered, all) ?? '—'} of trips`,
    },
    {
      tabKey: 'OPEN',
      label: 'On the road',
      count: open,
      tone: 'info',
      sub: 'left a plant, no drop yet',
    },
    {
      tabKey: 'NEEDS_REVIEW',
      label: 'Needs your answer',
      count: review,
      tone: review ? 'watch' : null,
      sub:
        review == null
          ? 'count unknown'
          : review
            ? `${shareText(review, all) ?? '—'} of trips`
            : 'nothing waiting',
    },
  ];
  return (
    <section className="atx-kpis" aria-label="Trips in this period">
      <div role="tablist" aria-label="Filter trips by status" className="atx-kpi-tabs">
        {tiles.map((tile) => (
          <KpiTab
            key={tile.tabKey || 'all'}
            {...tile}
            selected={selectedTab === tile.tabKey}
            onSelect={onSelect}
          />
        ))}
      </div>
      <RunTile run={run} loading={runLoading} failed={runFailed} />
      <MileageTile mileage={mileage} loading={runLoading} failed={runFailed} />
    </section>
  );
}
