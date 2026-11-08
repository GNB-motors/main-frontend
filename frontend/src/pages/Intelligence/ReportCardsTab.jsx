import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import DriverCardsBriefing from './DriverCardsBriefing';
import { cardsBriefing } from './reportCardsBriefingModel';
import ReportCardsBriefing, { ScoreSparkline } from './ReportCardsBriefing';
import '../Vehicle360/panels/overview/referenceOverview.css';
import './reportCardsReference.css';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import { formatNumber } from '@/utils/redesign/format';
import { useApi } from '@/hooks/useApi';
import TripService from '@/pages/Trip/services/TripService';
import IntelligenceDataState from './IntelligenceDataState';
import ReportCardDrawer from './ReportCardDrawer';
import IntelligenceService from './IntelligenceService';
import {
  bucketReportCards,
  driverNameMap,
  humanizeDates,
  isInternalBasis,
  reportCardMakes,
  resolveDriverName,
} from './intelligenceModel';
const GRADES = [
  {
    id: 'all',
    label: 'All grades',
  },
  {
    id: 'EXCELLENT',
    label: 'Excellent',
  },
  {
    id: 'GOOD',
    label: 'Good',
  },
  {
    id: 'FAIR',
    label: 'Fair',
  },
  {
    id: 'FALLING',
    label: 'Falling off',
  },
  {
    id: 'NOT_ENOUGH_DATA',
    label: 'Insufficient data',
  },
];

/**
 * ReportCardsTab — who is doing well and who is slipping.
 *
 * Assessments remain visible in one searchable table, including ungraded records.
 * Each row opens the existing explanation drawer.
 */
