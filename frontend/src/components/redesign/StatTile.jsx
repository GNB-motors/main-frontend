import { Link } from 'react-router-dom';
import { InfoTip } from './InfoTip';

/**
 * StatTile — one number, with its meaning and its evidence.
 *
 * The 3 px coloured top border tells the owner at a glance whether the
 * number is good, neutral or needs them, before a single word is read. When
 * the tile knows where the evidence lives, the whole tile is a link.
 */
export default function StatTile({ label, value, tone = 'info', why = null, link = null, sub = null }) {
  const borderColor = {
    good: 'var(--rd-good)',
    info: 'var(--rd-info)',
    watch: 'var(--rd-watch)',
    act: 'var(--rd-act)',
  }[tone] || 'var(--rd-info)';

  const body = (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-[var(--rd-radius)]"
        style={{ backgroundColor: borderColor }}
      />
      <span className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[var(--rd-ink-2)]">
        {label}
        {why ? <InfoTip text={why.text} basis={why.basis} /> : null}
      </span>
      <span className="mt-0.5 block text-[28px] leading-tight font-[650] tracking-tight text-[var(--rd-ink)] [font-variant-numeric:tabular-nums]">
        {value}
      </span>
      {sub ? <span className="mt-0.5 block text-[12px] text-[var(--rd-ink-3)]">{sub}</span> : null}
    </>
  );

  if (link?.to) {
    return (
      <Link
        to={link.to}
        className="relative flex flex-col rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-3 no-underline shadow-[var(--rd-shadow)] transition-colors hover:border-[var(--rd-line-strong)]"
      >
        {body}
      </Link>
    );
  }

  return (
    <div className="relative flex flex-col rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-3 shadow-[var(--rd-shadow)]">
      {body}
    </div>
  );
}
