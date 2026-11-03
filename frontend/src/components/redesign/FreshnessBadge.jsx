import { toneStyles } from '@/utils/redesign/tone';
import { formatAgo, formatIst } from '@/utils/redesign/format';
import { effectiveFreshness } from '@/utils/redesign/freshness';

/**
 * FreshnessBadge — says how old a reading is, and never lies about it.
 *
 * "Live" means the value was measured in the last five minutes. After that
 * we show the age instead, and a value that is older than the truck's own
 * usual silence is greyed out with its date. This is the fix for a DEF
 * reading from September being shown as if it were current.
 */
export default function FreshnessBadge({
  reading = null,
  at = null,
  freshness = null,
  size = 'md',
  prefix = null,
}) {
  // "Live" only within five minutes, whatever the row says (effectiveFreshness).
  const state = effectiveFreshness(freshness || reading?.freshness || 'never', reading?.ageMin);
  const stamp = at || reading?.at || null;
  const base = freshnessLabel(state, stamp, reading?.ageMin);
  // A prefix ("Last report") reads before an age, never before "Live".
  const label = prefix && state !== 'live' && state !== 'never' ? `${prefix} ${base}` : base;
  const tone = toneStyles(state === 'live' ? 'good' : state === 'recent' ? 'watch' : 'info');
  const isMuted = state === 'stale' || state === 'never';
  const dotSize = size === 'sm' ? 'size-1.5' : 'size-2';

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${size === 'sm' ? 'text-[11px]' : 'text-[12px]'} ${
        isMuted ? 'text-[var(--rd-ink-3)]' : tone.ink
      }`}
      title={stamp ? `Last measured ${formatIst(stamp, { withDate: true })}` : 'Never measured'}
    >
      <span
        aria-hidden="true"
        className={`${dotSize} rounded-full ${isMuted ? 'bg-[var(--rd-ink-3)]' : tone.solid}`}
      />
      {label}
    </span>
  );
}

/** The words for each freshness state. Pure, so it can be tested on its own. */
function freshnessLabel(state, stamp, ageMin) {
  if (state === 'live') return 'Live';
  if (state === 'never') return 'Not received';
  if (state === 'stale') return stamp ? `last known ${formatIst(stamp)}` : 'last known';
  // The backend's own age wins over our clock: the two can disagree by
  // minutes, and a reading must never look newer than it is.
  if (ageMin !== null && ageMin !== undefined && !Number.isNaN(Number(ageMin))) {
    const mins = Math.max(0, Math.round(Number(ageMin)));
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    return hours < 24 ? `${hours} h ago` : `${Math.floor(hours / 24)} days ago`;
  }
  return formatAgo(stamp);
}
