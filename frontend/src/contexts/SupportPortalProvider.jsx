import { Suspense, lazy, useEffect, useState } from 'react';
import SupportPortalContext from './supportPortalContext';
import { useApi } from '../hooks/useApi';
import { SupportService } from '../pages/Support/SupportService';
import { getUserRole } from '../utils/session';

const SupportPortal = lazy(() => import('../pages/Support/SupportPortal.jsx'));

const POLL_MS = 2 * 60 * 1000;

/**
 * Hosts the Support Portal for the dashboard shell: the unread-reply count for
 * the header icon and the lazily loaded full-screen portal. No websockets — the
 * count is polled, and refreshed on window focus and whenever the portal closes.
 */
export default function SupportPortalProvider({ children }) {
  // Super admins answer tickets on their own page; the org routes would 403 them.
  const enabled = getUserRole() !== 'SUPER_ADMIN';
  // `session` remounts the portal on every open, so it always starts on the list.
  const [panel, setPanel] = useState({ mounted: false, open: false, session: 0 });

  const { data: unread, refetch } = useApi((signal) => SupportService.unreadCount({ signal }), [], {
    enabled,
  });

  useEffect(() => {
    if (!enabled) return undefined;
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') refetch();
    };
    const timer = setInterval(refreshIfVisible, POLL_MS);
    window.addEventListener('focus', refreshIfVisible);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refreshIfVisible);
    };
  }, [enabled, refetch]);

  const value = {
    enabled,
    unread: unread ?? 0,
    openPortal: () => setPanel((p) => ({ mounted: true, open: true, session: p.session + 1 })),
    refreshUnread: refetch,
  };

  return (
    <SupportPortalContext.Provider value={value}>
      {children}
      {panel.mounted ? (
        <Suspense fallback={null}>
          <SupportPortal
            key={panel.session}
            open={panel.open}
            onOpenChange={(open) => {
              setPanel((p) => ({ ...p, open }));
              if (!open) refetch();
            }}
            onActivity={refetch}
          />
        </Suspense>
      ) : null}
    </SupportPortalContext.Provider>
  );
}
