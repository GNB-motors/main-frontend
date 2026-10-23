import React from 'react';
import { useLocation } from 'react-router-dom';
import { recordView, getNavProfile } from '../services/UsageAnalyticsService.js';
import { SIDE_NAV_ITEMS } from '../utils/sideNavItems.js';
import { surfaceKeysFromNav } from '../utils/navCut.js';
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

/** Every path the menu offers, computed once — the menu does not change at runtime. */
const MENU_PATHS = surfaceKeysFromNav(SIDE_NAV_ITEMS);

export default function UsageAnalyticsProvider({ children }) {
  const [profile, setProfile] = React.useState(null);
  const { pathname } = useLocation();
  const lastRecorded = React.useRef(null);

  // RECORD — once per navigation to a DIFFERENT surface. A re-render or a filter
  // change is not an open, and neither is going back to a page already counted.
  React.useEffect(() => {
    if (!pathname || pathname === lastRecorded.current) return;
    lastRecorded.current = pathname;
    recordView(pathname).catch(() => {
      /* usage tracking is allowed to fail silently — never at the user's cost */
    });
  }, [pathname]);

  // READ — the org's own profile, once per session. It is per org, not per page,
  // so navigation does not refetch it.
  React.useEffect(() => {
    let cancelled = false;
    getNavProfile({ surfaces: MENU_PATHS })
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        /* no profile -> the sidebar shows everything */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = React.useMemo(() => ({ profile, ready: Boolean(profile) }), [profile]);
  return <UsageAnalyticsContext.Provider value={value}>{children}</UsageAnalyticsContext.Provider>;
}