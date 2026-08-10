/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../utils/axiosConfig';

const FeatureFlagsContext = createContext({
  flags: {},
  organization: null,
  loading: true,
  isEnabled: () => false,
  refresh: async () => {},
});

export const FeatureFlagsProvider = ({ children }) => {
  const [flags, setFlags] = useState({});
  // The same /api/auth/me payload already carries the organization, so the
  // company logo rides along with the flags rather than costing a second call.
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('authToken')) {
      setFlags({});
      setLoading(false);
      return;
    }
    try {
      const res = await apiClient.get('/api/auth/me');
      const payload = res.data?.data ?? res.data ?? {};
      const org = payload?.organization ?? null;
      setOrganization(org);
      setFlags(org?.featureFlags ?? {});
    } catch (err) {
      console.warn('FeatureFlags: failed to fetch', err);
      setFlags({});
      setOrganization(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isEnabled = useCallback((key) => flags?.[key] === true, [flags]);

  return (
    <FeatureFlagsContext.Provider value={{ flags, organization, loading, isEnabled, refresh }}>
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
