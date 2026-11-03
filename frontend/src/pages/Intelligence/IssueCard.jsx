import { useState } from 'react';
import Link from '@/components/redesign/FleetLink';
import { ChevronDown, ChevronRight, MapPin, Phone, PlugZap } from 'lucide-react';
import ToneBadge from '@/components/redesign/ToneBadge';
import DeepLink from '@/components/redesign/DeepLink';
import { formatIst, formatIstDate } from '@/utils/redesign/format';
import { RECONNECT_PATH } from '@/utils/redesign/links';

/**
 * IssueCard — one open problem, with what to do about it.
 *
 * The card never says "your truck is bad". It says what was seen, what the
 * system thinks should be done, and where the owner can look at the moment
 * itself.
 */
export default function IssueCard({ issue, pinned = false }) {
  const [open, setOpen] = useState(false);

  const evidence = issue?.evidence ?? [];
  const firstEvidenceLink = evidence.find((entry) => entry?.link?.to)?.link ?? null;
  const action = issue?.action ?? null;
  const actionTo = action?.to || (action?.kind === 'RECONNECT' ? RECONNECT_PATH : '/live-tracking');
  const isCall = action?.kind === 'CALL_DEALER' && String(actionTo).startsWith('tel:');

  const actionLabel =
    action?.label ||
    (action?.kind === 'RECONNECT'
      ? 'Reconnect'
      : action?.kind === 'CALL_DEALER'
        ? 'Call dealer'
        : 'See on map');

  const ActionIcon =
    action?.kind === 'RECONNECT' ? PlugZap : action?.kind === 'CALL_DEALER' ? Phone : MapPin;
  const actionClass =
    action?.kind === 'RECONNECT'
      ? 'border-[var(--rd-accent)] bg-[var(--rd-accent)] text-white hover:opacity-90'
      : 'border-[var(--rd-line-strong)] bg-[var(--rd-card)] text-[var(--rd-ink)] hover:bg-[var(--rd-card-2)]';

  return (
    <article
      className={`rounded-[var(--rd-radius)] border bg-[var(--rd-card)] p-4 shadow-[var(--rd-shadow)] ${
        pinned ? 'border-[var(--rd-act)] bg-[var(--rd-act-tint)]' : 'border-[var(--rd-line)]'
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--rd-watch-tint)] text-[var(--rd-watch-ink)]"
        >
          <MapPin size={15} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="m-0 text-[15px] font-semibold text-[var(--rd-ink)]">{issue?.title}</h3>
            <ToneBadge tone={issue?.severity ?? 'info'} />
          </div>

          <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[var(--rd-ink-2)]">
            {issue?.detail}
          </p>

          {issue?.advice ? (
            <p className="mt-1.5 mb-0 text-[13px] leading-relaxed text-[var(--rd-ink-2)]">
              <span className="font-semibold text-[var(--rd-ink)]">What to do: </span>
              {issue.advice}
            </p>
          ) : null}

          <p className="mt-2 mb-0 text-[12px] text-[var(--rd-ink-3)]">
            {[
              issue?.firstSeenAt ? `First seen ${formatIstDate(issue.firstSeenAt)}` : null,
              issue?.lastSeenAt ? `last ${formatIstDate(issue.lastSeenAt)}` : null,
              issue?.occurrences > 1 ? `${issue.occurrences} times` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-3">
            {firstEvidenceLink ? (
              <DeepLink link={{ label: 'See when', to: firstEvidenceLink.to }} />
            ) : null}
            {action ? (
              isCall ? (
                <a
                  href={actionTo}
                  className={`inline-flex items-center gap-1.5 rounded-[var(--rd-radius-xs)] border px-2.5 py-1 text-[13px] font-semibold no-underline transition-opacity ${actionClass}`}
                >
                  <ActionIcon size={14} aria-hidden="true" />
                  {actionLabel}
                </a>
              ) : (
                <Link
                  to={actionTo}
                  className={`inline-flex items-center gap-1.5 rounded-[var(--rd-radius-xs)] border px-2.5 py-1 text-[13px] font-semibold no-underline transition-opacity ${actionClass}`}
                >
                  <ActionIcon size={14} aria-hidden="true" />
                  {actionLabel}
                </Link>
              )
            ) : null}
          </div>

          {evidence.length ? (
            <div className="mt-2.5">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
                className="inline-flex items-center gap-1 rounded-[var(--rd-radius-xs)] px-1 py-0.5 text-[12px] font-semibold text-[var(--rd-ink-2)] hover:bg-[var(--rd-card-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
              >
                {open ? (
                  <ChevronDown size={13} aria-hidden="true" />
                ) : (
                  <ChevronRight size={13} aria-hidden="true" />
                )}
                {`Evidence (${evidence.length})`}
              </button>

              {open ? (
                <ul className="mt-1.5 mb-0 flex list-none flex-col gap-1.5 pl-0">
                  {evidence.map((entry, index) => (
                    <li
                      key={`${entry?.at ?? index}-${index}`}
                      className="flex flex-col gap-0.5 border-l-2 border-[var(--rd-line)] pl-2.5"
                    >
                      <span className="text-[12px] text-[var(--rd-ink-3)]">
                        {formatIst(entry?.at)}
                      </span>
                      <span className="text-[13px] text-[var(--rd-ink-2)]">{entry?.text}</span>
                      {entry?.link?.to ? <DeepLink link={entry.link} /> : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
