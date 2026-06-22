/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../utils/axiosConfig';

/**
 * PermissionsContext — Roles & Permissions (Employee Management Service).
 *
 * Mirrors FeatureFlagsContext.jsx's pattern exactly, but for the Owner→employee
 * permission layer instead of the SUPER_ADMIN→org layer. The two are separate
 * and stack: FeatureFlags gates which sidebar sections exist for the whole org
 * at all; PermissionsContext further gates which of those an individual
 * logged-in employee can see/use, based on the Role an Owner assigned them.
 *
 * Both read the same /api/auth/me response in parallel — no extra request.
 */
const PermissionsContext = createContext({
  permissions: {},
  loading: true,
  canView: () => true,
  canManage: () => true,
  refresh: async () => {},
});

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('authToken')) {
      setPermissions({});
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/api/auth/me');
      const payload = res.data?.data ?? res.data ?? {};
      setPermissions(payload?.permissions ?? {});
    } catch (err) {
      console.warn('PermissionsContext: failed to fetch', err);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // OWNER and SUPER_ADMIN always resolve to full access on the backend (see
  // role.service.js resolvePermissions) — these helpers don't special-case
  // that here, they just read what the API already computed, so frontend and
  // backend can never disagree about who has access to what.
  const canView = useCallback(
    (moduleKey) => permissions?.[moduleKey]?.view === true,
    [permissions],
  );
  const canManage = useCallback(
    (moduleKey) => permissions?.[moduleKey]?.manage === true,
    [permissions],
  );

  return (
    <PermissionsContext.Provider value={{ permissions, loading, canView, canManage, refresh }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
