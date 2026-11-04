import { useState } from 'react';
import Link from '@/components/redesign/FleetLink';
import { useApi } from '@/hooks/useApi';
import { formatDuration, formatNumber, formatProbability } from '@/utils/redesign/format';
import { useGoToLink } from '@/utils/redesign/links';
import IntelCard from './IntelCard';
import IntelligenceDataState from './IntelligenceDataState';
import IntelligenceService from './IntelligenceService';
import { placeCategoryLabel, summarisePlacesByPlace } from './intelligenceModel';

const QUESTIONS_PATH = '/auto-trips?tab=questions';
const TOP_QUESTIONS = 6;
const TOP_PLACES = 12;

const coords = (point) =>
  Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
    ? `${Number(point.lat).toFixed(3)}, ${Number(point.lng).toFixed(3)}`
    : null;

/** A place's name, with what kind of place it is or where it is. */
function PlaceCell({ name, category = null, point = null, extra = null }) {
  const kind = placeCategoryLabel(category);
  const second = [kind, kind ? null : coords(point), extra].filter(Boolean).join(' · ');
  return (
    <span className="intel-place">
      <span className="intel-place-name">{name}</span>
      {second ? <span className="intel-place-meta">{second}</span> : null}
    </span>
  );
}

/**
 * PlacesTab — the places waiting for a name, and the places the fleet uses
 * most, side by side.
 *
 * A question is only worth asking when the trips behind it can be looked
 * at: a row opens the first trip that stopped there, and the full list,
 * where the owner answers, is one click away.
 */
export default function PlacesTab({ from, to }) {
  const [allPlaces, setAllPlaces] = useState(false);
  const goTo = useGoToLink();

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
  } = useApi(
    (signal) => IntelligenceService.getTripsHistory({ from, to, limit: 200, signal }),
    [from, to],
  );

  const questionItems = questions?.items ?? [];
  const questionTotal = questions?.total ?? questionItems.length;
  const places = summarisePlacesByPlace(history?.countsByPlace ?? [], history?.items ?? []);
  const shownPlaces = allPlaces ? places : places.slice(0, TOP_PLACES);

  return (
    <div className="intel-places-grid">
      <IntelCard
        title="Places waiting for your answer"
        count={questionTotal}
        flush
        info={{
          text: 'A place the system could not name. Answering with the right name makes every later trip, report and search better.',
        }}
        action={
          questionItems.length ? (
            <Link to={QUESTIONS_PATH} className="intel-link">
              {`See all ${formatNumber(questionTotal)} and answer`}
            </Link>
          ) : null
        }
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
          <div className="intel-table-wrap intel-table-wrap--flush">
            <table className="intel-table">
              <thead>
                <tr>
                  <th scope="col">Place</th>
                  <th scope="col">What trucks do there</th>
                  <th scope="col" className="intel-num">
                    Trucks
                  </th>
                  <th scope="col" className="intel-num">
                    Trips
                  </th>
                </tr>
              </thead>
              <tbody>
                {questionItems.slice(0, TOP_QUESTIONS).map((question) => {
                  const suggestion = question?.suggestion ?? null;
                  const firstTrip = (question?.sampleTrips ?? []).find((trip) => trip?.to);
                  const alternatives = (question?.alternatives ?? [])
                    .map((alt) => alt?.name)
                    .filter(Boolean);
                  const extra = [
                    suggestion?.source ? `from ${suggestion.source}` : null,
                    formatProbability(suggestion?.confidence),
                    alternatives.length ? `also ${alternatives.join(', ')}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  return (
                    <tr
                      key={question.id}
                      className={firstTrip ? 'intel-row' : undefined}
                      onClick={firstTrip ? () => goTo(firstTrip) : undefined}
                    >
                      <td>
                        {firstTrip ? (
                          <Link
                            to={firstTrip.to}
                            className="intel-row-link"
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`${suggestion?.name ?? 'Unnamed point'}: ${firstTrip.label}`}
                          >
                            <PlaceCell
                              name={suggestion?.name ?? 'Unnamed point'}
                              category={suggestion?.category}
                              point={question?.point}
                              extra={extra}
                            />
                          </Link>
                        ) : (
                          <PlaceCell
                            name={suggestion?.name ?? 'Unnamed point'}
                            category={suggestion?.category}
                            point={question?.point}
                            extra={extra}
                          />
                        )}
                      </td>
                      <td>
                        <span className="intel-cell-wrap">
                          {question?.why?.text ?? '—'}
                          {/* "8 trips · 7 trucks" only repeats the two columns. */}
                          {question?.why?.basis &&
                          !/^\d+ trips?\s*·\s*\d+ trucks?$/.test(question.why.basis) ? (
                            <small className="intelligence-table-basis">{question.why.basis}</small>
                          ) : null}
                        </span>
                      </td>
                      <td className="intel-num">{formatNumber(question?.trucks)}</td>
                      <td className="intel-num">{formatNumber(question?.tripsAffected)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </IntelligenceDataState>
      </IntelCard>

      <IntelCard
        title="Busiest places"
        count={places.length || null}
        flush
        info={{
          text: 'The places the fleet visited most in this period, with how many trucks came and how long they usually stay. Trucks and usual time are worked out from the visits loaded, so they are only as complete as that page of history.',
        }}
      >
        <IntelligenceDataState
          loading={historyLoading}
          loadingVariant="table"
          error={historyError}
          isEmpty={places.length === 0}
          emptyMessage="No visits were recorded in this period."
          what="The visits of this period"
          onRetry={refetchHistory}
        >
          <div className="intel-table-wrap intel-table-wrap--flush">
            <table className="intel-table">
              <thead>
                <tr>
                  <th scope="col">Place</th>
                  <th scope="col" className="intel-num">
                    Visits
                  </th>
                  <th scope="col" className="intel-num">
                    Trucks
                  </th>
                  <th scope="col" className="intel-num">
                    Usual time there
                  </th>
                </tr>
              </thead>
              <tbody>
                {shownPlaces.map((row) => (
                  <tr key={row?.place?.id ?? row?.place?.name}>
                    <td>
                      <PlaceCell
                        name={row?.place?.name ?? 'Location not known'}
                        category={row?.place?.category}
                        point={row?.place}
                      />
                    </td>
                    <td className="intel-num">{formatNumber(row?.visits)}</td>
                    <td className="intel-num">
                      {row?.trucks === null || row?.trucks === undefined
                        ? '—'
                        : formatNumber(row.trucks)}
                    </td>
                    <td className="intel-num">
                      {row?.usualMin === null || row?.usualMin === undefined
                        ? '—'
                        : formatDuration(row.usualMin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {places.length > TOP_PLACES ? (
            <button type="button" className="intel-show-all" onClick={() => setAllPlaces((v) => !v)}>
              {allPlaces ? 'Show the top 12' : `Show all ${places.length} places`}
            </button>
          ) : null}
        </IntelligenceDataState>
      </IntelCard>
    </div>
  );
}
