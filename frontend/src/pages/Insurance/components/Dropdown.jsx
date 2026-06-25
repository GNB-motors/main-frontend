import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/**
 * Dropdown — a real, branded select replacement (no native <select>).
 *
 * The menu renders in a portal with fixed positioning, so it is never clipped
 * by a table's overflow or a modal's bounds, and sits above the modal layer.
 * Options may carry a `dot` (Tailwind bg-* class) so status/priority show their
 * colour in both the trigger and the menu — the at-a-glance scan a CRM needs.
 *
 * Variants:
 *   'input' (default) — bordered control matching the form inputs.
 *   'pill'            — compact coloured pill for inline table editing.
 *
 * Options: [{ value, label, dot?, Icon? }]
 */
const MENU_ANIM = `
@media (prefers-reduced-motion: no-preference){
  .ins-dd-menu{animation:insDdIn .12s ease-out;}
  @keyframes insDdIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:none;}}
}`;

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  variant = 'input',
  tone = '',
  size = 'md',
  align = 'left',
  ariaLabel,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [active, setActive] = useState(-1);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const selected = options.find((o) => o.value === value) || null;

  const place = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.max(r.width, variant === 'pill' ? 180 : r.width);
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < 260 && r.top > spaceBelow;
    setPos({
      left: align === 'right' ? Math.max(8, r.right - width) : r.left,
      top: openUp ? undefined : r.bottom + 6,
      bottom: openUp ? window.innerHeight - r.top + 6 : undefined,
      width,
      maxHeight: Math.max(160, (openUp ? r.top : spaceBelow) - 16),
    });
  }, [align, variant]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const reposition = () => place();
    const onDown = (e) => {
      if (!triggerRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      document.removeEventListener('mousedown', onDown);
    };
  }, [open, place]);

  const openMenu = () => {
    if (disabled) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const choose = (opt) => {
    onChange(opt.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKey = (e) => {
    if (['Enter', ' ', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      open ? setActive((i) => Math.min(options.length - 1, i + 1)) : openMenu();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && open && active >= 0) {
      e.preventDefault();
      choose(options[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const sizeCls = size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';

  const triggerInner = (
    <>
      <span className="flex min-w-0 items-center gap-2">
        {selected?.dot && <span className={`h-2 w-2 shrink-0 rounded-full ${selected.dot}`} />}
        {selected?.Icon && <selected.Icon size={variant === 'pill' ? 11 : 14} />}
        <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>{selected ? selected.label : placeholder}</span>
      </span>
      <ChevronDown
        size={variant === 'pill' ? 11 : 15}
        className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''} ${variant === 'pill' ? '' : 'text-slate-400'}`}
      />
    </>
  );

  const triggerCls =
    variant === 'pill'
      ? `inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ring-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-300 disabled:opacity-50 ${tone} ${className}`
      : `flex w-full items-center justify-between gap-2 rounded-lg border bg-white ${sizeCls} ${
          open ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
        } text-slate-700 outline-none transition-colors hover:border-slate-300 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100 disabled:opacity-50 ${className}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={(e) => {
          e.stopPropagation();
          open ? setOpen(false) : openMenu();
        }}
        onKeyDown={onTriggerKey}
        className={triggerCls}
      >
        {triggerInner}
      </button>

      {open && pos
        ? createPortal(
            <>
              <style>{MENU_ANIM}</style>
              <ul
                ref={menuRef}
                role="listbox"
                className="ins-dd-menu fixed z-[2100] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
                style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: pos.width, maxHeight: pos.maxHeight }}
                onClick={(e) => e.stopPropagation()}
              >
                {options.map((o, i) => {
                  const isSel = o.value === value;
                  return (
                    <li
                      key={`${o.value}-${i}`}
                      role="option"
                      aria-selected={isSel}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => choose(o)}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
                        active === i ? 'bg-slate-100' : ''
                      } ${isSel ? 'font-semibold text-slate-800' : 'text-slate-600'}`}
                    >
                      {o.dot && <span className={`h-2 w-2 shrink-0 rounded-full ${o.dot}`} />}
                      {o.Icon && <o.Icon size={14} />}
                      <span className="flex-1 truncate">{o.label}</span>
                      {isSel && <Check size={14} className="text-blue-600" />}
                    </li>
                  );
                })}
              </ul>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
