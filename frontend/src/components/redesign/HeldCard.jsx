import { Hourglass } from 'lucide-react';

/**
 * HeldCard — says a feature is not ready yet, and why.
 *
 * When an endpoint returns `held`, the product must not show numbers it
 * cannot stand behind, and must not pretend the feature does not exist.
 * It shows the reason the backend gave, with its evidence.
 */
export default function HeldCard({ why = null }) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--rd-radius)] border border-[var(--rd-watch)] bg-[var(--rd-watch-tint)] p-4">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--rd-watch)] text-white">
        <Hourglass size={15} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="m-0 text-[14px] font-semibold text-[var(--rd-watch-ink)]">Not shown yet</p>
        {why?.text ? (
          <p className="m-0 text-[13px] leading-relaxed text-[var(--rd-ink-2)]">{why.text}</p>
        ) : null}
        {why?.basis ? (
          <p className="m-0 text-[12px] leading-relaxed text-[var(--rd-ink-3)]">{why.basis}</p>
        ) : null}
      </div>
    </div>
  );
}
