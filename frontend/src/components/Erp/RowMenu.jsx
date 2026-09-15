import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

const GAP = 4;
const MARGIN = 8;

/**
 * The "⋮" actions menu for a table row.
 *
 * WHY THIS IS A PORTAL AND NOT AN ABSOLUTELY-POSITIONED DIV:
 * Every ERP table sits inside `.erp-container { overflow: hidden }` and
 * `.erp-table-scroll { overflow-x: auto }` — and `overflow-x: auto` computes
 * `overflow-y` to `auto` too, so the scroller clips vertically as well. An
 * ancestor with `overflow` clips its descendants no matter what their stacking
 * order is, so the popup on the last row was being cut off by the card edge and
 * no amount of z-index could rescue it. The only fix is to stop being a
 * descendant: the panel renders into document.body and is positioned from the
 * trigger's viewport rect.
 *
 * The consequence of leaving the flow is that the panel no longer moves with its
 * row, so any scroll or resize closes it rather than leaving it stranded beside
 * the wrong record.
 */
const RowMenu = ({ items = [], label = 'Row actions' }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const t = trigger.getBoundingClientRect();
    const { offsetWidth: w, offsetHeight: h } = panel;

    // Flip above the trigger when there is not enough room below — the last row
    // of a table is exactly where this menu is most often opened.
    const below = window.innerHeight - t.bottom;
    const top = below >= h + GAP + MARGIN ? t.bottom + GAP : Math.max(MARGIN, t.top - h - GAP);

    // Right-align to the trigger, then clamp inside the viewport.
    const left = Math.min(
      Math.max(MARGIN, t.right - w),
      window.innerWidth - w - MARGIN,
    );

    setPos({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (e) => {
      if (panelRef.current?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const close = () => setOpen(false);

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    // `true` so a scroll on any ancestor scroller counts, not just the window.
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);

    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const visible = items.filter(Boolean);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="btn-icon"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreVertical size={16} />
      </button>

      {open
        && createPortal(
          <div
            ref={panelRef}
            className="erp-rowmenu-panel"
            role="menu"
            // Hidden until measured, so the first paint is not a flash at 0,0.
            style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {visible.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  className={item.tone === 'danger' ? 'danger' : undefined}
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                >
                  {Icon && <Icon size={14} />}
                  {item.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
};

export default RowMenu;
