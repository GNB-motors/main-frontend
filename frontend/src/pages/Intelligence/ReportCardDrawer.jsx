import Link from '@/components/redesign/FleetLink';
import { MapPinned, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import InsightChip from '@/components/redesign/InsightChip';
import InfoTip from '@/components/redesign/InfoTip';
import ToneBadge from '@/components/redesign/ToneBadge';
import { formatNumber } from '@/utils/redesign/format';
import { intelligenceLink, trackLink } from '@/utils/redesign/links';

const GRADE_LABEL = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  FAIR: 'Fair',
  FALLING: 'Falling off',
};

const GRADE_TONE = { EXCELLENT: 'good', GOOD: 'info', FAIR: 'info', FALLING: 'watch' };

/**
 * ReportCardDrawer — the whole card, with the moments behind it.
 *
 * Every claim on the card can be followed: the strengths and problems are
 * links to the exact moments, and the card ends with the screens where this
 * truck or driver shows up again.
 */
export default function ReportCardDrawer({ card, open, onOpenChange }) {
  if (!card) return null;

  const isDriver = card?.subject === 'driver';
  const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="max-w-md border-[var(--rd-line)] bg-[var(--rd-card)]">
        <SheetHeader className="border-[var(--rd-line)] px-5 py-4">
          <div className="min-w-0">
            <SheetTitle className="text-[16px] text-[var(--rd-ink)]">
              {card?.name ?? ''}
              {card?.make ? (
                <span className="font-normal text-[var(--rd-ink-2)]">{` · ${card.make}`}</span>
              ) : null}
            </SheetTitle>
            <SheetDescription className="mt-1 text-[13px] text-[var(--rd-ink-2)]">
              {card?.headline ?? ''}
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close the card"
            className="rounded-full p-1 text-[var(--rd-ink-3)] hover:bg-[var(--rd-card-2)] hover:text-[var(--rd-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {card?.grade ? (
              <ToneBadge tone={GRADE_TONE[card.grade] ?? 'info'}>
                {GRADE_LABEL[card.grade] ?? card.grade}
              </ToneBadge>
            ) : null}
            {card?.score !== null && card?.score !== undefined ? (
              <span className="text-[13px] text-[var(--rd-ink-2)] tabular-nums">
                {`Score ${formatNumber(card.score)}`}
              </span>
            ) : null}
            {card?.phoneNumber ? (
              <span className="text-[13px] text-[var(--rd-ink-2)]">{card.phoneNumber}</span>
            ) : null}
          </div>

          {card?.strengths?.length ? (
            <section className="flex flex-col gap-2">
              <h3 className="m-0 text-[13px] font-semibold text-[var(--rd-ink)]">What went well</h3>
              <div className="flex flex-wrap gap-1.5">
                {card.strengths.map((chip) => (
                  <InsightChip key={`${chip.key}-${chip.label}`} chip={chip} size="sm" />
                ))}
              </div>
            </section>
          ) : null}

          {card?.problems?.length ? (
            <section className="flex flex-col gap-2">
              <h3 className="m-0 text-[13px] font-semibold text-[var(--rd-ink)]">What to fix</h3>
              <div className="flex flex-col gap-2">
                {card.problems.map((chip) => (
                  <div key={`${chip.key}-${chip.label}`} className="flex flex-col gap-1">
                    <InsightChip chip={chip} size="sm" />
                    {chip.advice ? (
                      <p className="m-0 text-[12px] leading-relaxed text-[var(--rd-ink-2)]">
                        {chip.advice}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {card?.basis?.text ? (
            <section className="flex flex-col gap-1">
              <h3 className="m-0 text-[13px] font-semibold text-[var(--rd-ink)]">
                What this is based on
              </h3>
              <p className="m-0 text-[13px] leading-relaxed text-[var(--rd-ink-2)]">
                {card.basis.text}
              </p>
              {card.basis.basis ? (
                <p className="m-0 text-[12px] text-[var(--rd-ink-3)]">{card.basis.basis}</p>
              ) : null}
            </section>
          ) : null}

          <section className="flex flex-col gap-2">
            <h3 className="m-0 text-[13px] font-semibold text-[var(--rd-ink)]">See it yourself</h3>
            <div className="flex flex-wrap gap-2">
              {!isDriver && card?.id ? (
                <Link
                  to={trackLink({ reg: card.id, from: lastDay, to: new Date() })}
                  className="inline-flex items-center gap-1.5 rounded-[var(--rd-radius-xs)] border border-[var(--rd-line-strong)] bg-[var(--rd-card)] px-2.5 py-1 text-[13px] font-semibold text-[var(--rd-ink)] no-underline hover:bg-[var(--rd-card-2)]"
                >
                  <MapPinned size={14} aria-hidden="true" />
                  See on map
                </Link>
              ) : null}
              <Link
                to={intelligenceLink(
                  isDriver
                    ? { tab: 'idling', driver: card?.id }
                    : { tab: 'idling', vehicle: card?.id },
                )}
                className="inline-flex items-center gap-1.5 rounded-[var(--rd-radius-xs)] border border-[var(--rd-line-strong)] bg-[var(--rd-card)] px-2.5 py-1 text-[13px] font-semibold text-[var(--rd-ink)] no-underline hover:bg-[var(--rd-card-2)]"
              >
                {isDriver ? 'See all their idling' : 'See all its idling'}
              </Link>
              <Link
                to={intelligenceLink(
                  isDriver
                    ? { tab: 'overspeed', driver: card?.id }
                    : { tab: 'overspeed', vehicle: card?.id },
                )}
                className="inline-flex items-center gap-1.5 rounded-[var(--rd-radius-xs)] border border-[var(--rd-line-strong)] bg-[var(--rd-card)] px-2.5 py-1 text-[13px] font-semibold text-[var(--rd-ink)] no-underline hover:bg-[var(--rd-card-2)]"
              >
                {isDriver ? 'See all their overspeeds' : 'See all its overspeeds'}
              </Link>
            </div>

            {isDriver ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  aria-disabled="true"
                  className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-[var(--rd-radius-xs)] border border-[var(--rd-line)] bg-[var(--rd-card-2)] px-2.5 py-1 text-[13px] font-semibold text-[var(--rd-ink-3)]"
                >
                  Reward this driver (coming soon)
                </button>
                <InfoTip
                  text="Soon you’ll be able to reward good drivers directly from here."
                  label="About rewarding a driver"
                />
              </div>
            ) : null}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
