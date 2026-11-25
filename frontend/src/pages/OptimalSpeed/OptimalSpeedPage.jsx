import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { LevelCell, ToolStatCard, ToolTable } from '../../components/toolPage';
import { useApi } from '../../hooks/useApi';
import { formatNumber } from '../../utils/redesign/format';
import { formatInrCompact } from '../../utils/formatters';
import { OptimalSpeedService } from './OptimalSpeedService';
import { optimalSpeedResponseSchema } from '../../schemas/optimalSpeed.schema';
import { bandLabel, summarizeProfiles } from './optimalSpeedModel';

const DASH = '—';
const SORTS = [
  { key: 'savings', label: 'Most ₹ to save' },
  { key: 'efficiency', label: 'Lowest km/L' },
];
const plural = (count, one, many) => `${formatNumber(count)} ${count === 1 ? one : many}`;
const ofTrucks = (part, whole) =>
  part === whole
    ? plural(whole, 'truck', 'trucks')
    : `${formatNumber(part)} of ${plural(whole, 'truck', 'trucks')}`;
const kmpl = (value) => (value == null ? DASH : formatNumber(value, { digits: 2 }));
const numberCell = (value, text) =>
  value == null ? <span className="pf-none">{DASH}</span> : <span className="tp-num">{text}</span>;
const rankValue = (sort, p) =>
  sort === 'efficiency' ? (p.avgEfficiencyKmpl ?? Infinity) : -(p.potentialSavingsInr ?? -Infinity);

