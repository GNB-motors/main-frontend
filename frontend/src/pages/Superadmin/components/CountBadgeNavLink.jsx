import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApi } from '../../../hooks/useApi';

// Every super-admin request is written to the audit log, so the badge polls gently
// and leans on route changes and window focus for freshness.
const POLL_MS = 5 * 60 * 1000;

/**
 * Sidebar entry with a red count badge. The count is re-read on every route
 * change, on window focus, on a slow poll, and whenever `refreshEvent` fires
 * on window (pages dispatch it after changing something the count depends on).
 * Wrappers are divs: the collapsed sidebar hides every span inside a nav link.
 */
export default function CountBadgeNavLink({
  to,
  icon,
  label,
  countLabel,
  fetchCount,
  refreshEvent,
  onNavigate,
}) {
  const { pathname } = useLocation();
  const { data, refetch } = useApi((signal) => fetchCount({ signal }), [pathname]);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    const timer = setInterval(refreshIfVisible, POLL_MS);
    window.addEventListener('focus', refreshIfVisible);
    if (refreshEvent) window.addEventListener(refreshEvent, refetch);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refreshIfVisible);
      if (refreshEvent) window.removeEventListener(refreshEvent, refetch);
    };
  }, [refetch, refreshEvent]);

  const count = data ?? 0;

  return (
    <NavLink
      to={to}
      className="superadmin-nav-link"
      onClick={onNavigate}
      aria-label={count > 0 ? `${label}, ${count} ${countLabel}` : undefined}
    >
      <div className="sat-nav-icon">
        {icon}
        {count > 0 ? <div className="sat-nav-badge">{count > 99 ? '99+' : count}</div> : null}
      </div>
      <span>{label}</span>
    </NavLink>
  );
}
