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
import { bucketReportCards, reportCardMakes } from './intelligenceModel';

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
  const columns = [
    {
      key: 'name',
      label: subject === 'driver' ? 'Driver' : 'Truck',
      render: (card) => (
        <button type="button" className="intelligence-table-open" onClick={() => setOpenCard(card)}>
          {card.name}
          {card.make ? (
            <small>
              {card.make} {card.model || ''}
            </small>
          ) : null}
        </button>
      ),
    },
    {
      key: 'grade',
      label: 'Assessment',
      render: (card) => (
        <ToneBadge
          tone={card.grade === 'EXCELLENT' ? 'good' : card.grade === 'FALLING' ? 'watch' : 'info'}
        >
          {gradeLabel(card)}
        </ToneBadge>
      ),
    },
    {
      key: 'score',
      label: 'Score',
      render: (card) => (card.score == null ? 'Not graded' : `${formatNumber(card.score)}/100`),
    },
    {
      key: 'trend',
      label: 'Trend',
      render: (card) =>
        card.trend === 'UP'
          ? 'Improving ↑'
          : card.trend === 'DOWN'
            ? 'Declining ↓'
            : card.trend === 'FLAT'
              ? 'Steady'
              : 'No comparison',
    },
    {
      key: 'distance',
      label: 'Distance',
      render: (card) =>
        card.kmInPeriod == null ? 'Not measured' : `${formatNumber(card.kmInPeriod)} km`,
    },
    {
      key: 'finding',
      label: 'Key finding',
      render: (card) => (
        <span>
          {card.headline || 'No assessment available'}
          {card.basis?.basis ? (
            <small className="intelligence-table-basis">{card.basis.basis}</small>
          ) : null}
        </span>
      ),
    },
    {
      key: 'open',
      label: 'Details',
      render: (card) => (
        <button
          className="intelligence-table-open"
          type="button"
          aria-label={`Open the full card for ${card.name}`}
          onClick={() => setOpenCard(card)}
        >
          View details →
        </button>
      ),
    },
  ];

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

        <Select
          value={grade}
          onValueChange={(value) => {
            setGrade(value ?? 'all');
            setPage(1);
          }}
        >
          <SelectTrigger aria-label="Filter by grade" size="sm">
            <SelectValue>{GRADES.find((entry) => entry.id === grade)?.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {GRADES.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <div className="intelligence-grade-counts" role="group" aria-label="Assessment groups">
            {gradeBuckets.map((bucket) => (
              <button
                key={bucket.id}
                type="button"
                aria-pressed={bucket.grades.includes(grade)}
                onClick={() => {
                  setGrade(grade === bucket.grades[0] ? 'all' : bucket.grades[0]);
                  setPage(1);
                }}
              >
                {bucket.label} ({bucket.cards.length})
              </button>
            ))}
          </div>
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
            showing={Math.min(25, rows.length - (currentPage - 1) * 25)}
            total={total}
            paginated={totalPages > 1}
          />
          {totalPages > 1 ? (
            <EnterprisePagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={rows.length}
              pageSize={25}
              onPageChange={setPage}
            />
          ) : null}
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
