import { toneLabel, toneStyles } from '@/utils/redesign/tone';

/**
 * ToneBadge — a pill that says what kind of thing this is.
 *
 * good → "Good", watch → "Watch", act → "Needs you", info → neutral. The
 * words matter: a transporter should never have to guess whether amber
 * means "soon" or "seriously now".
 */
export default function ToneBadge({ tone = 'info', children = null, className = '' }) {
  const styles = toneStyles(tone);
  const text = children ?? toneLabel(tone);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${styles.bg} ${styles.ink} ${className}`}
    >
      {text}
    </span>
  );
}
