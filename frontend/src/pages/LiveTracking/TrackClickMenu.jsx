import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, MapPinPlus, BellRing, ExternalLink } from 'lucide-react';
import { clickMenuItems } from './trackClickModel';

const ACTION_STYLE = {
  makePlace: { Icon: MapPinPlus, description: 'Add a named place to your map' },
  alertZone: { Icon: BellRing, description: 'Set alerts for trucks entering or leaving' },
  openInGoogleMaps: { Icon: ExternalLink, description: 'Explore this location in a new tab' },
};

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
      className="lt-location-menu"
      style={position}
    >
      <div className="lt-location-menu-heading" aria-hidden="true">
        <span className="lt-location-menu-pin">
          <MapPin size={17} />
        </span>
        <div>
          <strong>This location</strong>
          <span>
            {Number(click.lat).toFixed(5)}, {Number(click.lng).toFixed(5)}
          </span>
        </div>
      </div>
      {clickMenuItems({ canEdit, canCreateZone }).map((item) => {
        const { Icon, description } = ACTION_STYLE[item.id];
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            aria-label={item.label}
            className={`lt-location-menu-action${item.id === 'openInGoogleMaps' ? ' is-external' : ''}`}
            onClick={() => onChoose(item.id)}
          >
            <span className="lt-location-menu-icon" aria-hidden="true">
              <Icon size={18} />
            </span>
            <span className="lt-location-menu-copy">
              <strong>{item.label}</strong>
              <small>{description}</small>
            </span>
          </button>
        );
      })}
    </div>,
    document.body,
  );
}
