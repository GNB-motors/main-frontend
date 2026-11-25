import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { LevelCell, ToolStatCard, ToolTable } from '../../components/toolPage';
import { useApi } from '../../hooks/useApi';
import { formatAgo, formatIst, formatNumber } from '../../utils/redesign/format';
import { formatInrCompact } from '../../utils/formatters';
import { RefuelAdvisoryService } from './RefuelAdvisoryService';
import { refuelAdvisoryResponseSchema } from '../../schemas/refuelAdvisory.schema';
import { STATUS, isStale, summarizeAdvisories } from './refuelAdvisoryModel';

const DASH = '—';
const FILTERS = ['', 'CRITICAL', 'REFUEL_SOON', 'OK'];
const plural = (count, one, many) => `${formatNumber(count)} ${count === 1 ? one : many}`;
const litres = (value) => (value == null ? DASH : `${formatNumber(value)} L`);
const ofTrucks = (part, whole) =>
  part === whole
    ? plural(whole, 'truck', 'trucks')
    : `${formatNumber(part)} of ${plural(whole, 'truck', 'trucks')}`;
const numberCell = (value, text) =>
  value == null ? <span className="pf-none">{DASH}</span> : <span className="tp-num">{text}</span>;

function TankCell({ advisory }) {
  const { pctFull, currentFuelL, tankCapacityL, status } = advisory;
  if (currentFuelL == null) return <span className="pf-none">{DASH}</span>;
  return (
    <LevelCell
      value={pctFull == null ? litres(currentFuelL) : `${formatNumber(pctFull)}%`}
      pct={pctFull}
      tone={STATUS[status]?.tone || 'ok'}
      note={
        tankCapacityL == null
          ? 'Tank size not on record'
          : `${formatNumber(currentFuelL)} of ${formatNumber(tankCapacityL)} L`
      }
    />
  );
}

