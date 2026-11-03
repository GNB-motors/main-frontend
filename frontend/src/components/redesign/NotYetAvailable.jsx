import { Construction } from 'lucide-react';

/**
 * NotYetAvailable — the screen for an endpoint that is not deployed yet.
 *
 * A 404 means the backend has not shipped that route, not that there is no
 * data. Saying so plainly is better than an empty table the owner reads as
 * "nothing happened".
 */
export default function NotYetAvailable({ what = 'This' }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-[var(--rd-radius)] border border-dashed border-[var(--rd-line-strong)] bg-[var(--rd-card)] px-6 py-10 text-center">
      <Construction size={40} strokeWidth={1.5} aria-hidden="true" className="text-[var(--rd-ink-3)]" />
      <p className="m-0 text-[14px] text-[var(--rd-ink-2)]">{what} is being built and will appear here.</p>
    </div>
  );
}
