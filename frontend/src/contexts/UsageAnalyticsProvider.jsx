import React from 'react';
import { useLocation } from 'react-router-dom';
import { recordView, getNavProfile } from '../services/UsageAnalyticsService.js';
import { computeVisibleNav } from '../utils/sideNavUtils.js';
import { useFeatureFlags } from './FeatureFlagsContext';
import { getUserRole } from '../utils/session';

import { UsageAnalyticsContext } from './UsageAnalyticsContext.js';

/**
 * Records page visits and shares the organization's learned usage profile.
 * Analytics failures never affect navigation or sidebar placement.
 */

/** Use the same entitlement and role gates as the sidebar, without changing their navigation placement. */

export default function UsageAnalyticsProvider({ children }) {
  const [profile, setProfile] = React.useState(null);
  const { canAccess, ready: flagsReady } = useFeatureFlags();
  const role = getUserRole();
  const enabled = flagsReady && role !== 'SUPER_ADMIN';
  const catalog = React.useMemo(() => computeVisibleNav(canAccess, role).items, [canAccess, role]);
  const surfaces = React.useMemo(
    () => [
      ...new Set(
        catalog
          .flatMap((item) => (item.type === 'group' ? item.children || [] : [item]))
          .map((item) => item.to)
          .filter((path) => path && !path.includes(':')),
      ),
    ],
    [catalog],
  );
  const { pathname } = useLocation();
  const lastRecorded = React.useRef(null);

  // RECORD — once per navigation to a DIFFERENT surface. A re-render or a filter
  // change is not an open, and neither is going back to a page already counted.
  React.useEffect(() => {
    if (!enabled || !pathname || pathname === lastRecorded.current) return;
    lastRecorded.current = pathname;
    recordView(pathname).catch(() => {
      /* usage tracking is allowed to fail silently — never at the user's cost */
    });
  }, [pathname, enabled]);

  // READ — the org's own profile, once per session. It is per org, not per page,
  // so navigation does not refetch it.
  React.useEffect(() => {
    if (!enabled) return undefined;
    const controller = new AbortController();
    setProfile(null);
    getNavProfile({ surfaces, signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setProfile(data);
      })
      .catch(() => {
        /* analytics consumers can render without a learned profile */
      });
    return () => controller.abort();
  }, [surfaces, enabled]);

  const value = React.useMemo(
    () => ({ profile, ready: Boolean(profile), catalog, surfaces, updateProfile: setProfile }),
    [profile, catalog, surfaces],
  );
  return <UsageAnalyticsContext.Provider value={value}>{children}</UsageAnalyticsContext.Provider>;
}
