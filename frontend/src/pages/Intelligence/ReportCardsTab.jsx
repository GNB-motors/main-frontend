import { useState } from 'react';
import { Search } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import EnterprisePagination from '@/components/ui/EnterprisePagination';
import ToneBadge from '@/components/redesign/ToneBadge';
import { formatNumber } from '@/utils/redesign/format';
import { useApi } from '@/hooks/useApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import IntelligenceDataState from './IntelligenceDataState';
import ReportCardDrawer from './ReportCardDrawer';
import IntelligenceService from './IntelligenceService';
import { bucketReportCards, humanizeDates, reportCardMakes } from './intelligenceModel';

const GRADES = [
  { id: 'all', label: 'All grades' },
  { id: 'EXCELLENT', label: 'Excellent' },
  { id: 'GOOD', label: 'Good' },
  { id: 'FAIR', label: 'Fair' },
  { id: 'FALLING', label: 'Falling off' },
  { id: 'NOT_ENOUGH_DATA', label: 'Insufficient data' },
];

/**
 * ReportCardsTab — who is doing well and who is slipping.
 *
 * Assessments remain visible in one searchable table, including ungraded records.
 * Each row opens the existing explanation drawer.
 */
export default function ReportCardsTab({
  subject = 'vehicle',
  from,
  to,
  vehicle = '',
  driver = '',
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [grade, setGrade] = useState('all');
  const [make, setMake] = useState('all');
  const [openCard, setOpenCard] = useState(null);

  const { data, loading, error, refetch } = useApi(
    (signal) => IntelligenceService.getReportCards({ subject, from, to, signal }),
    [subject, from, to],
    { scopeKey: `${subject}:${from}:${to}` },
  );

  const held = data?.held ? data.why : null;
  const cards = (data?.items ?? [])
    .filter(
      (card) =>
        card?.subject === subject &&
        (subject === 'vehicle'
          ? !vehicle ||
            card.id.replace(/\s/g, '').toUpperCase() === vehicle.replace(/\s/g, '').toUpperCase()
          : !driver || card.id === driver),
    )
    .map((card) =>
      subject === 'driver' &&
      card.score == null &&
      !card.strengths?.length &&
      !card.problems?.length
        ? { ...card, grade: 'NOT_ENOUGH_DATA' }
        : card,
    );
  const makes = reportCardMakes(cards);
  const { buckets, total } = bucketReportCards(cards, { query, grade, make });
  const { buckets: gradeBuckets } = bucketReportCards(cards, { query, make });
  const rows = buckets.flatMap((bucket) => bucket.cards);
  const totalPages = Math.max(1, Math.ceil(rows.length / 25));
  const currentPage = Math.min(page, totalPages);
  const gradeLabel = (card) =>
    GRADES.find((entry) => entry.id === card.grade)?.label || 'Insufficient data';
  // A column that says the same thing on every row says it once instead:
  // no "Not graded" ×118, no "No comparison" ×126, no repeated basis line.
  const allNoScore = cards.length > 0 && cards.every((card) => card.score == null);
  const allNoTrend = cards.length > 0 && cards.every((card) => card.trend == null);
  const oneGrade = cards.length > 0 && new Set(cards.map((card) => card.grade)).size === 1;
  const bases = new Set(cards.map((card) => card.basis?.basis ?? ''));
  const sharedBasis = cards.length > 1 && bases.size === 1 ? [...bases][0] : null;
  const columns = [
    {
      key: 'name',
      label: subject === 'driver' ? 'Driver' : 'Truck',
      render: (card) => (
        <button
          type="button"
          className="intelligence-table-open"
          aria-label={`Open the full card for ${card.name}`}
          onClick={(event) => {
            event.stopPropagation();
            setOpenCard(card);
          }}
        >
          {card.name}
          {card.make ? (
            <small>
              {card.make} {card.model || ''}
            </small>
          ) : null}
        </button>
      ),
    },
    oneGrade
      ? null
      : {
          key: 'grade',
          label: 'Assessment',
          render: (card) => (
            <ToneBadge
              tone={
                card.grade === 'EXCELLENT' ? 'good' : card.grade === 'FALLING' ? 'watch' : 'info'
              }
            >
              {gradeLabel(card)}
            </ToneBadge>
          ),
        },
    allNoScore
      ? null
      : {
          key: 'score',
          label: 'Score',
          align: 'right',
          render: (card) =>
            card.score == null ? (
              <span className="text-[var(--rd-ink-3)]">—</span>
            ) : (
              <span className="intel-score">
                <span className="intel-score-bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(0, Math.min(100, card.score))}%` }} />
                </span>
                {formatNumber(card.score)}
              </span>
            ),
        },
    allNoTrend
      ? null
      : {
          key: 'trend',
          label: 'Trend',
          render: (card) =>
            card.trend === 'UP'
              ? 'Improving ↑'
              : card.trend === 'DOWN'
                ? 'Declining ↓'
                : card.trend === 'FLAT'
                  ? 'Steady'
                  : '—',
        },
    {
      key: 'distance',
      label: 'Distance',
      align: 'right',
      render: (card) =>
        card.kmInPeriod == null ? (
          <span className="text-[var(--rd-ink-3)]">Not measured</span>
        ) : (
          `${formatNumber(card.kmInPeriod)} km`
        ),
    },
    {
      key: 'finding',
      label: 'Key finding',
      render: (card) => (
        <span className="intel-cell-wrap">
          {humanizeDates(card.headline) || 'No assessment available'}
          {!sharedBasis && card.basis?.basis ? (
            <small className="intelligence-table-basis">{humanizeDates(card.basis.basis)}</small>
          ) : null}
        </span>
      ),
    },
  ].filter(Boolean);

  const title = subject === 'driver' ? 'Drivers' : 'Trucks';
  const what = subject === 'driver' ? 'The driver card' : 'The truck card';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex items-center">
          <Search
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 text-[var(--rd-ink-3)]"
          />
          <input
            id="intelligence-card-search"
            type="search"
            aria-label={`Search ${title.toLowerCase()}`}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={subject === 'driver' ? 'Search a driver' : 'Search a plate'}
            className="w-[200px] rounded-[var(--rd-radius-xs)] border border-[var(--rd-line)] bg-[var(--rd-card)] py-1.5 pr-2 pl-8 text-[13px] text-[var(--rd-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
          />
        </div>

        {makes.length > 0 ? (
          <Select
            value={make}
            onValueChange={(value) => {
              setMake(value ?? 'all');
              setPage(1);
            }}
          >
            <SelectTrigger aria-label="Filter by make" size="sm">
              <SelectValue>{make === 'all' ? 'All makes' : make}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All makes</SelectItem>
              {makes.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}


        {cards.length ? (
          <div className="intel-chip-row" role="group" aria-label="Assessment groups">
            <button
              type="button"
              className="intel-chip"
              aria-pressed={grade === 'all'}
              onClick={() => {
                setGrade('all');
                setPage(1);
              }}
            >
              All
              <span className="tabular-nums">
                {gradeBuckets.reduce((sum, bucket) => sum + bucket.cards.length, 0)}
              </span>
            </button>
            {gradeBuckets.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                className="intel-chip"
                aria-pressed={bucket.grades.includes(grade)}
                onClick={() => {
                  setGrade(grade === bucket.grades[0] ? 'all' : bucket.grades[0]);
                  setPage(1);
                }}
              >
                {bucket.label}
                <span className="tabular-nums">{bucket.cards.length}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <IntelligenceDataState
        loading={loading}
        loadingVariant="table"
        error={error}
        held={held}
        isEmpty={total === 0}
        emptyMessage={
          subject === 'driver'
            ? 'No driver cards for this period yet.'
            : 'No truck cards for this period yet.'
        }
        what={what}
        onRetry={refetch}
      >
        <>
          {subject === 'driver' ? (
            <p className="intelligence-scope-note">
              Assignment coverage is shown when a performance score is unavailable. An ungraded
              driver is not classified as a good or bad performer.
            </p>
          ) : null}
          <DataTable
            columns={columns}
            rows={rows.slice((currentPage - 1) * 25, currentPage * 25)}
            rowKey={(card) => card.id}
            onRowClick={(card) => setOpenCard(card)}
            showing={Math.min(25, rows.length - (currentPage - 1) * 25)}
            total={total}
            toolbarExtra={
              sharedBasis ? (
                <span className="intelligence-scope-note">{`Based on ${humanizeDates(sharedBasis).replace(/^([A-Z])(?=[a-z])/, (c) => c.toLowerCase())}`}</span>
              ) : null
            }
            pagination={
              totalPages > 1 ? (
                <EnterprisePagination
                  page={currentPage}
                  totalPages={totalPages}
                  totalItems={rows.length}
                  pageSize={25}
                  onPageChange={setPage}
                />
              ) : null
            }
          />
        </>
      </IntelligenceDataState>

      <ReportCardDrawer
        card={openCard}
        open={Boolean(openCard)}
        onOpenChange={(next) => {
          if (!next) setOpenCard(null);
        }}
      />
    </div>
  );
}
