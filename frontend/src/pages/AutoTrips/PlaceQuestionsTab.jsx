import { useState } from 'react';
import { toast } from 'react-toastify';
import { useApi } from '../../hooks/useApi';
import { fleetViewService } from '../../services/fleetViewService';
import { getUserRole } from '../../utils/session';
import NotYetAvailable from '../../components/redesign/NotYetAvailable';
import PlaceQuestionCard from './PlaceQuestionCard';

/**
 * PlaceQuestionsTab — the queue of places waiting to be named.
 *
 * Answering one names the place and fixes every trip that stopped there,
 * so the card says how many trips are waiting. Only an owner or a manager
 * may answer; everybody else sees the queue read-only.
 */
export default function PlaceQuestionsTab() {
  const [busyId, setBusyId] = useState(null);
  const [answered, setAnswered] = useState([]);

  const { data, loading, error, refetch } = useApi(
    (signal) => fleetViewService.getPlaceQuestions({ signal }),
    [],
  );

  const role = getUserRole();
  const canAnswer = role === 'OWNER' || role === 'MANAGER';

  const items = Array.isArray(data?.items) ? data.items : [];
  const open = items.filter((item) => !answered.includes(item.id));

  const handleAnswer = async (id, payload) => {
    setBusyId(id);
    try {
      const result = await fleetViewService.answerPlaceQuestion(id, payload);
      const updated = result?.tripsUpdated ?? null;
      toast.success(
        updated !== null
          ? `Done: ${updated} trips updated`
          : 'Done. We will name this place from now on.',
      );
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
    return <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">Loading the questions…</p>;
  }

  if (error) {
    return (
      <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
        We could not load the place questions.
      </p>
    );
  }

  if (open.length === 0) {
    return (
      <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
        Nothing is waiting for an answer. Every place your trucks stop at has a name.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
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
