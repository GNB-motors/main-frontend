import {
  Fuel,
  MessageCircleQuestion,
  MessageCircleWarning,
  PackageCheck,
  PackageOpen,
  PlugZap,
  Sparkles,
  Trophy,
  Wrench,
} from 'lucide-react';
import SectionCard from '../../components/redesign/SectionCard';
import Link from '@/components/redesign/FleetLink';
import { humanise } from '../../lib/vocabulary';

/** Known review reasons the feed sends as codes, in the owner's words. */
const VALUE_WORDS = { MERGE_CONFLICT: 'Overlaps another place' };

/** A row value from the feed: a number or text as sent, but never a raw
 *  CONSTANT_CASE code on screen. */
const rowValue = (value) => {
  if (typeof value !== 'string' || !/^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/.test(value)) return value;
  return VALUE_WORDS[value] ?? humanise(value);
};

/**
 * DigestStoryCard — one card of the day's story.
 *
 * The cards come from the API in the order the API sends them, and the
 * card's own sentence is printed exactly as sent. Nothing is reworded and
 * nothing is truncated: the API's words are the explanation.
 */
const ICONS = {
  loaded: PackageCheck,
  empty: PackageOpen,
  goodDrivers: Trophy,
  needsWord: MessageCircleWarning,
  fuel: Fuel,
  questions: MessageCircleQuestion,
  issues: Wrench,
  reconnect: PlugZap,
};

export default function DigestStoryCard({ card, children = null }) {
  if (!card) return null;
  const Icon = ICONS[card.key] || Sparkles;

  return (
    <SectionCard icon={Icon} tone={card.tone} title={card.title}>
      {card.big ? (
        <p className="m-0 mb-1 text-[28px] leading-8 font-semibold tracking-[-0.01em] text-[var(--rd-ink)] tabular-nums">
          {card.big}
        </p>
      ) : null}

      {card.text ? (
        <p className="m-0 text-[13px] leading-relaxed text-[var(--rd-ink-2)]">{card.text}</p>
      ) : null}

      {Array.isArray(card.items) && card.items.length ? (
        <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
          {card.items.map((item, index) => (
            <li key={`${card.key}-${item.label}-${index}`}>
              {item.link?.to ? (
                <Link
                  to={item.link.to}
                  className="flex items-baseline justify-between gap-2 rounded-[var(--rd-radius-xs)] px-1 py-0.5 text-[13px] no-underline transition-colors hover:bg-[var(--rd-card-2)]"
                >
                  <span className="min-w-0 flex-1 truncate text-[var(--rd-ink)]">{item.label}</span>
                  {item.value ? (
                    <span className="shrink-0 text-[var(--rd-ink-2)] tabular-nums">
                      {rowValue(item.value)}
                    </span>
                  ) : null}
                </Link>
              ) : (
                <span className="flex items-baseline justify-between gap-2 px-1 py-0.5 text-[13px]">
                  <span className="min-w-0 flex-1 truncate text-[var(--rd-ink)]">{item.label}</span>
                  {item.value ? (
                    <span className="shrink-0 text-[var(--rd-ink-2)] tabular-nums">
                      {rowValue(item.value)}
                    </span>
                  ) : null}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}

      {children}

      {card.link?.to ? (
        <Link
          to={card.link.to}
          hideUnavailable
          className="mt-2 inline-block text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
        >
          {`${card.link.label} →`}
        </Link>
      ) : null}
    </SectionCard>
  );
}