export default function RefuelAdvisoryPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');

  const { data, loading, error, refetch } = useApi(
    (signal) =>
      RefuelAdvisoryService.getAdvisories({ limit: 500 }, signal).then((d) =>
        refuelAdvisoryResponseSchema.parse(d),
      ),
    [],
  );

  const advisories = useMemo(() => data?.advisories ?? [], [data]);
  const thresholds = data?.thresholds ?? null;
  const staleHours = thresholds?.staleReadingHours ?? null;
  const summary = useMemo(
    () => summarizeAdvisories(advisories, { staleReadingHours: staleHours }),
    [advisories, staleHours],
  );
  const rows = useMemo(() => {
    const needle = query.trim().toUpperCase().replace(/\s/g, '');
    return advisories.filter(
      (a) =>
        (!statusFilter || a.status === statusFilter) &&
        (!needle || (a.registrationNumber || '').replace(/\s/g, '').includes(needle)),
    );
  }, [advisories, statusFilter, query]);

  const waiting = loading && !data;
  const failed = Boolean(error) && !data;
  const { counts, atRisk, fleet, onBoard } = summary;
  const toggle = (key) => setStatusFilter((current) => (current === key ? '' : key));
  const limitNote = (rangeKm, pct, fallback) =>
    rangeKm != null && pct != null
      ? `Range ≤ ${formatNumber(rangeKm)} km or tank ≤ ${pct}%`
      : fallback;
  const unread = failed ? 'Could not be read' : null;

  const cards = [
    {
      title: 'Critical',
      figure: formatNumber(counts.CRITICAL),
      qualifier: counts.CRITICAL === 1 ? 'truck' : 'trucks',
      tone: counts.CRITICAL ? 'bad' : null,
      pill: counts.CRITICAL ? <span className="pf-pill pf-pill--bad">Refuel now</span> : null,
      note:
        unread || limitNote(thresholds?.criticalRangeKm, thresholds?.criticalPctFull, 'Refuel now'),
      onSelect: () => toggle('CRITICAL'),
      selected: statusFilter === 'CRITICAL',
    },
    {
      title: 'Refuel soon',
      figure: formatNumber(counts.REFUEL_SOON),
      qualifier: counts.REFUEL_SOON === 1 ? 'truck' : 'trucks',
      pill: counts.REFUEL_SOON ? <span className="pf-pill pf-pill--warn">Plan a fill</span> : null,
      note:
        unread ||
        limitNote(thresholds?.refuelSoonRangeKm, thresholds?.refuelSoonPctFull, 'Plan a fill'),
      onSelect: () => toggle('REFUEL_SOON'),
      selected: statusFilter === 'REFUEL_SOON',
    },
    {
      title: 'Enough fuel',
      figure: formatNumber(counts.OK),
      qualifier: counts.OK === 1 ? 'truck' : 'trucks',
      note:
        unread || `Above both limits · ${plural(summary.count, 'truck', 'trucks')} with a reading`,
      onSelect: () => toggle('OK'),
      selected: statusFilter === 'OK',
    },
    {
      title: 'Diesel in the tanks',
      figure: litres(onBoard.value),
      track: summary.pctFull,
      note:
        unread ||
        (summary.pctFull == null
          ? onBoard.trucks
            ? `${ofTrucks(onBoard.trucks, summary.count)} · tank sizes not on record`
            : 'No tank level on record'
          : `${formatNumber(summary.pctFull)}% full · ${ofTrucks(summary.tankTrucks, summary.count)} with a tank size`),
    },
    {
      title: 'To fill the trucks at risk',
      figure: atRisk.trucks ? formatInrCompact(atRisk.cost.value) : formatInrCompact(0),
      note:
        unread ||
        (!atRisk.trucks
          ? 'No truck needs a fill now'
          : atRisk.cost.value == null
            ? 'Fill cost not on record'
            : `${litres(atRisk.litres.value)} for ${ofTrucks(atRisk.cost.trucks, atRisk.trucks)}`),
    },
    {
      title: 'To fill every tank',
      figure: formatInrCompact(fleet.cost.value),
      note:
        unread ||
        (fleet.cost.value == null
          ? 'No fill cost on record'
          : `${litres(fleet.litres.value)} to top up ${ofTrucks(fleet.cost.trucks, summary.count)}`),
    },
    {
      title: 'Typical range left',
      figure: summary.medianRangeKm == null ? DASH : `${formatNumber(summary.medianRangeKm)} km`,
      note:
        unread ||
        (summary.shortest
          ? `Shortest ${summary.shortest.registrationNumber || 'truck'} · ${formatNumber(summary.shortest.estimatedRangeKm)} km`
          : 'No km/L history to work out range'),
    },
    {
      title: 'Fresh tank readings',
      figure:
        summary.stale == null
          ? formatNumber(summary.count)
          : formatNumber(summary.count - summary.stale),
      qualifier: summary.stale == null ? null : `of ${formatNumber(summary.count)}`,
      note:
        unread ||
        (summary.stale
          ? `${plural(summary.stale, 'truck', 'trucks')} older than ${staleHours} h`
          : summary.newestReadingAt
            ? `Newest ${formatAgo(summary.newestReadingAt)}`
            : 'No reading yet'),
      noteTone: summary.stale ? 'warn' : null,
    },
  ];

  const columns = [
    {
      key: 'truck',
      label: 'Truck',
      render: (a) =>
        a.registrationNumber ? (
          <Link
            className="pf-open tp-plate"
            to={`/vehicles/${encodeURIComponent(a.registrationNumber)}`}
          >
            {a.registrationNumber}
          </Link>
        ) : (
          <span className="pf-none">Not on record</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (a) => (
        <span className={`pf-pill pf-pill--${STATUS[a.status]?.tone || 'ok'}`}>
          {STATUS[a.status]?.label || 'Not classified'}
        </span>
      ),
    },
    { key: 'tank', label: 'Tank', render: (a) => <TankCell advisory={a} /> },
    {
      key: 'range',
      label: 'Range left',
      align: 'right',
      render: (a) => numberCell(a.estimatedRangeKm, `${formatNumber(a.estimatedRangeKm)} km`),
    },
    {
      key: 'kmpl',
      label: 'Km/L',
      align: 'right',
      render: (a) =>
        numberCell(a.avgEfficiencyKmpl, formatNumber(a.avgEfficiencyKmpl, { digits: 2 })),
    },
    {
      key: 'toFull',
      label: 'To fill',
      align: 'right',
      render: (a) => numberCell(a.litresToFull, litres(a.litresToFull)),
    },
    {
      key: 'cost',
      label: 'Fill cost',
      align: 'right',
      render: (a) => numberCell(a.estimatedFillCostInr, formatInrCompact(a.estimatedFillCostInr)),
    },
    {
      key: 'reading',
      label: 'Tank read',
      align: 'right',
      render: (a) => (
        <span
          className={`tp-num${isStale(a, staleHours) ? ' is-stale' : ''}`}
          title={a.lastReadingAt ? formatIst(a.lastReadingAt) : undefined}
        >
          {formatAgo(a.lastReadingAt)}
        </span>
      ),
    },
  ];

  const filterLabel = (key) => (key ? STATUS[key].label : 'All');

  return (
    <PageShell
      className="tp-page"
      title="Refuel Advisory"
      subtitle="How far each truck can still go on the diesel in its tank, and which ones need a fill."
      freshnessAt={summary.computedAt}
    >
      <PanelErrorBoundary name="refuel-advisory">
        <div className="tp-stats" role="group" aria-label="Fleet fuel summary">
          {cards.map((card) => (
            <ToolStatCard
              key={card.title}
              loading={waiting}
              {...card}
              {...(failed ? { figure: DASH, qualifier: null, tone: null, pill: null } : null)}
            />
          ))}
        </div>

        <ToolTable
          title="Trucks"
          sub={
            rows.length === advisories.length
              ? `${plural(advisories.length, 'truck', 'trucks')} · shortest range first`
              : `${formatNumber(rows.length)} of ${plural(advisories.length, 'truck', 'trucks')}`
          }
          segment={{
            label: 'Filter by status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: FILTERS.map((key) => ({
              key,
              label: filterLabel(key),
              count: formatNumber(key ? counts[key] : summary.count),
            })),
          }}
          search={{ label: 'Search a truck', value: query, onChange: setQuery }}
          columns={columns}
          rows={rows}
          rowKey={(a) => a._id || a.registrationNumber}
          loading={waiting}
          error={failed ? error : null}
          onRetry={refetch}
          emptyTitle={
            advisories.length
              ? `No truck matches ${query.trim() ? `“${query.trim()}”` : filterLabel(statusFilter).toLowerCase()}`
              : 'No truck has a recent tank reading'
          }
          emptyHint={
            advisories.length
              ? null
              : `A truck shows up once its tank sensor reports${staleHours ? ` within ${staleHours} h` : ''} and it has a km/L history.`
          }
        />
      </PanelErrorBoundary>
    </PageShell>
  );
}