export default function ReportCardsTab({
  subject = 'vehicle',
  headerControl = null,
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
    (signal) =>
      IntelligenceService.getReportCards({
        subject,
        from,
        to,
        signal,
      }),
    [subject, from, to],
    {
      scopeKey: `${subject}:${from}:${to}`,
    },
  );
  const { data: drivers, loading: driversLoading } = useApi(
    (signal) =>
      TripService.getDrivers(
        {
          limit: 200,
        },
        {
          signal,
        },
      ),
    [],
    {
      enabled: subject === 'driver',
      scopeKey: 'drivers',
    },
  );
  const driversById = useMemo(
    () =>
      driverNameMap(
        Array.isArray(drivers) ? drivers : Array.isArray(drivers?.data) ? drivers.data : [],
      ),
    [drivers],
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
        ? {
            ...card,
            grade: 'NOT_ENOUGH_DATA',
          }
        : card,
    )
    .map((card) =>
      subject === 'driver'
        ? {
            ...card,
            name: resolveDriverName(card, driversById, {
              ready: !driversLoading,
            }),
          }
        : card,
    );
  const allUngraded =
    subject === 'driver' &&
    cards.length > 0 &&
    cards.every((card) => card.grade === 'NOT_ENOUGH_DATA');
  const makes = subject === 'vehicle' ? reportCardMakes(cards) : [];
  const Briefing = subject === 'driver' ? DriverCardsBriefing : ReportCardsBriefing;
  const { buckets } = bucketReportCards(cards, {
    query,
    grade,
    make,
  });
  const { buckets: gradeBuckets } = bucketReportCards(cards, {
    query,
    make,
  });
  const rows = buckets.flatMap((bucket) => bucket.cards);
  const totalPages = Math.max(1, Math.ceil(rows.length / 25));
  const currentPage = Math.min(page, totalPages);
  const gradeLabel = (card) =>
    GRADES.find((entry) => entry.id === card.grade)?.label || 'Insufficient data';
  // A column that says the same thing on every row says it once instead:
  // no "Not graded" ×118, no "No comparison" ×126, no repeated basis line.
  const bases = new Set(cards.map((card) => card.basis?.basis ?? ''));
  const sharedBasis =
    cards.length > 1 && bases.size === 1 && !isInternalBasis([...bases][0]) ? [...bases][0] : null;
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
          {subject === 'driver' ? (
            <span className="intel-driver-identity">
              <span className="intel-driver-avatar" aria-hidden="true">
                {card.name
                  ?.split(/\s+/)
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </span>
              <span>
                {card.name}
                <small>
                  {card.assignmentCoverage?.trucks?.join(' · ') || 'Assigned truck not available'}
                </small>
              </span>
            </span>
          ) : (
            card.name
          )}
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
        <span
          className={`intel-assessment-grade intel-assessment-grade--${card.grade || 'NOT_ENOUGH_DATA'}`}
        >
          {gradeLabel(card)}
        </span>
      ),
    },
    !allUngraded
      ? {
          key: 'score',
          label: 'Score',
          align: 'right',
          render: (card) =>
            card.score == null ? (
              <span className="text-[var(--rd-ink-3)]">—</span>
            ) : (
              <span className="intel-score">
                <span className="intel-score-bar" aria-hidden="true">
                  <span
                    style={{
                      width: `${Math.max(0, Math.min(100, card.score))}%`,
                    }}
                  />
                </span>
                {formatNumber(card.score)}
              </span>
            ),
        }
      : null,
    !allUngraded
      ? {
          key: 'trend',
          label: '7-day trend',
          render: (card) => <ScoreSparkline history={card.scoreHistory} trend={card.trend} />,
        }
      : null,
    allUngraded
      ? {
          key: 'assignments',
          label: 'Assignments',
          align: 'right',
          render: (card) => card.assignmentCoverage?.assignmentCount ?? '—',
        }
      : null,
    allUngraded
      ? {
          key: 'measuredDays',
          label: 'Measured days',
          align: 'right',
          render: (card) => card.assignmentCoverage?.measuredDays ?? '—',
        }
      : null,
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
          {!sharedBasis && card.basis?.basis && !isInternalBasis(card.basis.basis) ? (
            <small className="intelligence-table-basis">{humanizeDates(card.basis.basis)}</small>
          ) : null}
        </span>
      ),
    },
  ].filter(Boolean);
  const title = subject === 'driver' ? 'Drivers' : 'Trucks';
  const what = subject === 'driver' ? 'The driver card' : 'The truck card';
  const activeFilters =
    (grade !== 'all' ? 1 : 0) + (make !== 'all' ? 1 : 0) + (query.trim() ? 1 : 0);
  const toolbar = (
    <div className="intel-tab-tools">
      {makes.length > 0 ? (
        <SearchableSelect
          value={make}
          onValueChange={(value) => {
            setMake(value ?? 'all');
            setPage(1);
          }}
          aria-label="Filter by make"
          className="intel-select-trigger"
        >
          <option value="all">All makes</option>
          {makes.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </SearchableSelect>
      ) : null}

      {makes.length > 0 && cards.length ? (
        <span className="intel-chip-sep" aria-hidden="true" />
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

      {sharedBasis ? (
        <span className="intelligence-scope-note-inline">{`Based on ${humanizeDates(sharedBasis).replace(/^([A-Z])(?=[a-z])/, (c) => c.toLowerCase())}`}</span>
      ) : null}

      <div className="intel-search-box">
        <Search size={14} aria-hidden="true" className="intel-search-icon" />
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
          className="intel-search-input"
        />
      </div>
    </div>
  );
  return (
    <div className="intel-assessments flex flex-col gap-5">
      <header className="intel-assessments-heading">
        <div>
          <h2>{title}</h2>
          <p>
            {subject === 'driver'
              ? 'Which drivers are doing well or slipping, and why.'
              : 'Which trucks are doing well or slipping, and why.'}
          </p>
        </div>
        <div className="intel-assessment-heading-right">
          {headerControl}
          <span>
            {from && to ? `Based on ${from} → ${to} · ` : ''}
            {cardsBriefing(cards).graded} of {cards.length} graded
          </span>
        </div>
      </header>
      <IntelligenceDataState
        loading={loading}
        loadingVariant="table"
        error={error}
        held={held}
        isEmpty={cards.length === 0}
        emptyMessage={
          subject === 'driver'
            ? 'No driver cards for this period yet.'
            : 'No truck cards for this period yet.'
        }
        what={what}
        onRetry={refetch}
      >
        <>
          <Briefing
            cards={cards}
            subject={subject}
            onGrade={(next) => {
              setGrade(next);
              setPage(1);
            }}
          />
          <DataTable
            className="intel-assessments-table"
            columns={columns}
            rows={rows.slice((currentPage - 1) * 25, currentPage * 25)}
            rowKey={(card) => card.id}
            onRowClick={(card) => setOpenCard(card)}
            showing={Math.min(25, rows.length - (currentPage - 1) * 25)}
            total={cards.length}
            activeFilters={activeFilters}
            toolbarExtra={toolbar}
            pagination={
              totalPages > 1 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={currentPage <= 1}
                    aria-label="Previous page"
                    className="intel-pager"
                  >
                    <ChevronLeft size={14} aria-hidden="true" />
                    Previous
                  </button>
                  <span className="text-[12px] text-[var(--rd-ink-3)] tabular-nums">{`Page ${currentPage} of ${formatNumber(totalPages)}`}</span>
                  <button
                    type="button"
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                    disabled={currentPage >= totalPages}
                    aria-label="Next page"
                    className="intel-pager"
                  >
                    Next
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                </div>
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
