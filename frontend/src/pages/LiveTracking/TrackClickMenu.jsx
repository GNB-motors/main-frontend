import { useEffect, useRef } from 'react';
import { clickMenuItems } from './trackClickModel';

/**
 * TrackClickMenu — what a click on the map offers.
 *
 * The menu is the answer to "what can I do with this spot?": make it a place,
 * watch it as a zone, or open it in Google Maps. Only the people who may
 * create places are offered that first item.
 */
export default function TrackClickMenu({ click, canEdit = false, onChoose, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!click) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [click, onClose]);

  useEffect(() => {
    if (click) ref.current?.focus();
  }, [click]);

  if (!click) return null;

  return (
    <div
      ref={ref}
      role="menu"
      aria-label="What to do here"
      tabIndex={-1}
      className="fixed z-[1200] flex w-[220px] flex-col gap-0.5 rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-1 shadow-[var(--rd-shadow-float)]"
      style={{ left: click.x ?? 0, top: click.y ?? 0 }}
    >
      {clickMenuItems({ canEdit }).map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className="rounded-[var(--rd-radius-xs)] px-2.5 py-1.5 text-left text-[13px] text-[var(--rd-ink)] transition-colors hover:bg-[var(--rd-card-2)]"
          onClick={() => onChoose(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
