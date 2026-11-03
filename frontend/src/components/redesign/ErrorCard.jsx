import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ErrorCard — a failure the owner can act on.
 *
 * It shows the status and the request id so support can find the exact
 * failure in the logs, and it offers a retry instead of a dead end.
 */
export default function ErrorCard({ error = null, onRetry = null }) {
  const status = error?.status ?? error?.response?.status ?? null;
  const requestId = error?.requestId ?? error?.response?.data?.requestId ?? null;

  return (
    <div className="flex flex-col items-start gap-3 rounded-[var(--rd-radius)] border border-[var(--rd-act)] bg-[var(--rd-act-tint)] p-4">
      <p className="m-0 text-[14px] font-semibold text-[var(--rd-act-ink)]">{"Couldn't load this."}</p>
      <p className="m-0 text-[12px] text-[var(--rd-ink-2)]">
        {[status ? `Error ${status}` : null, requestId ? `request ${requestId}` : null]
          .filter(Boolean)
          .join(' · ') || 'The request did not complete.'}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw size={14} aria-hidden="true" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
