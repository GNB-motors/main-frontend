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
  canAccess: () => true,
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

  // Single-toggle model: a granted key means the employee can both view and
  // act on it. OWNER and SUPER_ADMIN resolve to full access on the backend, so
  // these helpers just read what the API already computed. canView/canManage
  // are kept as aliases of canAccess so existing call sites keep working.
  const canAccess = useCallback((key) => permissions?.[key] === true, [permissions]);
  const canView = canAccess;
  const canManage = canAccess;

  return (
    <PermissionsContext.Provider value={{ permissions, loading, canAccess, canView, canManage, refresh }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
