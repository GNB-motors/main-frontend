import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import { LevelCell, ToolStatCard, ToolTable } from '../../components/toolPage';
import { useApi } from '../../hooks/useApi';
import { formatNumber } from '../../utils/redesign/format';
import { formatInrCompact } from '../../utils/formatters';
import { DrivingDnaService } from './DrivingDnaService';
import { drivingDnaResponseSchema } from '../../schemas/drivingDna.schema';
import { GRADES, GRADE_TONE, gradeRange, scoreTone, summarizeDna } from './drivingDnaModel';

const DASH = '—';
const plural = (count, one, many) => `${formatNumber(count)} ${count === 1 ? one : many}`;
const ofTrucks = (part, whole) =>
  part === whole
    ? plural(whole, 'truck', 'trucks')
    : `${formatNumber(part)} of ${plural(whole, 'truck', 'trucks')}`;
const pct = (value) => (value == null ? DASH : `${formatNumber(value, { digits: 1 })}%`);

export default function DrivingDnaPage() {
  const [grade, setGrade] = useState('');
  const [query, setQuery] = useState('');

  const { data, loading, error, refetch } = useApi(
    (signal) =>
      DrivingDnaService.getProfiles({ limit: 500 }, signal).then((d) =>
        drivingDnaResponseSchema.parse(d),
      ),
    [],
  );

  const profiles = useMemo(() => data?.profiles ?? [], [data]);
  const rules = data?.rules ?? null;
  const thresholds = rules?.gradeThresholds ?? undefined;
  const summary = useMemo(() => summarizeDna(profiles), [profiles]);
  const rows = useMemo(() => {
    const needle = query.trim().toUpperCase().replace(/\s/g, '');
    return profiles.filter(
      (p) =>
        (!grade || p.grade === grade) &&
        (!needle || (p.registrationNumber || '').replace(/\s/g, '').includes(needle)),
    );
  }, [profiles, grade, query]);

  const waiting = loading && !data;
  const failed = Boolean(error) && !data;
  const unread = failed ? 'Could not be read' : null;
  const limitKmh = rules?.overspeedThresholdKmh;
  const { speeding, overRev, weakest, lowest } = summary;
  const toggle = (key) => setGrade((current) => (current === key ? '' : key));

  const cards = [
    {
      title: 'Fleet score',
      figure: summary.avgScore == null ? DASH : formatNumber(summary.avgScore),
      qualifier: summary.avgScore == null ? null : 'of 100',
      track: summary.avgScore,
      note:
        unread ||
        (weakest
          ? `Weakest area: ${weakest.label.toLowerCase()} · ${formatNumber(weakest.score)} of 100`
          : 'No truck has a score yet'),
    },
    {
      title: 'Excess idling',
      figure: summary.idleHours == null ? DASH : `${formatNumber(summary.idleHours)} h`,
      note:
        unread ||
        (summary.idleRupees.value == null
          ? 'No idling on record'
          : `${formatInrCompact(summary.idleRupees.value)} of diesel burnt standing · ${ofTrucks(summary.idleTrucks, summary.count)}`),
    },
    {
      title: 'Harsh speeding',
      figure: pct(speeding.pct),
      qualifier: speeding.pct == null ? null : 'of moving readings',
      note:
        unread ||
        (speeding.pct == null
          ? 'No moving readings yet'
          : `Above ${limitKmh ?? 'the'}${limitKmh ? ' km/h' : ' limit'} · ${formatNumber(speeding.hits)} of ${formatNumber(speeding.of)} readings`),
    },
    {
      title: 'Over-revving',
      figure: pct(overRev.pct),
      qualifier: overRev.pct == null ? null : 'of rpm readings',
      note:
        unread ||
        (overRev.trucks
          ? `${ofTrucks(overRev.trucks, summary.count)} send engine rpm`
          : 'No truck sends engine rpm'),
    },
    ...GRADES.map((key) => ({
      title: `Grade ${key}`,
      figure: formatNumber(summary.grades[key]),
      qualifier: summary.grades[key] === 1 ? 'truck' : 'trucks',
      tone: key === 'D' && summary.grades.D ? 'bad' : null,
      pill:
        key === 'D' && summary.grades.D ? (
          <span className="pf-pill pf-pill--bad">Needs attention</span>
        ) : null,
      note:
        unread ||
        (key === 'D' && lowest
          ? `${gradeRange(key, thresholds)} · lowest ${lowest.registrationNumber || 'truck'} ${formatNumber(lowest.drivingScore)}`
          : gradeRange(key, thresholds)),
      onSelect: () => toggle(key),
      selected: grade === key,
    })),
  ];

  const subScore = (value, note, missing = DASH) =>
    value == null ? (
      <span className="pf-none">{missing}</span>
    ) : (
      <LevelCell
        value={formatNumber(value)}
        pct={value}
        tone={scoreTone(value, thresholds)}
        note={note}
      />
    );

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
      key: 'score',
      label: 'Score',
      render: (p) =>
        p.drivingScore == null ? (
          <span className="pf-none">Not scored</span>
        ) : (
          <span className="tp-inline">
            <span className={`pf-pill pf-pill--${GRADE_TONE[p.grade] || 'info'}`}>
              {p.grade ? `Grade ${p.grade}` : 'No grade'}
            </span>
            <b className="tp-num">{formatNumber(p.drivingScore)}</b>
          </span>
        ),
    },
    {
      key: 'idle',
      label: 'Idling',
      render: (p) =>
        subScore(
          p.idleScore,
          p.idleExcessMinutes
            ? `${formatNumber(p.idleExcessMinutes / 60, { digits: 1 })} h extra · ${formatInrCompact(p.idleRupees)}`
            : null,
        ),
    },
    {
      key: 'speeding',
      label: 'Speeding',
      render: (p) =>
        subScore(
          p.speedingScore,
          p.speedingRate != null ? `${pct(p.speedingRate * 100)} of moving readings` : null,
        ),
    },
    {
      key: 'overRev',
      label: 'Over-revving',
      render: (p) =>
        p.overRevScore == null && !(p.canSamples > 0) ? (
          <span className="pf-none">No rpm data</span>
        ) : (
          subScore(
            p.overRevScore,
            p.overRevRate != null ? `${pct(p.overRevRate * 100)} of rpm readings` : null,
            'Too few rpm readings',
          )
        ),
    },
    {
      key: 'readings',
      label: 'Moving readings',
      align: 'right',
      render: (p) =>
        p.movingSamples ? (
          <span className="tp-num">{formatNumber(p.movingSamples)}</span>
        ) : (
          <span className="pf-none">{DASH}</span>
        ),
    },
  ];

  return (
    <PageShell
      className="tp-page"
      title="Driving DNA"
      subtitle="How each truck is driven, scored 0–100 from excess idling, harsh speeding and over-revving."
      freshnessAt={summary.computedAt}
    >
      <PanelErrorBoundary name="driving-dna">
        <div className="tp-stats" role="group" aria-label="Fleet driving summary">
          {cards.map((card) => (
            <ToolStatCard
              key={card.title}
              loading={waiting}
              {...card}
              {...(failed
                ? { figure: DASH, qualifier: null, tone: null, pill: null, track: null }
                : null)}
            />
          ))}
        </div>

        <ToolTable
          title="Trucks"
          sub={
            rows.length === profiles.length
              ? `${plural(profiles.length, 'truck', 'trucks')} · lowest score first${rules?.lookbackDays ? ` · last ${rules.lookbackDays} days` : ''}`
              : `${formatNumber(rows.length)} of ${plural(profiles.length, 'truck', 'trucks')}`
          }
          segment={{
            label: 'Filter by grade',
            value: grade,
            onChange: setGrade,
            options: [
              { key: '', label: 'All', count: formatNumber(summary.count) },
              ...GRADES.map((key) => ({
                key,
                label: key,
                count: formatNumber(summary.grades[key]),
              })),
            ],
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
              ? `No truck matches ${query.trim() ? `“${query.trim()}”` : `grade ${grade}`}`
              : 'No truck has a driving score yet'
          }
          emptyHint={
            profiles.length
              ? null
              : 'A truck shows up once it has enough moving readings in the window.'
          }
        />
      </PanelErrorBoundary>
    </PageShell>
  );
}
