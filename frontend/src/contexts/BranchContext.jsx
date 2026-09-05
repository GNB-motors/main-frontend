/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { BranchService } from '../services/branchService';
import { getOrgId, getBranchId, setBranchId as persistBranchId, getToken } from '../utils/session.js';

/**
 * Global "active location" (branch) context.
 *
 * Holds the business's list of operating locations and the one currently selected
 * in the header switcher. The selection persists in storage as `user_branchId`
 * (mirroring `user_orgId`) so the axios interceptor can attach `X-Branch-Id` to
 * every request and pages keep their scope across reloads.
 *
 * The user's "businessRefId" is the existing org id (`user_orgId`).
 */

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
  const businessRefId = getOrgId() || null;
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState(() => getBranchId() || null);
  const [loading, setLoading] = useState(true);

  const persist = useCallback((id) => {
    // session.setBranchId writes the id, or REMOVES the key when null —
    // mirroring the old setItem/removeItem pair.
    persistBranchId(id);
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) {
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
      const stored = getBranchId();
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
