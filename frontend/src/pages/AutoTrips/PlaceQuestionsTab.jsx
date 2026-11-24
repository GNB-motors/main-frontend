import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { getUserRole } from '../../utils/session';
import { placeAnswerMessage } from '../../utils/placeQuestions';
import NotYetAvailable from '../../components/redesign/NotYetAvailable';
import PlaceQuestionCard from './PlaceQuestionCard';
import BulkPlaceConfirmDialog from './BulkPlaceConfirmDialog';
import PlaceReviewMap from './PlaceReviewMap';
import { placeCategoryLabel, suggestedPlaceAnswer } from './placeQuestionCategories';
import { ArrowLeft, Check, MapPin } from 'lucide-react';
import { formatNum } from '../../utils/formatters';
import './PlaceQuestions.css';

/**
 * PlaceQuestionsTab — the queue of places waiting to be named.
 *
 * Answering one names the place and fixes every trip that stopped there,
 * so the card says how many trips are waiting. Only an owner or a manager
 * may answer; everybody else sees the queue read-only.
 */
export default function PlaceQuestionsTab({ query = null, canAnswer: allowed, onAnswered }) {
  const [busyId, setBusyId] = useState(null);
  const [answered, setAnswered] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [showList, setShowList] = useState(false);
  const [selected, setSelected] = useState([]);
  const [review, setReview] = useState(null);
  const [progress, setProgress] = useState(null);
  const saving = useRef(false);

  // The page already fetched the queue for the banner — reuse it so the tab
  // renders instantly instead of waiting on a second identical request.
  const own = useApi((signal) => fleetViewService.getPlaceQuestions({ signal }), [], {
    enabled: !query,
  });
  const { data, loading, error, refetch } = query ?? own;

  const role = getUserRole();
  const canAnswer = allowed ?? (role === 'OWNER' || role === 'MANAGER');

  const items = Array.isArray(data?.items) ? data.items : [];
  const open = items.filter((item) => !answered.includes(item.id));

  const active = open.find((item) => item.id === activeId) ?? open[0];
  const chosen = open.filter((item) => selected.includes(item.id) && item.suggestion?.name?.trim());
  const handleAnswer = async (id, payload) => {
    if (!canAnswer || saving.current) return;
    saving.current = true;
    setBusyId(id);
    try {
      const result = await fleetViewService.answerPlaceQuestion(id, payload);
      // `tripsUpdated: 0` is a normal answer, not a failure: the place got a
      // name but its trips stay open. Say so instead of "0 trips updated".
      toast.success(placeAnswerMessage(result, payload?.answer));
      setAnswered((prev) => [...prev, id]);
      setSelected((prev) => prev.filter((value) => value !== id));
      const index = open.findIndex((item) => item.id === id);
      setActiveId((open[index + 1] ?? open.find((item) => item.id !== id))?.id ?? null);
      setShowList(false);
      refetch?.();
      onAnswered?.();
      return result;
    } catch (err) {
      const error = err?.message || 'That answer could not be saved. Please try again.';
      if (payload?.answer !== 'RENAME') toast.error(error);
      return { error };
    } finally {
      saving.current = false;
      setBusyId(null);
    }
  };

  const confirmSelected = async () => {
    if (!canAnswer || saving.current || !review?.entries.length) return;
    saving.current = true;
    const entries = review.entries;
    const completed = [];
    let tripsUpdated = 0;
    setProgress({ busy: true, done: 0, total: entries.length });
    try {
      for (const [index, entry] of entries.entries()) {
        try {
          const result = await fleetViewService.answerPlaceQuestion(entry.id, entry.payload);
          if (result?.placeId) {
            completed.push(entry.id);
            tripsUpdated += Number(result.tripsUpdated) || 0;
          }
        } catch {
          /* Failed places stay available for review and retry. */
        }
        setProgress({ busy: true, done: index + 1, total: entries.length });
      }
      setAnswered((prev) => [...prev, ...completed]);
      setSelected((prev) => prev.filter((id) => !completed.includes(id)));
      if (completed.includes(activeId)) setActiveId(null);
      const failed = entries.length - completed.length;
      const message =
        `Confirmed ${completed.length} ${completed.length === 1 ? 'place' : 'places'}; ${tripsUpdated} trips updated.` +
        (failed
          ? ` ${failed} ${failed === 1 ? 'place could' : 'places could'} not be confirmed. Review and try again.`
          : '');
      if (failed) toast.error(message);
      else toast.success(message);
      refetch?.();
      onAnswered?.();
    } finally {
      saving.current = false;
      setProgress(null);
      setReview(null);
    }
  };

  if (error?.status === 404) {
    return <NotYetAvailable what="The place questions queue" />;
  }

  if (loading && !data) {
    return (
      <div className="atx-place-questions" aria-busy="true" aria-label="Loading places to review">
        <div className="atx-place-review-intro">
          <span className="atx-skel atx-place-skeleton-title" />
        </div>
        <div className="atx-place-workspace atx-place-workspace--loading">
          <div className="atx-place-review-list">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="atx-place-review-row atx-place-skeleton-row"
                aria-hidden="true"
              >
                <span className="atx-skel atx-place-skeleton-check" />
                <div>
                  <span className="atx-skel atx-place-skeleton-name" />
                  <span className="atx-skel atx-place-skeleton-line" />
                  <span className="atx-skel atx-place-skeleton-line" />
                </div>
              </div>
            ))}
          </div>
          <div className="atx-place-review-detail" aria-hidden="true">
            <div className="atx-skel atx-place-skeleton-map" />
            <span className="atx-skel atx-place-skeleton-title" />
            <span className="atx-skel atx-place-skeleton-name" />
            <span className="atx-skel atx-place-skeleton-line" />
            <span className="atx-skel atx-place-skeleton-line" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-2">
        <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
          We could not load the place questions.
        </p>
        <button
          type="button"
          onClick={() => refetch?.()}
          className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] px-2.5 py-1 text-[12px] font-semibold text-[var(--rd-brand)]"
        >
          Try again
        </button>
      </div>
    );
  }

  if (open.length === 0) {
    return (
      <div className="atx-place-review-complete" role="status">
        <Check size={24} aria-hidden="true" />
        <h3>All places reviewed</h3>
        <p>No places are waiting in this view. Return to trips to continue.</p>
      </div>
    );
  }

  return (
    <div className="atx-place-questions" aria-busy={loading || Boolean(busyId) || progress?.busy}>
      <div className="atx-place-review-intro">
        <div>
          <h3>Identify stops, update matching trips</h3>
          <p>
            Check each stop’s location, name and type. Delivery places may update matching trips;
            fuel and rest stops leave trips open.
          </p>
        </div>
        <span>
          {formatNum(open.length)} places shown
          {data?.total > items.length ? ` of ${formatNum(data.total)} in this view` : ''}
        </span>
      </div>
      <div className={`atx-place-workspace${active && !showList ? ' has-active-place' : ''}`}>
        <div className="atx-place-review-list" aria-label="Places to review">
          {open.map((question) => {
            const name = question.suggestion?.name || 'Unnamed stop';
            return (
              <article
                key={question.id}
                className={`atx-place-review-row${active?.id === question.id ? ' is-active' : ''}`}
                aria-label={name}
              >
                {canAnswer && question.suggestion?.name?.trim() ? (
                  <input
                    type="checkbox"
                    aria-label={`Select ${name}`}
                    checked={selected.includes(question.id)}
                    disabled={Boolean(busyId) || progress?.busy}
                    onChange={(event) =>
                      setSelected((prev) =>
                        event.target.checked
                          ? [...prev, question.id]
                          : prev.filter((id) => id !== question.id),
                      )
                    }
                  />
                ) : (
                  <MapPin size={16} aria-hidden="true" />
                )}
                <button
                  type="button"
                  className="atx-place-review-open"
                  aria-label={`Review ${name}`}
                  aria-pressed={active?.id === question.id}
                  disabled={Boolean(busyId) || progress?.busy}
                  onClick={() => {
                    setActiveId(question.id);
                    setShowList(false);
                  }}
                >
                  <strong>{name}</strong>
                  <span>
                    {question.suggestion
                      ? placeCategoryLabel(question.suggestion.category)
                      : 'Needs a name'}
                  </span>
                  <span>
                    {question.tripsAffected == null ? '—' : formatNum(question.tripsAffected)} trips
                    · {question.trucks == null ? '—' : formatNum(question.trucks)} trucks
                  </span>
                </button>
              </article>
            );
          })}
        </div>
        <div className="atx-place-review-detail">
          {active ? (
            <>
              <button
                type="button"
                className="atx-place-review-back atx-inline-link"
                onClick={() => setShowList(true)}
                disabled={Boolean(busyId) || progress?.busy}
              >
                <ArrowLeft size={15} aria-hidden="true" /> All places
              </button>
              <PlaceReviewMap
                key={`map-${active.id}`}
                point={active.point}
                sampleTrips={active.sampleTrips}
              />
              <PlaceQuestionCard
                key={active.id}
                question={active}
                canAnswer={canAnswer}
                busy={busyId === active.id || progress?.busy}
                onAnswer={handleAnswer}
              />
            </>
          ) : (
            <div className="atx-place-review-empty">
              <MapPin size={28} aria-hidden="true" />
              <h3>Select a place to review</h3>
              <p>Check its location, suggested name and linked trips here.</p>
            </div>
          )}
        </div>
      </div>
      {canAnswer && chosen.length > 0 ? (
        <div className="atx-place-selection-bar" role="region" aria-label="Selected places">
          <div>
            <strong>{formatNum(chosen.length)} selected</strong>
            <span>Selected suggestions will be saved with their displayed names and types.</span>
          </div>
          <button
            type="button"
            className="atx-place-action"
            disabled={Boolean(busyId) || progress?.busy}
            onClick={() => setSelected([])}
          >
            Clear selection
          </button>
          <button
            type="button"
            className="atx-place-action atx-place-action--primary"
            disabled={Boolean(busyId) || progress?.busy}
            onClick={() =>
              setReview({
                entries: chosen.map((question) => ({
                  id: question.id,
                  tripsAffected: question.tripsAffected,
                  payload: suggestedPlaceAnswer(question),
                })),
              })
            }
          >
            Confirm {formatNum(chosen.length)} selected {chosen.length === 1 ? 'place' : 'places'}
          </button>
        </div>
      ) : null}
      <BulkPlaceConfirmDialog
        review={review}
        progress={progress}
        onOpenChange={(value) => {
          if (!value && !saving.current) setReview(null);
        }}
        onConfirm={confirmSelected}
      />
    </div>
  );
}
