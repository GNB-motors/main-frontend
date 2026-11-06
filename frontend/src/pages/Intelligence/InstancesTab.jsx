import { IntelligenceViewSwitcher } from './IntelligenceWorkspace.jsx';
import { useMemo, useState } from 'react';
import Link from '@/components/redesign/FleetLink';
import { ChevronLeft, ChevronRight, Route, Search } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import PlaceName from '@/components/redesign/PlaceName';
import DataTable from '@/components/ui/DataTable';
import { formatDuration, formatInr, formatNumber } from '@/utils/redesign/format';
import { useGoToLink } from '@/utils/redesign/links';
import IntelligenceDataState from './IntelligenceDataState';
import IntelligenceService from './IntelligenceService';
import { INSTANCE_EMPTY_COPY, humanizeDates, isTemplatedText, whenText } from './intelligenceModel';
import {
  eventCountLabel,
  formatLitres,
  formatMinutes,
  rowMinutes,
  withRoundedMinutes,
} from './intelligenceFormat';

const PAGE_SIZE = 25;

const SUB_TABS = [
  { id: 'cruise', label: 'Cruise' },
  { id: 'gear', label: 'Gears' },
];

/** What one row of each kind is called, for the count. */
const NOUNS = {
  idle: ['idle', 'idles'],
  overspeed: ['stretch', 'stretches'],
  detour: ['detour', 'detours'],
  fuel_unexplained: ['window', 'windows'],
  cruise: ['reading', 'readings'],
  gear: ['reading', 'readings'],
};

/** What the number of each kind is. */
const VALUE_LABELS = {
  idle: 'Idled',
  overspeed: 'Speed',
  detour: 'Off the usual road',
  fuel_unexplained: 'Unaccounted',
  cruise: 'Engine speed',
  gear: 'Reading',
};

/** A caveat a kind's total needs, said once above the table. */
const CAVEATS = {
  fuel_unexplained:
    'Each window is a rolling stretch of days and the windows of one truck overlap, so the litres of different rows can include the same loss. Read a row as one truck’s check, not the total as a sum of losses.',
};

const valueText = (row) =>
  row?.unit === 'min'
    ? formatMinutes(rowMinutes(row))
    : row?.value === null || row?.value === undefined
      ? '—'
      : `${formatNumber(row.value, { digits: 1 })}${row?.unit ? ` ${row.unit}` : ''}`;

/**
 * InstancesTab — the moments behind one kind of event.
 *
 * Idling, overspeed, cruise, gears, detours and fuel checks all read the
 * same way: a short summary line, then one row per moment. The whole row
 * opens the map at that moment. Columns the API left empty on every row
 * are not drawn, and a sentence that only repeats the row's number is said
 * once instead of on every row.
 */
