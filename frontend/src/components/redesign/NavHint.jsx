import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import DataTooltip from '@/components/ui/DataTooltip';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * NavHint — the hover help on a sidebar item.
 *
 * The owner asked: "if you hover over any tab in the website it should tell
 * you what it does". This wraps a nav element in a tooltip that says what
 * the item is for. It is desktop-only, because a touch screen has no hover
 * and a tooltip that opens on tap would fight the link.
 *
 * It uses the same card as the chart tooltips (DataTooltip): the item's name
 * with the accent bar, and what it is for underneath.
 */
export default function NavHint({ hint = null, label = '', children }) {
  const isDesktop = useMediaQuery('(min-width: 993px)');

  if (!hint || !isDesktop) return children;

  return (
    <Tooltip delay={300}>
      <TooltipTrigger render={children} />
      <TooltipContent
        side="right"
        sideOffset={18}
        className="max-w-none border-0 bg-transparent p-0 shadow-none"
      >
        {label ? <DataTooltip label={label} details={[hint]} /> : hint}
      </TooltipContent>
    </Tooltip>
  );
}
