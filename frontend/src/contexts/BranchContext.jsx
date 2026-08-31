/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BranchService } from '../services/branchService';

/**
 * Global "active location" (branch) context.
 *
 * Holds the business's list of operating locations and the one currently selected
 * in the header switcher. The selection persists in localStorage `user_branchId`
 * (mirroring `user_orgId`) so the axios interceptor can attach `X-Branch-Id` to
 * every request and pages keep their scope across reloads.
 *
 * The user's "businessRefId" is the existing org id (localStorage `user_orgId`).
 */

const STORAGE_KEY = 'user_branchId';

const BranchContext = createContext({
  businessRefId: null,
  branchId: null,
  branches: [],
  activeBranch: null,
  loading: true,
  setBranch: () => {},
  refresh: async () => {},
});

export const BranchProvider = ({ children }) => {
  const businessRefId = localStorage.getItem('user_orgId') || null;
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(() => localStorage.getItem(STORAGE_KEY) || null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((id) => {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('authToken')) {
      setBranches([]);
      setLoading(false);
      return;
    }
    try {
      const list = await BranchService.listBranches({ status: 'ACTIVE' });
      setBranches(list);

      // Default view is Enterprise (all locations) = branchId null. Only honor a
      // previously-selected location if it is still valid; otherwise fall back to
      // Enterprise. We never auto-select a specific location — that keeps the
      // logged-in default showing everything (non-breaking).
      const stored = localStorage.getItem(STORAGE_KEY);
      const valid = stored && list.some((b) => String(b._id) === String(stored));
      if (valid) {
        setBranchId(stored);
      } else {
        setBranchId(null);
        persist(null);
      }
    } catch (err) {
      console.warn('BranchContext: failed to load locations', err);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [persist]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setBranch = useCallback(
    (id) => {
      const next = id ? String(id) : null;
      setBranchId(next);
      persist(next);
      // Same-tab signal for lightweight consumers (badges, counts) that should
      // react without a full remount. The DashboardLayout also re-keys the page
      // subtree on branchId so data-fetching effects re-run against the new scope.
      window.dispatchEvent(new CustomEvent('branchChange', { detail: { branchId: next } }));
    },
    [persist],
  );

  const activeBranch = branches.find((b) => String(b._id) === String(branchId)) || null;

  return (
    <BranchContext.Provider
      value={{ businessRefId, branchId, branches, activeBranch, loading, setBranch, refresh }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useActiveBranch = () => useContext(BranchContext);

export default BranchContext;
