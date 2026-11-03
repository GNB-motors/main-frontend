import { AlertTriangle, ThumbsUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useGoToLink } from '@/utils/redesign/links';
import WhyPopover from './WhyPopover';

/**
 * InsightChip — one good thing, or one problem, about a truck or driver.
 *
 * The good ones come first, so a glance at the panel shows what is working
 * before what is not. Clicking a chip takes the owner to the exact moments
 * behind the claim — a chip you cannot check is just a label.
 */
export default function InsightChip({ chip, size = 'md' }) {
  const goToLink = useGoToLink();
  if (!chip) return null;

  const tone = chip.tone === 'good' ? 'good' : chip.tone === 'bad' ? 'act' : 'info';
  const Icon = chip.tone === 'good' ? ThumbsUp : chip.tone === 'bad' ? AlertTriangle : null;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[12px]' : 'px-2.5 py-1 text-[13px]';

  return (
    <Popover>
      <PopoverTrigger
        onClick={() => goToLink(chip.link)}
        className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--rd-line)] font-medium transition-colors hover:border-[var(--rd-line-strong)] ${padding} ${
          tone === 'good'
            ? 'bg-[var(--rd-good-tint)] text-[var(--rd-good-ink)]'
            : tone === 'act'
              ? 'bg-[var(--rd-act-tint)] text-[var(--rd-act-ink)]'
              : 'bg-[var(--rd-card-2)] text-[var(--rd-ink-2)]'
        }`}
      >
        {Icon ? <Icon size={size === 'sm' ? 12 : 14} aria-hidden="true" /> : null}
        <span className="truncate">{chip.label}</span>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="w-[280px] max-w-[280px] border-[var(--rd-line)] bg-[var(--rd-card)] p-3"
      >
        <WhyPopover why={chip.why} link={chip.link} />
      </PopoverContent>
    </Popover>
  );
}
