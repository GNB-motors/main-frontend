import { Skeleton } from '@/components/ui/skeleton';

/**
 * One stat card (gnb-ui-design 6.4): a title with an optional status pill, a
 * DM Sans figure, an optional level track, and a note pinned to the bottom so
 * notes line up across the row. With `onSelect` the whole card is the button
 * that filters the table under it.
 */
export default function ToolStatCard({
  title,
  figure,
  qualifier = null,
  tone = null,
  pill = null,
  track = null,
  note,
  noteTone = null,
  loading = false,
  onSelect = null,
  selected = false,
}) {
  const body = (
    <>
      <span className="tp-card-head">
        <span className="tp-card-title">{title}</span>
        {pill}
      </span>
      <span className="tp-figure">
        {loading ? (
          <Skeleton className="h-[26px] w-20" />
        ) : (
          <strong className={tone ? `is-${tone}` : undefined}>{figure}</strong>
        )}
        {qualifier && !loading ? <span>{qualifier}</span> : null}
      </span>
      {track != null ? (
        <span className="tp-track" aria-hidden="true">
          <span style={{ width: `${Math.max(0, Math.min(100, track))}%` }} />
        </span>
      ) : null}
      <span className={`tp-stat-note${noteTone ? ` is-${noteTone}` : ''}`}>
        {loading ? ' ' : note}
      </span>
    </>
  );
  return onSelect ? (
    <button type="button" className="tp-card tp-stat" aria-pressed={selected} onClick={onSelect}>
      {body}
    </button>
  ) : (
    <section className="tp-card tp-stat" aria-label={title}>
      {body}
    </section>
  );
}