export default function InstancesTab({ kind, from, to, vehicle = '', driver = '' }) {
  const [page, setPage] = useState(1);
  const [subKind, setSubKind] = useState('cruise');
  const [filterText, setFilterText] = useState('');
  const goTo = useGoToLink();

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
  const items = useMemo(() => data?.items ?? [], [data?.items]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const [one, many] = NOUNS[activeKind] ?? ['moment', 'moments'];
  const count =
    summary?.count == null
      ? { value: '—', label: 'count unavailable' }
      : eventCountLabel(summary.count, total);

  const anyDriver = items.some((row) => row?.driverName);
  const anyPlace = items.some((row) => row?.place && (row.place.name || row.place.lat));
  // Every row at the same place ("On the road" ×25) is said once, above the table.
  const placeNames = new Set(items.map((row) => row?.place?.name ?? null));
  const samePlace = items.length > 1 && placeNames.size === 1 ? [...placeNames][0] : null;
  // An idle's "how much" is its minutes: a second minutes column would repeat it.
  const valueIsDuration = items.length > 0 && items.every((row) => row?.unit === 'min');
  const anyDuration =
    activeKind !== 'fuel_unexplained' &&
    !valueIsDuration &&
    items.some((row) => Number(row?.durationMin) > 0);
  const anyTrip = items.some((row) => row?.trip?.to);
  const templated = isTemplatedText(items.map((row) => row?.text));

  const columns = [
    {
      key: 'truck',
      label: 'Truck',
      render: (row) =>
        row?.replay?.to ? (
          <Link
            to={row.replay.to}
            className="intel-row-link"
            aria-label={`${row.registrationNumber}: ${row.replay.label || 'See on map'}`}
            onClick={(event) => event.stopPropagation()}
          >
            {row?.registrationNumber ?? '—'}
          </Link>
        ) : (
          <span className="font-semibold">{row?.registrationNumber ?? '—'}</span>
        ),
    },
    anyDriver ? { key: 'driver', label: 'Driver', render: (row) => row?.driverName ?? '—' } : null,
    {
      key: 'when',
      label: activeKind === 'fuel_unexplained' ? 'Window' : 'When',
      sortKey: 'startAt',
      sortable: Boolean(data?.sortBy),
      render: (row) => <span className="tabular-nums">{whenText(row?.startAt, row?.endAt)}</span>,
    },
    anyDuration
      ? {
          key: 'duration',
          label: 'Lasted',
          align: 'right',
          render: (row) => (row?.durationMin == null ? '—' : formatDuration(row.durationMin)),
        }
      : null,
    anyPlace && !samePlace
      ? { key: 'where', label: 'Where', render: (row) => <PlaceName place={row?.place} /> }
      : null,
    {
      key: 'howMuch',
      label: VALUE_LABELS[activeKind] ?? 'How much',
      align: 'right',
      render: (row) => (
        <span className="font-semibold tabular-nums" title={templated ? row?.text : undefined}>
          {valueText(row)}
        </span>
      ),
    },
    templated
      ? null
      : {
          key: 'what',
          label: 'What happened',
          render: (row) => (
            <span className="intel-cell-wrap">
              {(row?.unit === 'min' ? withRoundedMinutes(row?.text, rowMinutes(row)) : row?.text) ??
                '—'}
            </span>
          ),
        },
    anyTrip
      ? {
          key: 'trip',
          label: 'Trip',
          align: 'center',
          width: 64,
          render: (row) =>
            row?.trip?.to ? (
              <Link
                to={row.trip.to}
                className="intel-icon-link"
                aria-label={`${row.registrationNumber}: ${row.trip.label || 'Open the trip'}`}
                title={row.trip.label || 'Open the trip'}
                onClick={(event) => event.stopPropagation()}
              >
                <Route size={15} aria-hidden="true" />
              </Link>
            ) : (
              '—'
            ),
        }
      : null,
  ].filter(Boolean);

  const displayedItems = useMemo(() => {
    if (!filterText.trim()) return items;
    const q = filterText.trim().toLowerCase();
    return items.filter(
      (row) =>
        row?.registrationNumber?.toLowerCase().includes(q) ||
        row?.driverName?.toLowerCase().includes(q) ||
        row?.text?.toLowerCase().includes(q) ||
        row?.place?.name?.toLowerCase().includes(q),
    );
  }, [items, filterText]);

  const caveat = CAVEATS[activeKind] ?? null;

  return (
    <div className="flex flex-col gap-4">
      {kind === 'cruise' ? (
        <IntelligenceViewSwitcher role="group" label="Cruise and gears">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              aria-pressed={activeKind === tab.id}
              onClick={() => {
                setSubKind(tab.id);
                setPage(1);
              }}
              className="intel-segment"
            >
              {tab.label}
            </button>
          ))}
        </IntelligenceViewSwitcher>
      ) : null}

      <IntelligenceDataState
        loading={loading}
        loadingVariant="table"
        error={error}
        held={held}
        what="This list of moments"
        onRetry={refetch}
      >
        <div className="intel-summary" aria-label="What the system saw">
          <div className="intel-summary-stat">
            <b>{count.value}</b>
            <span>
              {count.label === 'in this period'
                ? `${summary?.count === 1 ? one : many} in this period`
                : count.label}
            </span>
          </div>
          {summary?.totalMin !== null && summary?.totalMin !== undefined ? (
            <div className="intel-summary-stat">
              <b>{formatDuration(summary.totalMin)}</b>
              <span>in total</span>
            </div>
          ) : null}
          {/* Fuel windows overlap (each loss sits in ~8 rolling windows), so their sum is
              not a loss total: show no total rather than a number ~8x too big. */}
          {activeKind !== 'fuel_unexplained' &&
          summary?.totalL !== null &&
          summary?.totalL !== undefined ? (
            <div className="intel-summary-stat">
              <b>{formatLitres(summary.totalL)}</b>
              <span>across all rows</span>
            </div>
          ) : null}
          {summary?.totalInr !== null && summary?.totalInr !== undefined ? (
            <div className="intel-summary-stat">
              <b>{formatInr(summary.totalInr)}</b>
              <span>estimated cost</span>
            </div>
          ) : null}
          {summary?.why?.text || caveat ? (
            <p className="intel-summary-note">
              {humanizeDates(summary?.why?.text)}
              {caveat ? ` ${caveat}` : ''}
              {summary?.why?.basis ? <small>{humanizeDates(summary.why.basis)}</small> : null}
            </p>
          ) : null}
        </div>

        <DataTable
          className="mt-4"
          columns={columns}
          rows={displayedItems}
          rowKey={(row) => row?.id ?? row?.startAt}
          onRowClick={(row) => goTo(row?.replay)}
          showing={displayedItems.length}
          total={total}
          activeFilters={filterText.trim() ? 1 : 0}
          toolbarExtra={
            <div className="intel-tab-tools">
              {items.length > 0 ? (
                <div className="intel-search-box">
                  <Search size={14} aria-hidden="true" className="intel-search-icon" />
                  <input
                    type="search"
                    aria-label="Filter moments"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter by plate, driver or place"
                    className="intel-search-input"
                  />
                </div>
              ) : null}
              {items.length ? (
                <span className="intelligence-scope-note-inline">
                  {samePlace ? `Where: ${samePlace} (every row) · ` : ''}Click a row to open on map
                </span>
              ) : null}
            </div>
          }
          pagination={
            totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                  className="intel-pager"
                >
                  <ChevronLeft size={14} aria-hidden="true" />
                  Previous
                </button>
                <span className="text-[12px] text-[var(--rd-ink-3)] tabular-nums">{`Page ${page} of ${formatNumber(totalPages)}`}</span>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                  className="intel-pager"
                >
                  Next
                  <ChevronRight size={14} aria-hidden="true" />
                </button>
              </div>
            ) : null
          }
          emptyTitle={INSTANCE_EMPTY_COPY[activeKind] ?? 'Nothing of this kind in this period.'}
        />
      </IntelligenceDataState>
    </div>
  );
}
