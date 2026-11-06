import { Inbox } from 'lucide-react';
import IntelligenceSkeleton from './IntelligenceSkeleton';
import ErrorCard from '@/components/redesign/ErrorCard';
import HeldCard from '@/components/redesign/HeldCard';
import NotYetAvailable from '@/components/redesign/NotYetAvailable';

/**
 * IntelligenceDataState — the frame every tab of this page draws in.
 *
 * A 404 means the backend has not shipped that endpoint yet, so it reads as
 * "being built" and never as "there is nothing here". A `held` answer is the
 * backend saying it cannot stand behind the number yet. Everything else is an
 * honest empty message or an error the owner can retry.
 */
export default function IntelligenceDataState({
  loading = false,
  loadingVariant = 'list',
  loadingCount = 3,
  error = null,
  held = null,
  isEmpty = false,
  emptyMessage = null,
  emptyIcon = Inbox,
  emptyTone = 'info',
  what = 'This',
  onRetry = null,
  children = null,
}) {
  const EmptyIcon = emptyIcon;

  if (loading) {
    return <IntelligenceSkeleton variant={loadingVariant} count={loadingCount} />;
  }

  if (error) {
    if (error?.status === 404) return <NotYetAvailable what={what} />;
    return <ErrorCard error={error} onRetry={onRetry} />;
  }

  if (held) return <HeldCard why={held} />;

  if (isEmpty) {
    const good = emptyTone === 'good';
    return (
      <div
        data-tone={good ? 'good' : 'empty'}
        className={`intel-data-empty flex flex-col items-center gap-2 rounded-[var(--rd-radius)] border px-6 py-10 text-center ${
          good
            ? 'border-[var(--rd-good)] bg-[var(--rd-good-tint)]'
            : 'border-dashed border-[var(--rd-line-strong)] bg-[var(--rd-card)]'
        }`}
      >
        <EmptyIcon
          size={40}
          strokeWidth={1.5}
          aria-hidden="true"
          className={good ? 'text-[var(--rd-good-ink)]' : 'text-[var(--rd-ink-3)]'}
        />
        <p
          className={`m-0 text-[14px] ${good ? 'text-[var(--rd-good-ink)]' : 'text-[var(--rd-ink-2)]'}`}
        >
          {emptyMessage}
        </p>
      </div>
    );
  }

  return children;
}
