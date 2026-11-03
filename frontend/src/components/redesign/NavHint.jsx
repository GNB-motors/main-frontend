import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * NavHint — the hover help on a sidebar item.
 *
 * The owner asked: "if you hover over any tab in the website it should tell
 * you what it does". This wraps a nav element in a tooltip that says what
 * the item is for. It is desktop-only, because a touch screen has no hover
 * and a tooltip that opens on tap would fight the link.
 *
 * When the sidebar is collapsed the label is invisible, so the tooltip
 * repeats it: "Track — Live map of every truck…".
 */
export default function NavHint({ hint = null, label = '', collapsed = false, children }) {
  const isDesktop = useMediaQuery('(min-width: 993px)');

  if (!hint || !isDesktop) return children;

  const text = collapsed && label ? `${label} — ${hint}` : hint;

  return (
    <Tooltip delay={300}>
      <TooltipTrigger render={children} />
      <TooltipContent side="right" sideOffset={8}>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
