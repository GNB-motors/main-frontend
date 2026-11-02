import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import InsightChip from '@/components/redesign/InsightChip';
import { formatNumber } from '@/utils/redesign/format';

/**
 * ReportCardTile — one truck or one driver, and how it is doing.
 *
 * The strengths come first, because a page that only shows what went wrong
 * is a page that only shows what went wrong. The name is the button that
 * opens the full card; the chips stay clickable, so every claim on the tile
 * can be checked.
 */
export default function ReportCardTile({ card, onOpen }) {
  const TrendIcon = card?.trend === 'UP' ? TrendingUp : card?.trend === 'DOWN' ? TrendingDown : Minus;
  const trendTone =
    card?.trend === 'UP'
      ? 'text-[var(--rd-good-ink)]'
      : card?.trend === 'DOWN'
        ? 'text-[var(--rd-act-ink)]'
        : 'text-[var(--rd-ink-3)]';
  const isFalling = card?.grade === 'FALLING';

  return (
    <article className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-3">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpen(card)}
          aria-label={`Open the full card for ${card?.name ?? ''}`}
          className="min-w-0 text-left text-[14px] font-semibold text-[var(--rd-ink)] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
        >
          {card?.name}
          {card?.make ? <span className="font-normal text-[var(--rd-ink-2)]">{` · ${card.make}`}</span> : null}
          {card?.model ? <span className="font-normal text-[var(--rd-ink-2)]">{` ${card.model}`}</span> : null}
        </button>
        {card?.trend ? (
          <span className={`inline-flex shrink-0 items-center ${trendTone}`}>
            <TrendIcon size={16} aria-hidden="true" />
            <span className="sr-only">
              {card.trend === 'UP' ? 'getting better' : card.trend === 'DOWN' ? 'getting worse' : 'steady'}
            </span>
          </span>
        ) : null}
      </div>

      {card?.headline ? (
        <p className="mt-1 mb-0 text-[13px] leading-relaxed text-[var(--rd-ink-2)]">{card.headline}</p>
      ) : null}

      {card?.strengths?.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {card.strengths.map((chip) => (
            <InsightChip key={`${chip.key}-${chip.label}`} chip={chip} size="sm" />
          ))}
        </div>
      ) : null}

      {card?.problems?.length ? (
        <div className="mt-2 flex flex-col gap-1.5">
          {card.problems.map((chip) => (
            <div key={`${chip.key}-${chip.label}`} className="flex flex-col gap-0.5">
              <InsightChip chip={chip} size="sm" />
              {isFalling && chip.advice ? (
                <span className="text-[12px] leading-relaxed text-[var(--rd-ink-2)]">{chip.advice}</span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-2 text-[12px] text-[var(--rd-ink-3)]">
        <span>{card?.basis?.basis || card?.basis?.text || ''}</span>
        {card?.score !== null && card?.score !== undefined ? (
          <span className="tabular-nums">{`Score ${formatNumber(card.score)}`}</span>
        ) : null}
      </div>
    </article>
  );
}
