/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import useApi from '../hooks/useApi';
import AuthService from '../services/AuthService';
import { isAuthenticated } from '../utils/session.js';
import logger from '../utils/logger';

const FeatureFlagsContext = createContext({
  flags: {},
  permissions: {},
  organization: null,
  profile: null,
  loading: true,
  ready: false,
  failed: false,
  isEnabled: () => false,
  hasPermission: () => false,
  canAccess: () => false,
  refresh: async () => {},
  retry: async () => {},
});

/**
 * The backoff ladder for a failed /api/auth/me: 1 s, 2 s, 4 s, 8 s, then it
 * stops and waits for a person (the banner's Retry button).
 */
export const FLAGS_RETRY_BACKOFF_MS = Object.freeze([1000, 2000, 4000, 8000]);

/**
 * Flags the frontend knows about before an org has been granted them.
 *
 * A missing flag is never ON: every key starts OFF and only the server
 * (/api/auth/me -> organization.featureFlags) can turn one on.
 * `performanceSection` is wave 5's Performance section — OFF by default.
 */
export const DEFAULT_FEATURE_FLAGS = Object.freeze({ performanceSection: false });

export const FeatureFlagsProvider = ({ children }) => {
  const [flags, setFlags] = useState({});
  // The user's RBAC permissions for the ACTIVE branch (resolved server-side and
  // returned by /api/auth/me). Drives per-user visibility on top of the org's
  // feature-flag entitlement.
  const [permissions, setPermissions] = useState({});
  // The same /api/auth/me payload already carries the organization, so the
  // company logo rides along with the flags rather than costing a second call.
  const [organization, setOrganization] = useState(null);
  // Full /api/auth/me payload (profile fields incl. primaryThemeColor), so
  // DashboardLayout's theme sync can read it here instead of firing its own
  // redundant /api/auth/me request on every mount.
  const [profile, setProfile] = useState(null);

  // AuthService.getMe unwraps `data.data ?? data ?? {}`, so a settled read is
  // always an object and `ready` below can tell it from "not fetched yet".
  const {
    data: payload,
    loading,
    error: meError,
    refetch,
  } = useApi((signal) => AuthService.getMe({ signal }), [], {
    enabled: isAuthenticated(),
  });

  // A failed /auth/me does NOT mean "no flags": it means we do not know yet.
  // The last good flags stay on screen (an empty flags object collapses the
  // whole sidebar), and the read is retried with a backoff.
  const [failed, setFailed] = useState(false);
  const attemptRef = useRef(0);
  const retryTimerRef = useRef(null);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!payload) return;
    const org = payload?.organization ?? null;
    setOrganization(org);
    setFlags({ ...DEFAULT_FEATURE_FLAGS, ...(org?.featureFlags ?? {}) });
    setPermissions(payload?.permissions ?? {});
    setProfile(payload);
    // A good read resets the ladder, so the next failure starts at 1 s again.
    attemptRef.current = 0;
    setFailed(false);
  }, [payload]);

  useEffect(() => {
    if (!meError) return undefined;
    logger.warn('FeatureFlagsContext', 'FeatureFlags: failed to fetch', meError);
    setFailed(true);
    // The last good flags, permissions and organisation stay: a failed read is
    // not a fact about the account.
    const delay = FLAGS_RETRY_BACKOFF_MS[attemptRef.current];
    if (delay === undefined) return undefined; // the ladder is done; wait for a person
    attemptRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      retryTimerRef.current = null;
      refetchRef.current();
    }, delay);
    return () => clearTimeout(retryTimerRef.current);
  }, [meError]);

  const refresh = useCallback(() => refetch(), [refetch]);

  /** The banner's Retry button: try again now, and start the ladder over. */
  const retry = useCallback(() => {
    attemptRef.current = 0;
    setFailed(true);
    refetchRef.current();
  }, []);

  // True once the FIRST /api/auth/me has settled and its payload is in state
  // (or it failed, or the user isn't authenticated so it never runs). Checking
  // `profile` rather than `loading` matters: the payload lands in state via the
  // effect above, one render after `loading` flips false — gating on `loading`
  // alone would let one render through with empty permissions. Later refetches
  // (branch switch) keep the previous profile, so this never flips back.
  const ready = profile !== null || (!loading && !payload);

  // Permissions are resolved per active branch, so re-fetch when the user
  // switches location (BranchContext dispatches `branchChange`).
  useEffect(() => {
    const onBranchChange = () => refresh();
    window.addEventListener('branchChange', onBranchChange);
    return () => window.removeEventListener('branchChange', onBranchChange);
  }, [refresh]);

  const isEnabled = useCallback((key) => flags?.[key] === true, [flags]);
  const hasPermission = useCallback((key) => permissions?.[key] === true, [permissions]);
  // A module is visible only if the org is entitled to it (feature flag) AND the
  // user's assigned role grants it (permission). Keys with no gate pass through.
  const canAccess = useCallback(
    (key) => !key || (isEnabled(key) && hasPermission(key)),
    [isEnabled, hasPermission],
  );

  const value = useMemo(
    () => ({
      flags,
      permissions,
      organization,
      profile,
      loading,
      ready,
      failed,
      isEnabled,
      hasPermission,
      canAccess,
      refresh,
      retry,
    }),
    [
      flags,
      permissions,
      organization,
      profile,
      loading,
      ready,
      failed,
      isEnabled,
      hasPermission,
      canAccess,
      refresh,
      retry,
    ],
  );

  return <FeatureFlagsContext.Provider value={value}>{children}</FeatureFlagsContext.Provider>;
};

export const useFeatureFlags = () => useContext(FeatureFlagsContext);

/**
 * Company-level details (name, gstin, logoUrl) for anything that renders org
 * branding. `refresh` re-reads /api/auth/me — call it after changing the logo
 * so every consumer updates without a page reload.
 */
export const useOrganization = () => {
  const { organization, loading, refresh } = useContext(FeatureFlagsContext);
  return { organization, loading, refresh };
};
