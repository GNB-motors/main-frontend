import { useEffect } from 'react';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { describeError } from '@/errors/errorMessages';
import logger from '@/utils/logger';

/**
 * ErrorCard — a failure the owner can act on.
 *
 * The owner reads plain words only ("You don't have access to this."). The
 * request id stays as a small support line so an operator can quote it, and the
 * raw error goes to the logger — never to the screen.
 */
export default function ErrorCard({
  error = null,
  onRetry = null,
  title = null,
  message = null,
  className = '',
}) {
  const info = describeError(error);

  useEffect(() => {
    if (!error) return;
    logger.error('ui', `ErrorCard: ${info.kind} (status ${info.status ?? 'n/a'})`, {
      requestId: info.requestId,
      error: error?.message ?? String(error),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const heading = title || info.title;
  const body = message || info.message;
  const canRetry = Boolean(onRetry) && info.retryable;

  return (
    <div
      role="alert"
      className={`flex flex-col items-start gap-3 rounded-[var(--rd-radius)] border border-[var(--rd-act)] bg-[var(--rd-act-tint)] p-4 ${className}`}
    >
      <p className="m-0 text-[14px] font-semibold text-[var(--rd-act-ink)]">{heading}</p>
      <p className="m-0 text-[12px] text-[var(--rd-ink-2)]">{body}</p>
      {info.requestId ? (
        <p className="m-0 text-[11px] text-[var(--rd-ink-2)]">Reference: {info.requestId}</p>
      ) : null}
      {canRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw size={14} aria-hidden="true" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
