import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import SectionCard from '@/components/redesign/SectionCard';
import PlaceName from '@/components/redesign/PlaceName';
import DataTable from '@/components/ui/DataTable';
import { formatDuration, formatInr, formatIst, formatL, formatNumber } from '@/utils/redesign/format';
import IntelligenceDataState from './IntelligenceDataState';
import IntelligenceService from './IntelligenceService';
import { INSTANCE_EMPTY_COPY } from './intelligenceModel';

const PAGE_SIZE = 25;

const SUB_TABS = [
  { id: 'cruise', label: 'Cruise' },
  { id: 'gear', label: 'Gears' },
];

/**
 * InstancesTab — the moments behind one kind of event.
 *
 * Idling, overspeed, cruise, gears, detours and fuel checks all read the
 * same way: what the system saw, when, where, and how much. Every row links
 * to the replay of that exact moment.
 */
export default function InstancesTab({ kind, from, to, vehicle = '', driver = '' }) {
  const [page, setPage] = useState(1);
  const [subKind, setSubKind] = useState('cruise');

  const activeKind = kind === 'cruise' ? subKind : kind;

  const { data, loading, error, refetch } = useApi(
    (signal) =>
      IntelligenceService.getInstances({
        kind: activeKind,
        from,
        to,
        vehicle,
        driver,
        page,
        limit: PAGE_SIZE,
        signal,
      }),
    [activeKind, from, to, vehicle, driver, page],
  );

  const held = data?.held ? data.why : null;
  const summary = data?.summary ?? null;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const columns = [
    { key: 'truck', label: 'Truck', render: (row) => row?.registrationNumber ?? '—' },
    { key: 'driver', label: 'Driver', render: (row) => row?.driverName ?? '—' },
    {
      key: 'when',
      label: 'When',
      sortKey: 'startAt',
      sortable: Boolean(data?.sortBy),
      render: (row) => formatIst(row?.startAt),
    },
    { key: 'where', label: 'Where', render: (row) => <PlaceName place={row?.place} /> },
    {
      key: 'howMuch',
      label: 'How much',
      render: (row) =>
        row?.value === null || row?.value === undefined
          ? '—'
          : `${formatNumber(row.value, { digits: 1 })}${row?.unit ? ` ${row.unit}` : ''}`,
    },
    { key: 'what', label: 'What happened', render: (row) => row?.text ?? '—' },
    {
      key: 'actions',
      label: 'Look',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          {row?.replay?.to ? (
            <Link
              to={row.replay.to}
              className="text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
            >
              {`${row.replay.label || 'See on map'} →`}
            </Link>
          ) : null}
          {row?.trip?.to ? (
            <Link
              to={row.trip.to}
              className="text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
            >
              {`${row.trip.label || 'Trip'} →`}
            </Link>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      {kind === 'cruise' ? (
        <div role="group" aria-label="Cruise and gears" className="flex items-center gap-1">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeKind === tab.id}
              onClick={() => {
                setSubKind(tab.id);
                setPage(1);
              }}
              className={`rounded-[var(--rd-radius-xs)] px-2.5 py-1 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)] ${
                activeKind === tab.id
                  ? 'bg-[var(--rd-brand-tint)] text-[var(--rd-brand-2)]'
                  : 'text-[var(--rd-ink-2)] hover:bg-[var(--rd-card-2)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <IntelligenceDataState
        loading={loading}
        error={error}
        held={held}
        what="This list of moments"
        onRetry={refetch}
      >
        <SectionCard
          tone="info"
          title="What the system saw"
          info={{ text: 'Every number here comes from the truck’s own reports, and every row opens the map at that moment.' }}
        >
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <span className="text-[28px] font-[650] text-[var(--rd-ink)] tabular-nums">
              {formatNumber(summary?.count)}
            </span>
            <span className="text-[13px] text-[var(--rd-ink-2)]">in this period</span>
            {summary?.totalMin !== null && summary?.totalMin !== undefined ? (
              <span className="text-[13px] text-[var(--rd-ink-2)]">{`${formatDuration(summary.totalMin)} in total`}</span>
            ) : null}
            {summary?.totalL !== null && summary?.totalL !== undefined ? (
              <span className="text-[13px] text-[var(--rd-ink-2)]">{formatL(summary.totalL)}</span>
            ) : null}
            {summary?.totalInr !== null && summary?.totalInr !== undefined ? (
              <span className="text-[13px] text-[var(--rd-ink-2)]">{formatInr(summary.totalInr)}</span>
            ) : null}
          </div>
          {summary?.why?.text ? (
            <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[var(--rd-ink-2)]">
              {summary.why.text}
              {summary.why.basis ? (
                <span className="block text-[12px] text-[var(--rd-ink-3)]">{summary.why.basis}</span>
              ) : null}
            </p>
          ) : null}
        </SectionCard>

        <DataTable
          className="mt-3"
          columns={columns}
          rows={items}
          rowKey={(row) => row?.id ?? row?.startAt}
          showing={items.length}
          total={total}
          paginated={totalPages > 1}
          emptyTitle={INSTANCE_EMPTY_COPY[activeKind] ?? 'Nothing of this kind in this period.'}
        />
      </IntelligenceDataState>

      {totalPages > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page <= 1}
            aria-label="Previous page"
            className="inline-flex items-center gap-1 rounded-[var(--rd-radius-xs)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-2 py-1 text-[13px] font-medium text-[var(--rd-ink-2)] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
          >
            <ChevronLeft size={14} aria-hidden="true" />
            Previous
          </button>
          <span className="text-[12px] text-[var(--rd-ink-3)] tabular-nums">{`Page ${page} of ${totalPages}`}</span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={page >= totalPages}
            aria-label="Next page"
            className="inline-flex items-center gap-1 rounded-[var(--rd-radius-xs)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-2 py-1 text-[13px] font-medium text-[var(--rd-ink-2)] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
          >
            Next
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
