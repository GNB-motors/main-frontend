import { useState } from 'react';
import { Search, Trophy, TrendingDown } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SectionCard from '@/components/redesign/SectionCard';
import IntelligenceDataState from './IntelligenceDataState';
import ReportCardTile from './ReportCardTile';
import ReportCardDrawer from './ReportCardDrawer';
import IntelligenceService from './IntelligenceService';
import { bucketReportCards, reportCardMakes } from './intelligenceModel';

const GRADES = [
  { id: 'all', label: 'All grades' },
  { id: 'EXCELLENT', label: 'Excellent' },
  { id: 'GOOD', label: 'Good' },
  { id: 'FAIR', label: 'Fair' },
  { id: 'FALLING', label: 'Falling off' },
];

/**
 * ReportCardsTab — who is doing well and who is slipping.
 *
 * The good and the bad sit side by side, so the owner reads the fleet and not
 * only its problems. Every card opens into the moments behind it.
 */
export default function ReportCardsTab({ subject = 'vehicle', from, to }) {
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('all');
  const [make, setMake] = useState('all');
  const [openCard, setOpenCard] = useState(null);

  const { data, loading, error, refetch } = useApi(
    (signal) => IntelligenceService.getReportCards({ subject, from, to, signal }),
    [subject, from, to],
  );

  const held = data?.held ? data.why : null;
  const cards = (data?.items ?? []).filter((card) => card?.subject === subject);
  const makes = reportCardMakes(cards);
  const { buckets, total } = bucketReportCards(cards, { query, grade, make });
  const shown = buckets.filter((bucket) => bucket.id !== 'fair' || bucket.cards.length > 0);

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
            onChange={(event) => setQuery(event.target.value)}
            placeholder={subject === 'driver' ? 'Search a driver' : 'Search a plate'}
            className="w-[200px] rounded-[var(--rd-radius-xs)] border border-[var(--rd-line)] bg-[var(--rd-card)] py-1.5 pr-2 pl-8 text-[13px] text-[var(--rd-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
          />
        </div>

        <Select value={make} onValueChange={(value) => setMake(value ?? 'all')}>
          <SelectTrigger aria-label="Filter by make" size="sm">
            <SelectValue placeholder="All makes" />
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

        <Select value={grade} onValueChange={(value) => setGrade(value ?? 'all')}>
          <SelectTrigger aria-label="Filter by grade" size="sm">
            <SelectValue placeholder="All grades" />
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {shown.map((bucket) => (
            <SectionCard
              key={bucket.id}
              icon={bucket.id === 'excellent' ? Trophy : bucket.id === 'falling' ? TrendingDown : Trophy}
              tone={bucket.tone}
              title={`${bucket.label} (${bucket.cards.length})`}
              info={{
                text: 'Grades compare each truck with your other trucks in the same period: km/L, idling, overspeed and driving smoothness.',
              }}
            >
              <div className="flex flex-col gap-2">
                {bucket.cards.map((card) => (
                  <ReportCardTile key={card.id} card={card} onOpen={setOpenCard} />
                ))}
                {!bucket.cards.length ? (
                  <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">Nobody in this group.</p>
                ) : null}
              </div>
            </SectionCard>
          ))}
        </div>
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
