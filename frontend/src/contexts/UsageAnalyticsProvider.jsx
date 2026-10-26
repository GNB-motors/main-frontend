import React from 'react';
import { useLocation } from 'react-router-dom';
import { recordView, getNavProfile } from '../services/UsageAnalyticsService.js';
import { computeVisibleNav } from '../utils/sideNavUtils.js';
import { useFeatureFlags } from './FeatureFlagsContext';
import { getUserRole } from '../utils/session';

import { UsageAnalyticsContext } from './UsageAnalyticsContext.js';

/**
 * UsageAnalyticsProvider — item 26 wired end to end.
 *
 * TWO JOBS, ONE PROVIDER, because they read and write the same thing:
 *
 *  1. RECORD. Every navigation to a counted surface posts one view. Without
 *     this the cut has no evidence behind it, and a cut with no evidence is a
 *     cut by taste.
 *  2. READ. The org's own learned profile is fetched once per session and handed
 *     to the Sidebar, which folds entries on it.
 *
 * FAILURE BEHAVIOUR (this matters more than it looks)
 * --------------------------------------------------
 * Nothing here may ever break navigation. A failed record is swallowed; a failed
 * profile leaves `profile` null, and a null profile means NO cut. Usage
 * tracking is allowed to be broken. The menu is not allowed to be empty because
 * of it.
 */

/** Use the same entitlement and role gates as the sidebar, before usage folding. */

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
        /* No profile leaves the full menu available. */
      });
    return () => controller.abort();
  }, [surfaces, enabled]);

  const value = React.useMemo(
    () => ({ profile, ready: Boolean(profile), catalog, surfaces, updateProfile: setProfile }),
    [profile, catalog, surfaces],
  );
  return <UsageAnalyticsContext.Provider value={value}>{children}</UsageAnalyticsContext.Provider>;
}