export default function OptimalSpeedPage() {
  const [sort, setSort] = useState('savings');
  const [outsideOnly, setOutsideOnly] = useState(false);
  const [query, setQuery] = useState('');

  const { data, loading, error, refetch } = useApi(
    (signal) =>
      OptimalSpeedService.getProfiles({ limit: 500 }, signal).then((d) =>
        optimalSpeedResponseSchema.parse(d),
      ),
    [],
  );

  const profiles = useMemo(() => data?.profiles ?? [], [data]);
  const lookbackDays = data?.window?.lookbackDays ?? null;
  const summary = useMemo(() => summarizeProfiles(profiles), [profiles]);
  const rows = useMemo(() => {
    const needle = query.trim().toUpperCase().replace(/\s/g, '');
    return profiles
      .filter(
        (p) =>
          (!outsideOnly || p.pctDistanceInOptimalBand < 50) &&
          (!needle || (p.registrationNumber || '').replace(/\s/g, '').includes(needle)),
      )
      .sort((a, b) => rankValue(sort, a) - rankValue(sort, b));
  }, [profiles, outsideOnly, query, sort]);

  const waiting = loading && !data;
  const failed = Boolean(error) && !data;
  const unread = failed ? 'Could not be read' : null;
  const period = lookbackDays ? `last ${lookbackDays} days` : 'the recent window';
  const { savingsInr, savingsL, top } = summary;

  const cards = [
    {
      title: '₹ to save',
      figure: formatInrCompact(savingsInr.value),
      qualifier: lookbackDays ? `in ${lookbackDays} days` : null,
      note:
        unread ||
        (savingsInr.value == null
          ? 'No fuel price on record'
          : `${formatNumber(savingsL.value)} L of diesel · ${ofTrucks(savingsInr.trucks, summary.count)}`),
    },
    {
      title: 'Km in the best band',
      figure: summary.pctInBand == null ? DASH : `${formatNumber(summary.pctInBand)}%`,
      track: summary.pctInBand,
      note:
        unread ||
        (summary.distanceKm == null
          ? 'No speed-band distance yet'
          : `${formatNumber(summary.inBandKm)} of ${formatNumber(summary.distanceKm)} km`),
    },
    {
      title: 'Fleet km/L',
      figure: kmpl(summary.fleetKmpl),
      note:
        unread ||
        (summary.bestKmpl == null
          ? 'No band km/L yet'
          : `${kmpl(summary.bestKmpl)} if every truck held its best band`),
    },
    {
      title: 'Mostly outside their band',
      figure: formatNumber(summary.mostlyOutside),
      qualifier: summary.mostlyOutside === 1 ? 'truck' : 'trucks',
      pill: summary.mostlyOutside ? (
        <span className="pf-pill pf-pill--warn">Worth a talk</span>
      ) : null,
      note: unread || 'Less than half their km in the best band',
      onSelect: () => setOutsideOnly((on) => !on),
      selected: outsideOnly,
    },
    {
      title: 'Biggest saving',
      figure: top ? formatInrCompact(top.potentialSavingsInr) : DASH,
      qualifier: top?.registrationNumber ?? null,
      note:
        unread ||
        (top
          ? `Best at ${bandLabel(top.optimalMinKmh, top.optimalMaxKmh) || 'an unknown band'} · ${formatNumber(top.pctDistanceInOptimalBand)}% of km there`
          : 'No truck has a ₹ figure yet'),
    },
    {
      title: 'Most common best band',
      figure: summary.commonBand ?? DASH,
      note:
        unread ||
        (summary.commonBand
          ? `Best band for ${ofTrucks(summary.commonBandTrucks, summary.count)}`
          : 'No best band learned yet'),
    },
    {
      title: 'Typical average speed',
      figure: summary.avgSpeedKmh == null ? DASH : `${formatNumber(summary.avgSpeedKmh)} km/h`,
      note: unread || 'Mean of each truck’s average moving speed',
    },
    {
      title: 'Trucks profiled',
      figure: formatNumber(summary.count),
      qualifier: summary.count === 1 ? 'truck' : 'trucks',
      note:
        unread ||
        (summary.windows
          ? `${formatNumber(summary.windows)} fuel windows · ${period}`
          : `Learned over the ${period}`),
    },
  ];

  const columns = [
    {
      key: 'truck',
      label: 'Truck',
      render: (p) =>
        p.registrationNumber ? (
          <Link
            className="pf-open tp-plate"
            to={`/vehicles/${encodeURIComponent(p.registrationNumber)}`}
          >
            {p.registrationNumber}
          </Link>
        ) : (
          <span className="pf-none">Not on record</span>
        ),
    },
    {
      key: 'band',
      label: 'Best band',
      render: (p) => {
        const label = bandLabel(p.optimalMinKmh, p.optimalMaxKmh);
        return label ? (
          <span className="pf-pill pf-pill--info">{label}</span>
        ) : (
          <span className="pf-none">Not learned yet</span>
        );
      },
    },
    {
      key: 'bestKmpl',
      label: 'Km/L in band',
      align: 'right',
      render: (p) => numberCell(p.optimalEfficiencyKmpl, kmpl(p.optimalEfficiencyKmpl)),
    },
    {
      key: 'avgKmpl',
      label: 'Km/L overall',
      align: 'right',
      render: (p) => numberCell(p.avgEfficiencyKmpl, kmpl(p.avgEfficiencyKmpl)),
    },
    {
      key: 'speed',
      label: 'Average speed',
      align: 'right',
      render: (p) => numberCell(p.avgSpeedKmh, `${formatNumber(p.avgSpeedKmh)} km/h`),
    },
    {
      key: 'inBand',
      label: 'Km in best band',
      render: (p) =>
        p.pctDistanceInOptimalBand == null ? (
          <span className="pf-none">{DASH}</span>
        ) : (
          <LevelCell
            value={`${formatNumber(p.pctDistanceInOptimalBand)}%`}
            pct={p.pctDistanceInOptimalBand}
            tone={p.pctDistanceInOptimalBand < 50 ? 'warn' : 'ok'}
          />
        ),
    },
    {
      key: 'litres',
      label: 'Diesel to save',
      align: 'right',
      render: (p) => numberCell(p.potentialSavingsL, `${formatNumber(p.potentialSavingsL)} L`),
    },
    {
      key: 'inr',
      label: '₹ to save',
      align: 'right',
      render: (p) => numberCell(p.potentialSavingsInr, formatInrCompact(p.potentialSavingsInr)),
    },
  ];

  return (
    <PageShell
      className="tp-page"
      title="Optimal Speed"
      subtitle="The speed band each truck burns the least diesel in, and the ₹ lost running outside it."
      freshnessAt={summary.computedAt}
    >
      <PanelErrorBoundary name="optimal-speed">
        <div className="tp-stats" role="group" aria-label="Fleet speed summary">
          {cards.map((card) => (
            <ToolStatCard
              key={card.title}
              loading={waiting}
              {...card}
              {...(failed ? { figure: DASH, qualifier: null, pill: null } : null)}
            />
          ))}
        </div>

        <ToolTable
          title="Trucks"
          sub={
            rows.length === profiles.length
              ? `${plural(profiles.length, 'truck', 'trucks')} · ${period}`
              : `${formatNumber(rows.length)} of ${plural(profiles.length, 'truck', 'trucks')}${outsideOnly ? ' · mostly outside their band' : ''}`
          }
          segment={{
            label: 'Order the trucks',
            value: sort,
            onChange: setSort,
            options: SORTS,
          }}
          search={{ label: 'Search a truck', value: query, onChange: setQuery }}
          columns={columns}
          rows={rows}
          rowKey={(p) => p._id || p.registrationNumber}
          loading={waiting}
          error={failed ? error : null}
          onRetry={refetch}
          emptyTitle={
            profiles.length
              ? `No truck matches ${query.trim() ? `“${query.trim()}”` : 'this filter'}`
              : 'No truck has a speed profile yet'
          }
          emptyHint={
            profiles.length
              ? null
              : 'A truck shows up once it has a few fuel windows with moving speed readings.'
          }
        />
      </PanelErrorBoundary>
    </PageShell>
  );
}
