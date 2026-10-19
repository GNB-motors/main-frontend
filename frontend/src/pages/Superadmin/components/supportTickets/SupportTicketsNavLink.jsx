import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { useApi } from '../../../../hooks/useApi';
import { SupportAdminService } from './SupportAdminService';

// Every super-admin request is written to the audit log, so the badge polls gently
// and leans on route changes and window focus for freshness.
const POLL_MS = 5 * 60 * 1000;

/**
 * Sidebar entry for the support inbox with an unread badge. The badge is
 * re-read on every route change (opening a ticket marks it read), on window
 * focus, and on a slow poll.
 * Wrappers are divs: the collapsed sidebar hides every span inside a nav link.
 */
export default function SupportTicketsNavLink({ onNavigate }) {
  const { pathname } = useLocation();
  const { data: unread, refetch } = useApi(
    (signal) => SupportAdminService.unreadCount({ signal }),
    [pathname],
  );

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    const timer = setInterval(refreshIfVisible, POLL_MS);
    window.addEventListener('focus', refreshIfVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refreshIfVisible);
    };
  }, [refetch]);

  const count = unread ?? 0;

  return (
    <NavLink
      to="/superadmin/support-tickets"
      className="superadmin-nav-link"
      onClick={onNavigate}
      aria-label={count > 0 ? `Support Tickets, ${count} unread` : undefined}
    >
      <div className="sat-nav-icon">
        <LifeBuoy size={20} />
        {count > 0 ? <div className="sat-nav-badge">{count > 99 ? '99+' : count}</div> : null}
      </div>
      <span>Support Tickets</span>
    </NavLink>
  );
}
