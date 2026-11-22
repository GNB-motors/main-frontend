import EmptyState from './EmptyState';
import ErrorCard from '@/components/redesign/ErrorCard';

/**
 * PageState — the one state contract for a page or a card.
 *
 * A surface can be in exactly one of these states:
 *   loading — nothing to show yet, but the request is in flight
 *   error   — the request failed; the owner gets a message and a Retry
 *   empty   — the request succeeded and there is genuinely nothing
 *   ready   — the content renders
 *
 * A failure never blanks the page: the error branch keeps the surrounding
 * layout and the caller can still render its own content around it.
 */
export default function PageState({
  loading = false,
  error = null,
  empty = false,
  onRetry = null,
  loadingLabel = 'Loading…',
  emptyTitle = 'Nothing here yet',
  emptyHint = null,
  emptyAction = null,
  emptyTone = 'neutral',
  loadingContent = null,
  children = null,
  className = '',
}) {
  if (error) {
    return (
      <div className={className}>
        <ErrorCard error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (loading) {
    if (loadingContent) return <div className={className}>{loadingContent}</div>;
    return (
      <div className={className} role="status" aria-live="polite">
        <p className="m-0 px-1 py-4 text-[13px]" style={{ color: 'var(--ds-ink2)' }}>
          {loadingLabel}
        </p>
      </div>
    );
  }

  if (empty) {
    return (
      <div className={className}>
        <EmptyState title={emptyTitle} hint={emptyHint} action={emptyAction} tone={emptyTone} />
      </div>
    );
  }

  return children ? <div className={className}>{children}</div> : null;
}
