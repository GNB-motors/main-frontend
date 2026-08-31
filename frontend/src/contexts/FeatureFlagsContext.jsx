/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../utils/axiosConfig';

const FeatureFlagsContext = createContext({
  flags: {},
  permissions: {},
  organization: null,
  loading: true,
  isEnabled: () => false,
  hasPermission: () => false,
  canAccess: () => false,
  refresh: async () => {},
});

export const FeatureFlagsProvider = ({ children }) => {
  const [flags, setFlags] = useState({});
  // The user's RBAC permissions for the ACTIVE branch (resolved server-side and
  // returned by /api/auth/me). Drives per-user visibility on top of the org's
  // feature-flag entitlement.
  const [permissions, setPermissions] = useState({});
  // The same /api/auth/me payload already carries the organization, so the
  // company logo rides along with the flags rather than costing a second call.
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('authToken')) {
      setFlags({});
      setPermissions({});
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/api/auth/me');
      const payload = res.data?.data ?? res.data ?? {};
      const org = payload?.organization ?? null;
      setOrganization(org);
      setFlags(org?.featureFlags ?? {});
      setPermissions(payload?.permissions ?? {});
    } catch (err) {
      console.warn('FeatureFlags: failed to fetch', err);
      setFlags({});
      setPermissions({});
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  return (
    <FeatureFlagsContext.Provider
      value={{ flags, permissions, organization, loading, isEnabled, hasPermission, canAccess, refresh }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
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
