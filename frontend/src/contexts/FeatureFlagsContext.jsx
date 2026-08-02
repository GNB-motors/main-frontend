/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import apiClient from '../utils/axiosConfig';

const FeatureFlagsContext = createContext({
  flags: {},
  loading: true,
  isEnabled: () => false,
  refresh: async () => {},
});

export const FeatureFlagsProvider = ({ children }) => {
  const [flags, setFlags] = useState({});
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
      const orgFlags = payload?.organization?.featureFlags ?? {};
      setFlags(orgFlags || {});
    } catch (err) {
      console.warn('FeatureFlags: failed to fetch', err);
      setFlags({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isEnabled = useCallback((key) => flags?.[key] === true, [flags]);

  return (
    <FeatureFlagsContext.Provider value={{ flags, loading, isEnabled, refresh }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => useContext(FeatureFlagsContext);
