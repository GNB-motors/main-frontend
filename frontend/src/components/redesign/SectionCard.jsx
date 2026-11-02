import { toneStyles } from '@/utils/redesign/tone';
import InfoTip from './InfoTip';

/**
 * SectionCard — the standard card of the redesign.
 *
 * Every card header carries a coloured circular icon badge, so a long panel
 * can be scanned by shape and colour before a word is read. Nothing here
 * ever looks like a dead grey box.
 */
export default function SectionCard({
  icon: Icon = null,
  tone = 'info',
  title = '',
  info = null,
  action = null,
  children = null,
  className = '',
}) {
  const styles = toneStyles(tone);

  return (
    <section
      className={`rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] shadow-[var(--rd-shadow)] ${className}`}
    >
      <header className="flex items-start gap-2.5 px-4 pt-3.5 pb-2">
        {Icon ? (
          <span
            aria-hidden="true"
            className={`flex size-7 shrink-0 items-center justify-center rounded-full ${styles.bg} ${styles.ink}`}
          >
            <Icon size={15} />
          </span>
        ) : null}
        <h3 className="m-0 min-w-0 flex-1 text-[16px] leading-6 font-semibold text-[var(--rd-ink)]">
          {title}
        </h3>
        {info ? <InfoTip text={info.text} basis={info.basis} /> : null}
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="px-4 pt-0 pb-4">{children}</div>
    </section>
  );
}
