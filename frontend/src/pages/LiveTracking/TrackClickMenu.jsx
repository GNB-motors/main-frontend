import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clickMenuItems } from './trackClickModel';

/** Location actions, kept within the viewport and usable without a pointer. */
export default function TrackClickMenu({
  click,
  canEdit = false,
  canCreateZone = canEdit,
  onChoose,
  onClose,
}) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ left: 8, top: 8 });

  useLayoutEffect(() => {
    if (!click) return undefined;
    const place = () => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      setPosition({
        left: Math.max(8, Math.min(click.x ?? 8, window.innerWidth - box.width - 8)),
        top: Math.max(8, Math.min(click.y ?? 8, window.innerHeight - box.height - 8)),
      });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [click]);

  useEffect(() => {
    if (!click) return undefined;
    const previousFocus = document.activeElement;
    ref.current?.querySelector('[role="menuitem"]')?.focus();
    const outside = (event) => {
      if (!ref.current?.contains(event.target)) onClose?.();
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('contextmenu', outside, true);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('contextmenu', outside, true);
      if (previousFocus?.isConnected) previousFocus.focus?.();
    };
  }, [click, onClose]);

  if (!click) return null;
  const onKeyDown = (event) => {
    const items = Array.from(ref.current.querySelectorAll('[role="menuitem"]'));
    const index = items.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % items.length;
    if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = items.length - 1;
    if (next != null) {
      event.preventDefault();
      items[next]?.focus();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      onClose?.();
    }
    if (event.key === 'Tab') onClose?.();
  };

  return createPortal(
    <div
      ref={ref}
      role="menu"
      tabIndex={-1}
      aria-label="What to do here"
      onKeyDown={onKeyDown}
      className="fixed z-[1200] flex w-[220px] max-w-[calc(100vw-16px)] max-h-[calc(100vh-16px)] overflow-y-auto flex-col gap-0.5 rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-1 shadow-[var(--rd-shadow-float)]"
      style={position}
    >
      {clickMenuItems({ canEdit, canCreateZone }).map((item) => (
        <button
          key={item.id}
          type="button"
          role="menuitem"
          className="rounded-[var(--rd-radius-xs)] px-2.5 py-1.5 text-left text-[13px] text-[var(--rd-ink)] transition-colors hover:bg-[var(--rd-card-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          onClick={() => onChoose(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
