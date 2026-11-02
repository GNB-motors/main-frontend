import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import SectionCard from '@/components/redesign/SectionCard';
import PlaceName from '@/components/redesign/PlaceName';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import IntelligenceDataState from './IntelligenceDataState';
import PlaceQuestionCard from './PlaceQuestionCard';
import IntelligenceService from './IntelligenceService';
import { formatDuration, formatNumber } from '@/utils/redesign/format';
import { summarisePlacesByPlace } from './intelligenceModel';

const QUESTIONS_PATH = '/auto-trips?tab=questions';
const TOP_QUESTIONS = 5;

/**
 * PlacesTab — the places waiting for a name, and the places the fleet uses
 * most.
 *
 * A question is only worth asking when the trips behind it can be looked at,
 * so every question links to the trips that touched that point.
 */
export default function PlacesTab({ from, to }) {
  const {
    data: questions,
    loading: questionsLoading,
    error: questionsError,
    refetch: refetchQuestions,
  } = useApi((signal) => IntelligenceService.getPlaceQuestions({ signal }), []);

  const {
    data: history,
    loading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useApi((signal) => IntelligenceService.getTripsHistory({ from, to, limit: 200, signal }), [from, to]);

  const questionItems = questions?.items ?? [];
  const questionTotal = questions?.total ?? questionItems.length;
  const places = summarisePlacesByPlace(history?.countsByPlace ?? [], history?.items ?? []);

  return (
    <div className="flex flex-col gap-3">
      <SectionCard
        icon={MapPin}
        tone="watch"
        title={`Places waiting for your answer (${questionTotal})`}
        info={{
          text: 'A place the system could not name. Answering with the right name makes every later trip, report and search better.',
        }}
      >
        <IntelligenceDataState
          loading={questionsLoading}
          error={questionsError}
          isEmpty={questionItems.length === 0}
          emptyMessage="Every place the fleet visited has a name."
          emptyTone="good"
          what="The places waiting for an answer"
          onRetry={refetchQuestions}
        >
          <div className="flex flex-col gap-3">
            {questionItems.slice(0, TOP_QUESTIONS).map((question) => (
              <PlaceQuestionCard key={question.id} question={question} />
            ))}
            <Link
              to={QUESTIONS_PATH}
              className="text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
            >
              See all →
            </Link>
          </div>
        </IntelligenceDataState>
      </SectionCard>

      <SectionCard
        icon={MapPin}
        tone="info"
        title="Busiest places"
        info={{
          text: 'The places the fleet visited most in this period, with how many trucks came and how long they usually stay.',
        }}
      >
        <IntelligenceDataState
          loading={historyLoading}
          error={historyError}
          isEmpty={places.length === 0}
          emptyMessage="No visits were recorded in this period."
          what="The visits of this period"
          onRetry={refetchHistory}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Place</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Trucks</TableHead>
                <TableHead>Usual time there</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {places.map((row) => (
                <TableRow key={row?.place?.id ?? row?.place?.name}>
                  <TableCell>
                    <PlaceName place={row?.place} showCategory />
                  </TableCell>
                  <TableCell className="tabular-nums">{formatNumber(row?.visits)}</TableCell>
                  <TableCell className="tabular-nums">
                    {row?.trucks === null || row?.trucks === undefined ? '—' : formatNumber(row.trucks)}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {row?.usualMin === null || row?.usualMin === undefined ? '—' : formatDuration(row.usualMin)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </IntelligenceDataState>
      </SectionCard>
    </div>
  );
}
