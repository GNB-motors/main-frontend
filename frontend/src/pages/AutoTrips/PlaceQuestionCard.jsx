import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import ToneBadge from '../../components/redesign/ToneBadge';
import { PLACE_CATEGORIES } from './placeQuestionCategories';
import { questionHeadline, kmAtStakeText, questionSuspicious } from '@/utils/placeQuestions';
import { toMeasured } from '@/utils/measured';

/**
 * PlaceQuestionCard — "is this one place or two?".
 *
 * The backend found a point where many trips stop, and it has a guess. The
 * card says how many trips are waiting on the answer, what the guess is and
 * where it came from, what the other options are, and why we are asking.
 *
 * Only an owner or a manager may answer. Everybody else sees the same card
 * read-only, with a line asking them to speak to their manager.
 */
export default function PlaceQuestionCard({ question, canAnswer = true, onAnswer, busy = false }) {
  const [mode, setMode] = useState(null); // null | 'rename'
  const [name, setName] = useState(question?.suggestion?.name ?? '');
  const [category, setCategory] = useState(question?.suggestion?.category ?? 'Other');

  if (!question) return null;

  const suggest = question.suggestion;
  const alternatives = Array.isArray(question.alternatives) ? question.alternatives : [];
  const samples = Array.isArray(question.sampleTrips) ? question.sampleTrips : [];
  // What the server says this question is about; absent on the old backend.
  const headline = questionHeadline(question);
  const kmAtStake = kmAtStakeText(question);
  const suspicious = questionSuspicious(question);
  // Counts the server always sends, but never print a blank where a number
  // belongs: an absent count reads as a dash, not as a zero.
  const affected = toMeasured(question.tripsAffected);
  const truckCount = toMeasured(question.trucks);
  const affectedText =
    affected === null
      ? `Trucks are waiting on this answer (${truckCount === null ? '—' : truckCount} trucks)`
      : `This point is on ${affected} trips (${truckCount === null ? '—' : truckCount} trucks)`;

  const answer = (value) => onAnswer?.(question.id, value);

  return (
    <article className="flex flex-col gap-2 rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-4 shadow-[var(--rd-shadow)]">
      <p className="m-0 flex items-center gap-2 text-[14px] font-semibold text-[var(--rd-ink)]">
        <MapPin size={16} aria-hidden="true" className="text-[var(--rd-brand-2)]" />
        {affectedText}
      </p>

      {headline ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink)]">{headline}</p>
      ) : null}

      {kmAtStake ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">{kmAtStake}</p>
      ) : null}

      {suspicious ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">
          {suspicious} {suspicious === 1 ? 'trip here looks' : 'trips here look'} unusual — worth a
          look
        </p>
      ) : null}

      {suggest ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink)]">
          We think it&apos;s: <strong>{suggest.name}</strong>{' '}
          <ToneBadge tone="info">{suggest.source}</ToneBadge>
          {canAnswer ? (
            <button
              type="button"
              onClick={() => answer({ answer: 'CONFIRM' })}
              disabled={busy}
              className="ml-2 rounded-[var(--rd-radius-sm)] bg-[var(--rd-brand)] px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-[var(--rd-brand-2)] disabled:opacity-50"
            >
              Yes, that&apos;s it
            </button>
          ) : null}
        </p>
      ) : (
        <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">
          We do not have a name for this point yet.
        </p>
      )}

      {alternatives.length ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">
          Other options: {alternatives.map((alt) => alt.name).join(' · ')}
        </p>
      ) : null}

      {canAnswer ? (
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'rename' ? (
            <>
              <input
                type="text"
                aria-label="New name for this place"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-2 py-1 text-[13px] text-[var(--rd-ink)]"
              />
              <SearchableSelect
                aria-label="Category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-2 py-1 text-[13px] text-[var(--rd-ink)]"
              >
                {PLACE_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SearchableSelect>
              <button
                type="button"
                disabled={busy || !name.trim()}
                onClick={() => answer({ answer: 'RENAME', name: name.trim(), category })}
                className="rounded-[var(--rd-radius-sm)] bg-[var(--rd-brand)] px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-[var(--rd-brand-2)] disabled:opacity-50"
              >
                Save the name
              </button>
              <button
                type="button"
                onClick={() => setMode(null)}
                className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] px-2.5 py-1 text-[12px] font-semibold text-[var(--rd-ink-2)]"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setMode('rename')}
                disabled={busy}
                className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] px-2.5 py-1 text-[12px] font-semibold text-[var(--rd-ink-2)] disabled:opacity-50"
              >
                Rename…
              </button>
              <button
                type="button"
                onClick={() => answer({ answer: 'NOT_A_PLACE' })}
                disabled={busy}
                className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] px-2.5 py-1 text-[12px] font-semibold text-[var(--rd-ink-2)] disabled:opacity-50"
              >
                Not a place
              </button>
              <button
                type="button"
                onClick={() => answer({ answer: 'SKIP' })}
                disabled={busy}
                className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] px-2.5 py-1 text-[12px] font-semibold text-[var(--rd-ink-2)] disabled:opacity-50"
              >
                Skip
              </button>
            </>
          )}
        </div>
      ) : (
        <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">Ask your manager to answer this.</p>
      )}

      {question.why?.text ? (
        <p className="m-0 text-[12px] text-[var(--rd-ink-3)]">Why we ask: {question.why.text}</p>
      ) : null}

      {samples.length ? (
        <p className="m-0 flex flex-wrap items-center gap-2 text-[12px] text-[var(--rd-ink-3)]">
          Sample trips:{' '}
          {samples.map((sample, index) => (
            <Link
              key={`${sample.to}-${index}`}
              to={sample.to}
              className="font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
            >
              #{index + 1}
            </Link>
          ))}
        </p>
      ) : null}
    </article>
  );
}
