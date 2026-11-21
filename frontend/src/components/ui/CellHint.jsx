import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import DataTooltip from '@/components/ui/DataTooltip';
import './CellHint.css';

/**
 * CellHint — a table cell that keeps to one line and says the rest in a tooltip.
 *
 * The cell shows the short form (one pill, "+1", a clipped reason with "…");
 * hovering or focusing it opens the shared DataTooltip with the whole story.
 * The trigger is a button, so the tooltip opens from the keyboard too, and its
 * aria-label carries everything the tooltip says. The tooltip is portalled, so
 * a scrolling or clipped table never cuts it off. A click still reaches the
 * row, so a row that opens on click keeps doing so.
 */
export default function CellHint({
  label,
  value = null,
  details = [],
  ariaLabel,
  className = '',
  side = 'top',
  align = 'end',
  children,
}) {
  return (
    <Tooltip delay={150}>
      <TooltipTrigger
        render={
          <button
            type="button"
            className={`cell-hint ${className}`.trim()}
            aria-label={ariaLabel}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        className="max-w-none border-0 bg-transparent p-0 shadow-none"
      >
        <DataTooltip label={label} value={value} details={details} className="cell-hint-card" />
      </TooltipContent>
    </Tooltip>
  );
}
