import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * InfoTip — the little "i" that explains a number in one click.
 *
 * It replaces every "definition" paragraph the product used to print under a
 * heading. On a desktop it opens on hover after 150 ms; on a touch screen it
 * opens on tap. The optional `basis` line underneath says where the number
 * came from, so the owner can trust it or question it.
 */
export default function InfoTip({ text, basis = null, side = 'top', label = 'What is this?' }) {
  if (!text) return null;

  return (
    <Popover>
      <PopoverTrigger
        aria-label={label}
        className="inline-flex shrink-0 items-center justify-center rounded-full p-0.5 text-[var(--rd-ink-3)] transition-colors hover:text-[var(--rd-ink-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2)]"
      >
        <Info size={14} aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent
        side={side}
        className="w-[280px] max-w-[280px] border-[var(--rd-line)] bg-[var(--rd-card)] p-3 text-[13px] leading-relaxed text-[var(--rd-ink-2)]"
      >
        <p className="m-0">{text}</p>
        {basis ? (
          <p className="m-0 mt-1.5 text-[12px] text-[var(--rd-ink-3)]">{basis}</p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
