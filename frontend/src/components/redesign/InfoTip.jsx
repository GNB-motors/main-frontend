import { useRef, useState } from 'react';
import { Info } from 'lucide-react';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';
import infoTipParts from './infoTipParts';

/**
 * InfoTip — the little "i" that explains a number.
 *
 * Opens on hover (after a short delay) and on keyboard focus; closes when the
 * pointer leaves, on blur and on Escape. A mouse click does nothing. Touch
 * screens have no hover, so there a tap toggles it — otherwise a phone could
 * never read it. The pointer can move into the box (to scroll a long one).
 *
 * The box sets its own type on every text element: page stylesheets that
 * style bare `p` globally (LiveTracking.css does) must not resize it.
 */
// Above the whole shell: navbar 1001–1003, sidebar 1004, drawers and their
// scrim 1005–1007, modals up to ~10100. A tip is momentary and always on top.
const TIP_LAYER = 'z-[10200]';
const OPEN_DELAY_MS = 150;
const CLOSE_DELAY_MS = 120;

export default function InfoTip({ text, basis = null, side = 'top', label = 'What is this?' }) {
  const [open, setOpen] = useState(false);
  const lastPointer = useRef('mouse');
  if (!text) return null;
  const { heading, items, body } = infoTipParts(text, label);

  return (
    <TooltipPrimitive.Provider delay={OPEN_DELAY_MS} closeDelay={CLOSE_DELAY_MS}>
      <TooltipPrimitive.Root
        open={open}
        onOpenChange={(next, details) => {
          // A tap fires emulated hover/focus too: on touch only the tap itself
          // (below) opens or closes it; an outside tap or Escape still closes.
          const reason = details?.reason;
          if (
            next &&
            lastPointer.current === 'touch' &&
            (reason === 'trigger-hover' || reason === 'trigger-focus')
          )
            return;
          setOpen(next);
        }}
      >
        <TooltipPrimitive.Trigger
          aria-label={label}
          delay={OPEN_DELAY_MS}
          closeDelay={CLOSE_DELAY_MS}
          closeOnClick={false}
          onPointerDown={(e) => {
            lastPointer.current = e.pointerType || 'mouse';
          }}
          onPointerEnter={(e) => {
            if (e.pointerType) lastPointer.current = e.pointerType;
          }}
          onClick={() => {
            if (lastPointer.current === 'touch') setOpen((o) => !o);
          }}
          className="inline-flex shrink-0 cursor-help items-center justify-center rounded-full p-0.5 align-middle text-[var(--rd-ink-3,#9ca3af)] transition-colors hover:text-[var(--rd-ink-1,#111827)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rd-brand-2,#2563eb)] data-[popup-open]:text-[var(--rd-ink-1,#111827)]"
          render={<button type="button" aria-label={label} />}
        >
          <Info size={14} aria-hidden="true" />
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Positioner
            side={side}
            sideOffset={8}
            collisionPadding={12}
            className={`isolate ${TIP_LAYER}`}
          >
            <TooltipPrimitive.Popup
              data-slot="info-tip"
              className="relative w-max max-w-[min(320px,calc(100vw-24px))] origin-(--transform-origin) rounded-[10px] border border-[var(--rd-line,#e5e7eb)] bg-[var(--rd-card,#fff)] text-left shadow-[0_12px_32px_-12px_rgba(17,24,39,.35),0_2px_6px_-2px_rgba(17,24,39,.12)] outline-hidden transition-[opacity,transform] duration-100 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0"
            >
              <div className="max-h-[min(360px,60vh)] overflow-y-auto px-3.5 py-3">
                {heading ? (
                  <div className="m-0 mb-1.5 text-[11px] font-semibold uppercase leading-4 tracking-[0.04em] text-[var(--rd-ink-3,#6b7280)]">
                    {heading}
                  </div>
                ) : null}
                {items ? (
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                    {items.map((item) => (
                      <li
                        key={item}
                        className="relative m-0 pl-3 text-[12.5px] font-normal leading-[1.5] text-[var(--rd-ink-2,#374151)] before:absolute before:left-0 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-[var(--rd-ink-3,#9ca3af)]"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="m-0 text-[12.5px] font-normal leading-[1.5] text-[var(--rd-ink-2,#374151)]">
                    {body}
                  </div>
                )}
                {basis ? (
                  <div className="m-0 mt-2 border-t border-[var(--rd-line,#e5e7eb)] pt-2 text-[11.5px] leading-[1.45] text-[var(--rd-ink-3,#6b7280)]">
                    {basis}
                  </div>
                ) : null}
              </div>
              <TooltipPrimitive.Arrow className="data-[side=bottom]:top-[-7px] data-[side=left]:right-[-11px] data-[side=left]:rotate-90 data-[side=right]:left-[-11px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-7px] data-[side=top]:rotate-180">
                <svg width="14" height="7" viewBox="0 0 14 7" aria-hidden="true">
                  <path
                    d="M0 7 L7 0 L14 7"
                    fill="var(--rd-card,#fff)"
                    stroke="var(--rd-line,#e5e7eb)"
                  />
                </svg>
              </TooltipPrimitive.Arrow>
            </TooltipPrimitive.Popup>
          </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
