import { useState } from 'react';
import Link from '@/components/redesign/FleetLink';
import { useApi } from '@/hooks/useApi';
import { formatDuration, formatNumber, formatProbability } from '@/utils/redesign/format';
import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import IntelligenceDataState from './IntelligenceDataState';
import IntelligenceService from './IntelligenceService';
import { placeCategoryLabel, summarisePlacesByPlace } from './intelligenceModel';
import '../Vehicle360/panels/overview/referenceOverview.css';
import './runsPlacesReference.css';

const QUESTIONS_PATH = '/auto-trips?tab=questions';
const coords = (point) =>
  point?.lat != null &&
  point?.lng != null &&
  Number.isFinite(Number(point.lat)) &&
  Number.isFinite(Number(point.lng))
    ? `${Number(point.lat).toFixed(3)}, ${Number(point.lng).toFixed(3)}`
    : null;

function QuestionAnswer({ question }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(question.suggestion?.name || '');
  const [category, setCategory] = useState(question.suggestion?.category || '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const save = async (answer) => {
    setBusy(true);
    setError('');
    try {
      const result = await IntelligenceService.answerPlaceQuestion(question.id, {
        answer,
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(category ? { category } : {}),
      });
      if (!result?.placeId)
        throw new Error(
          'The place was not saved. Review the place evidence or open the questions page.',
        );
      setSaved(true);
      setEditing(false);
    } catch (err) {
      setError(err?.displayMessage || err?.message || 'Could not save the answer.');
    } finally {
      setBusy(false);
    }
  };
  if (saved)
    return (
      <span className="intel-place-saved" role="status">
        ✓ Saved as {name || 'confirmed place'}
      </span>
    );
  return (
    <div className="intel-place-guess">
      {editing ? (
        <div className="intel-place-answer-form">
          <input
            aria-label={`Place name for ${question.id}`}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Place name"
          />
          <SearchableSelect
            value={category}
            onValueChange={setCategory}
            aria-label={`Category for ${question.id}`}
          >
            <option value="">Select category</option>
            {['PLANT', 'CUSTOMER', 'PARKING', 'FUEL_PUMP', 'WORKSHOP'].map((value) => (
              <option key={value} value={value}>
                {placeCategoryLabel(value)}
              </option>
            ))}
          </SearchableSelect>
          <div>
            <button
              className="intel-place-action intel-place-action--primary"
              disabled={busy || !name.trim()}
              onClick={() => save('RENAME')}
            >
              {busy ? 'Saving…' : 'Save answer'}
            </button>{' '}
            <button
              className="intel-place-action"
              disabled={busy}
              onClick={() => setEditing(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="intel-place-guess-label">
            {question.suggestion?.name || 'No suggestion'}
            {question.suggestion?.confidence != null
              ? ` · ${formatProbability(question.suggestion.confidence)}`
              : ''}
          </span>
          <button
            className="intel-place-action intel-place-action--primary"
            disabled={busy || !question.suggestion?.name}
            onClick={() => save('CONFIRM')}
          >
            {busy ? 'Saving…' : 'Confirm'}
          </button>
          <button className="intel-place-action" disabled={busy} onClick={() => setEditing(true)}>
            Something else
          </button>
        </>
      )}
      {error ? <small role="alert">{error}</small> : null}
    </div>
  );
}

export default function PlacesTab({ from, to }) {
  const [type, setType] = useState('all');
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
  const questionItems = questions?.items || [];
  const questionTotal = questions?.total ?? questionItems.length;
  const places = summarisePlacesByPlace(history?.countsByPlace || [], history?.items || []);
  const types = [...new Set(places.map((row) => row.place?.category || 'UNKNOWN'))];
  const shown = places.filter(
    (row) => type === 'all' || (row.place?.category || 'UNKNOWN') === type,
  );
  const maxTime = Math.max(1, ...places.map((row) => row.usualMin || 0));
  return (
    <div className="intel-places-reference">
      <section className="intel-place-card intel-place-card--questions">
        <header>
          <div className="intel-place-question-heading">
            <h3 className="intel-place-eyebrow">✧ Places waiting for your answer</h3>
            <p>
              {questionsLoading
                ? 'Loading place questions…'
                : `${formatNumber(questionTotal)} places need a name or confirmation.`}
            </p>
            <small>
              Suggestions are inferred from recorded stops and place matches. Confirm after
              reviewing the trip.
            </small>
          </div>
          <Link to={QUESTIONS_PATH}>{`See all ${formatNumber(questionTotal)} and answer`}</Link>
        </header>
        <IntelligenceDataState
          loading={questionsLoading}
          error={questionsError}
          isEmpty={!questionItems.length}
          emptyMessage="No unanswered place questions returned."
          emptyTone="good"
          what="The places waiting for an answer"
          onRetry={refetchQuestions}
        >
          <div className="intel-place-table-wrap">
            <table className="intel-place-table">
              <thead>
                <tr>
                  <th>Place</th>
                  <th>What trucks do there</th>
                  <th>Our guess</th>
                  <th className="intel-num">Trucks</th>
                  <th className="intel-num">Trips</th>
                </tr>
              </thead>
              <tbody>
                {questionItems.map((question) => {
                  const firstTrip = question.sampleTrips?.find((trip) => trip.to);
                  const label = question.suggestion?.name || 'Unnamed point';
                  return (
                    <tr key={question.id}>
                      <td>
                        {firstTrip ? (
                          <Link to={firstTrip.to} aria-label={`${label}: ${firstTrip.label}`}>
                            <b>{label}</b>
                          </Link>
                        ) : (
                          <b>{label}</b>
                        )}
                        <small>{coords(question.point) || 'Coordinates unavailable'}</small>
                      </td>
                      <td>
                        {question.why?.text || 'Stop activity not described'}
                        {question.why?.basis ? <small>{question.why.basis}</small> : null}
                        {question.suggestion?.category ? (
                          <small>{placeCategoryLabel(question.suggestion.category)}</small>
                        ) : null}
                      </td>
                      <td>
                        <QuestionAnswer question={question} />
                      </td>
                      <td className="intel-num">{formatNumber(question.trucks)}</td>
                      <td className="intel-num">{formatNumber(question.tripsAffected)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </IntelligenceDataState>
      </section>
      <section className="intel-place-card">
        <header>
          <h3>
            Busiest places <small>{places.length} places returned</small>
          </h3>
          <div className="intel-place-type-filters" role="group" aria-label="Filter place type">
            <button aria-pressed={type === 'all'} onClick={() => setType('all')}>
              All {places.length}
            </button>
            {types.map((category) => (
              <button
                key={category}
                aria-pressed={type === category}
                onClick={() => setType(category)}
              >
                {placeCategoryLabel(category)}{' '}
                {places.filter((row) => (row.place?.category || 'UNKNOWN') === category).length}
              </button>
            ))}
          </div>
        </header>
        <IntelligenceDataState
          loading={historyLoading}
          loadingVariant="table"
          error={historyError}
          isEmpty={!places.length}
          emptyMessage="No visits were recorded in this period."
          what="The visits of this period"
          onRetry={refetchHistory}
        >
          <div className="intel-place-table-wrap">
            <table className="intel-place-table">
              <thead>
                <tr>
                  <th>Place</th>
                  <th className="intel-num">Visits</th>
                  <th className="intel-num">Trucks</th>
                  <th className="intel-num">Usual time there</th>
                  <th>Time per visit</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => (
                  <tr key={row.place?.id || row.place?.name}>
                    <td>
                      <b>{row.place?.name || 'Location not known'}</b>
                      <small>{placeCategoryLabel(row.place?.category)}</small>
                    </td>
                    <td className="intel-num">{formatNumber(row.visits)}</td>
                    <td className="intel-num">
                      {row.trucks == null ? '—' : formatNumber(row.trucks)}
                    </td>
                    <td className="intel-num">
                      {row.usualMin == null ? '—' : formatDuration(row.usualMin)}
                    </td>
                    <td>
                      <div
                        className="intel-place-time-track"
                        aria-label={
                          row.usualMin == null
                            ? 'Duration unavailable'
                            : `Usual visit ${formatDuration(row.usualMin)}`
                        }
                      >
                        <span
                          style={{
                            width: `${row.usualMin == null ? 0 : (row.usualMin / maxTime) * 100}%`,
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {!shown.length ? (
                  <tr>
                    <td colSpan={5}>No places match this type.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="intel-place-coverage">
            Visit counts describe the returned history. Distinct trucks and usual time are
            calculated from loaded visits; incomplete history may limit these values.
          </div>
        </IntelligenceDataState>
      </section>
    </div>
  );
}
