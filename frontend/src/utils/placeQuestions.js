/**
 * The place questions queue — what each question is, and what an answer means.
 *
 * The new backend sends three optional fields on every question: `kind` (what
 * sort of question it is), `kmAtStake` (the whole kilometres that depend on
 * the answer) and `suspicious` (how many trips at this point look unusual).
 * All three are optional: the old backend sends none of them, and the card
 * then reads exactly as it did before.
 *
 * The queue is ranked by the server, by the kilometres at stake. The frontend
 * never re-sorts it — the server's order is the order it wants read.
 *
 * This module lives in `utils/` because two different pages read the same
 * queue: the place questions card on Trips and the places table on
 * Intelligence. Both must say the same thing about the same question.
 */

/** What each kind of question is asking, in the owner's words. */
export const QUESTION_KIND_TEXT = {
  INFERRED_DROP: 'Trucks turned round here. Is this a drop?',
  UNKNOWN_DROP: 'Trucks stopped here and we do not know where they dropped. Is this a drop?',
  LONG_STOP: 'Trucks stop here for a long time. Is this a delivery point?',
};

/**
 * The whole kilometres that depend on this answer, or null when the server did
 * not say. A number is always whole kilometres — the server rounds it.
 */
export function questionKmAtStake(question) {
  const km = question?.kmAtStake;
  if (km === null || km === undefined || km === '') return null;
  const n = Number(km);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

/**
 * "1,240 km depend on this answer" — null when the server did not say, so the
 * line is simply absent on the old backend.
 */
export function kmAtStakeText(question) {
  const km = questionKmAtStake(question);
  if (km === null) return null;
  return `${km.toLocaleString('en-IN')} km depend on this answer`;
}

/**
 * How many trips at this point look unusual, or null when the server did not
 * say. It is a count of trips to look at — never an accusation.
 */
export function questionSuspicious(question) {
  const n = Number(question?.suspicious);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/**
 * The line that opens the card: what this question is about. When the server
 * says what kind of question it is, that question is asked; otherwise the card
 * keeps its older wording about trips waiting on the answer.
 */
export function questionHeadline(question) {
  const kind = QUESTION_KIND_TEXT[question?.kind];
  if (kind) return kind;
  return null;
}

/**
 * True when the answer named the place but left the trips open.
 *
 * A place that is not a delivery point — a dhaba, a yard — gets a name, but
 * the trips that stopped there are still waiting for their real drop. The
 * server then reports `tripsUpdated: 0` together with the place it labelled.
 * That is a normal result, not a failure, and the user must not be told the
 * trip is done.
 */
export function placeTripsStayOpen(result) {
  return Number(result?.tripsUpdated) === 0;
}

/**
 * What to say after an answer was saved.
 *
 * - `SKIP` / `NOT_A_PLACE` — the point was dismissed on purpose; its trips
 *   were never going to be closed here.
 * - `tripsUpdated: 0` — the place is named, the trips stay open.
 * - `tripsUpdated: n` — n trips were closed.
 * - no `tripsUpdated` at all — the old backend, which sends nothing to count.
 */
export function placeAnswerMessage(result, answer) {
  if (answer === 'SKIP') return 'Skipped for now. No place or trip was changed.';
  if (answer === 'NOT_A_PLACE') return 'Noted. We will not ask you about this point again.';
  const updated = result?.tripsUpdated;
  if (updated === null || updated === undefined) {
    return 'Done. We will name this place from now on.';
  }
  if (Number(updated) === 0) {
    return 'Saved. These trips stay open until their drop is found.';
  }
  return `Done: ${updated} trips updated`;
}
