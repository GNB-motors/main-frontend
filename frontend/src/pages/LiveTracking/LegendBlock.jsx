import InfoTip from '../../components/redesign/InfoTip';

/**
 * LegendBlock — a titled group of rows inside the Track legend.
 *
 * The "All" button only appears when something in the block is switched off,
 * so the panel stays quiet until the owner needs it.
 */
export default function LegendBlock({ title, info = null, showAll = false, onAll = null, children }) {
  return (
    <div className="border-b border-[var(--rd-line)] py-2 last:border-b-0">
      <div className="flex items-center gap-1.5 px-1 pb-1">
        <h3 className="m-0 text-[11px] font-semibold tracking-wide text-[var(--rd-ink-3)] uppercase">
          {title}
        </h3>
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
      {children}
    </div>
  );
}
