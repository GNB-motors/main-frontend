import { Headset } from 'lucide-react';
import { useSupportPortal } from '../contexts/supportPortalContext';

/**
 * Header icon next to the notification bell. Opens the Support Portal; the red
 * count is tickets where support has replied and nobody in the org has read it yet.
 */
export default function SupportButton() {
  const { enabled, unread, openPortal } = useSupportPortal();
  if (!enabled) return null;

  const label =
    unread > 0 ? `Support — ${unread} unread repl${unread === 1 ? 'y' : 'ies'}` : 'Support';

  return (
    <button
      type="button"
      className="navbar-bell relative"
      aria-label={label}
      title={label}
      onClick={openPortal}
    >
      <Headset size={18} />
      {unread > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      ) : null}
    </button>
  );
}
