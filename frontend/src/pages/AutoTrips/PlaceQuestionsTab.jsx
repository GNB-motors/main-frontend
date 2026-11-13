import { useState } from 'react';
import { toast } from 'react-toastify';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { getUserRole } from '../../utils/session';
import { placeAnswerMessage } from '../../utils/placeQuestions';
import NotYetAvailable from '../../components/redesign/NotYetAvailable';
import PlaceQuestionCard from './PlaceQuestionCard';
import { formatNum } from '../../utils/formatters';
import './PlaceQuestions.css';

/**
 * PlaceQuestionsTab — the queue of places waiting to be named.
 *
 * Answering one names the place and fixes every trip that stopped there,
 * so the card says how many trips are waiting. Only an owner or a manager
 * may answer; everybody else sees the queue read-only.
 */
export default function PlaceQuestionsTab({ query = null }) {
  const [busyId, setBusyId] = useState(null);
  const [answered, setAnswered] = useState([]);

  // The page already fetched the queue for the banner — reuse it so the tab
  // renders instantly instead of waiting on a second identical request.
  const own = useApi((signal) => fleetViewService.getPlaceQuestions({ signal }), [], {
    enabled: !query,
  });
  const { data, loading, error, refetch } = query ?? own;

  const role = getUserRole();
  const canAnswer = role === 'OWNER' || role === 'MANAGER';

  const items = Array.isArray(data?.items) ? data.items : [];
  const open = items.filter((item) => !answered.includes(item.id));

  const handleAnswer = async (id, payload) => {
    setBusyId(id);
    try {
      const result = await fleetViewService.answerPlaceQuestion(id, payload);
      // `tripsUpdated: 0` is a normal answer, not a failure: the place got a
      // name but its trips stay open. Say so instead of "0 trips updated".
      toast.success(placeAnswerMessage(result, payload?.answer));
      setAnswered((prev) => [...prev, id]);
      refetch?.();
    } catch (err) {
      toast.error(err?.message || 'That answer could not be saved. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  if (error?.status === 404) {
    return <NotYetAvailable what="The place questions queue" />;
  }

  if (loading) {
    return (
      <div
        className="flex flex-col gap-3"
        aria-busy="true"
        aria-label="Loading the place questions"
      >
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-4 shadow-[var(--rd-shadow)]"
          >
            <span className="atx-skel h-[14px] w-3/5" />
            <span className="atx-skel h-[13px] w-2/5" />
            <span className="atx-skel h-[13px] w-4/5" />
            <span className="mt-1 flex gap-2">
              <span className="atx-skel h-[26px] w-[88px]" />
              <span className="atx-skel h-[26px] w-[96px]" />
              <span className="atx-skel h-[26px] w-[64px]" />
            </span>
          </div>
        ))}
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
      <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
        No place questions are waiting in this view.
      </p>
    );
  }

  return (
    <div className="atx-place-questions">
      <div className="atx-place-questions-intro">
        <h3>Help identify these stops</h3>
        <p>
          GPS found places where trucks stopped, but the delivery location is not confirmed. Review
          the location, then confirm or correct its name and type.
        </p>
        <span>
          {formatNum(open.length)} places shown
          {data?.total > items.length ? ` of ${formatNum(data.total)} in this view` : ''}
        </span>
      </div>
      {open.map((question) => (
        <PlaceQuestionCard
          key={question.id}
          question={question}
          canAnswer={canAnswer}
          busy={busyId === question.id}
          onAnswer={handleAnswer}
        />
      ))}
    </div>
  );
}
