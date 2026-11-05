import { ChevronDown, ChevronUp } from 'lucide-react';
import InfoTip from '../../components/redesign/InfoTip';

/**
 * LegendBlock — a titled group of rows inside the Track legend.
 *
 * The "All" button only appears when something in the block is switched off,
 * so the panel stays quiet until the owner needs it.
 *
 * A block can also fold away: the owner keeps the choice, and the group stays
 * out of the way until they ask for it again.
 */
export default function LegendBlock({
  title,
  info = null,
  showAll = false,
  onAll = null,
  collapsible = false,
  open = true,
  onToggle = null,
  children,
}) {
  const isOpen = !collapsible || open;
  return (
    <div className="border-b border-[var(--rd-line)] py-2 last:border-b-0">
      <div className="flex items-center gap-1.5 px-1 pb-1">
        <h3 className="m-0 text-[11px] font-semibold tracking-wide text-[var(--rd-ink-3)] uppercase">
          {title}
        </h3>
        {collapsible ? (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${title}`}
            title={`${isOpen ? 'Collapse' : 'Expand'} ${title}`}
            className="rounded p-0.5 text-[var(--rd-ink-3)] transition-colors hover:bg-[var(--rd-card-2)] hover:text-[var(--rd-ink-2)]"
          >
            {isOpen ? (
              <ChevronUp size={13} aria-hidden="true" />
            ) : (
              <ChevronDown size={13} aria-hidden="true" />
            )}
          </button>
        ) : null}
        {info ? <InfoTip text={info.text} basis={info.basis} /> : null}
        {showAll && onAll ? (
          <button
            type="button"
            onClick={onAll}
            className="ml-auto rounded px-1 text-[11px] font-semibold text-[var(--rd-brand-2)] hover:underline"
          >
            All
          </button>
        ) : null}
      </div>
      {isOpen ? children : null}
    </div>
  );
}
