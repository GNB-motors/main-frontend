import Link from '@/components/redesign/FleetLink';
import { MapPin } from 'lucide-react';
import ToneBadge from '@/components/redesign/ToneBadge';
import { formatProbability } from '@/utils/redesign/format';

/**
 * PlaceQuestionCard — a place the system could not name, and what it thinks
 * the name is.
 *
 * The owner is not asked to accept a guess: the trips that touched the point
 * are listed, so the answer can be checked before it is given.
 */
export default function PlaceQuestionCard({ question }) {
  const suggestion = question?.suggestion ?? null;
  const alternatives = question?.alternatives ?? [];
  const sampleTrips = question?.sampleTrips ?? [];

  return (
    <article className="rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-4 shadow-[var(--rd-shadow)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--rd-brand-tint)] text-[var(--rd-brand-2)]"
          >
            <MapPin size={15} />
          </span>
          <h3 className="m-0 text-[15px] font-semibold text-[var(--rd-ink)]">
            {suggestion?.name ?? 'A place we could not name'}
          </h3>
        </div>
        {suggestion?.category ? <ToneBadge tone="info">{suggestion.category}</ToneBadge> : null}
      </div>

      {question?.why?.text ? (
        <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[var(--rd-ink-2)]">
          {question.why.text}
          {question.why.basis ? (
            <span className="block text-[12px] text-[var(--rd-ink-3)]">{question.why.basis}</span>
          ) : null}
        </p>
      ) : null}

      <p className="mt-1.5 mb-0 text-[12px] text-[var(--rd-ink-3)]">
        {[
          question?.tripsAffected ? `${question.tripsAffected} trips` : null,
          question?.trucks ? `${question.trucks} trucks` : null,
          suggestion?.source ? `from ${suggestion.source}` : null,
          formatProbability(suggestion?.confidence),
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>

      {alternatives.length ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-[var(--rd-ink-3)]">Other names for this point:</span>
          {alternatives.map((alternative) => (
            <span
              key={`${alternative?.name}-${alternative?.source}`}
              className="rounded-full border border-[var(--rd-line)] bg-[var(--rd-card-2)] px-2 py-0.5 text-[12px] text-[var(--rd-ink-2)]"
            >
              {alternative?.name}
            </span>
          ))}
        </div>
      ) : null}

      {sampleTrips.length ? (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className="text-[12px] text-[var(--rd-ink-3)]">Trips that stopped here:</span>
          {sampleTrips.map((trip) => (
            <Link
              key={`${trip?.label}-${trip?.to}`}
              to={trip?.to}
              className="text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
            >
              {`${trip?.label} →`}
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}
