import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { MapPin, ChevronDown, Check, Plus } from 'lucide-react';
import { useActiveBranch } from '../contexts/BranchContext.jsx';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext.jsx';
import { BranchService } from '../services/branchService';
import { getFirstNavPath } from '../utils/sideNavUtils.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import './LocationSwitcher.css';

/**
 * Header switcher for the active operating location (branch).
 *
 *   [ 📍 Chennai ▾ ]
 *
 * Selecting a location updates the global BranchContext (persisted to
 * localStorage `user_branchId`); the axios interceptor then sends `X-Branch-Id`
 * on every request and the DashboardLayout remounts the page so its data reloads.
 *
 * With no locations yet (just the enterprise), owners/managers still see the
 * control so they can add the first one. Adding opens a modal; the new location
 * is selected immediately. For non-managers the control hides until the business
 * has at least one location.
 */
const ALL_LOCATIONS = '__ALL__';

const LocationSwitcher = () => {
  const { branchId, branches, activeBranch, loading, setBranch, refresh } = useActiveBranch();
  const { canAccess } = useFeatureFlags();
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef(null);

  const canManage = ['OWNER', 'MANAGER'].includes(localStorage.getItem('user_role'));

  useEffect(() => {
    if (!open) return undefined;
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // The switcher only appears once the enterprise has at least one location. At
  // startup (enterprise only, no locations) it stays hidden — the first location
  // is added from Profile → Locations. Once a location exists, the switcher shows
  // for everyone and owners/managers get the in-dropdown "Add location" modal.
  if (loading) return null;
  const hasBranches = Array.isArray(branches) && branches.length >= 1;
  if (!hasBranches) return null;

  const currentLabel = activeBranch ? activeBranch.name : 'All locations';
  const selectedValue = branchId || ALL_LOCATIONS;

  // Switching location resets scope-sensitive pages: the current route may not
  // even be the right landing spot for the new location, so we send the user to
  // the first page they have access to in the sidebar and do a full reload. The
  // reload guarantees every cached, branch-scoped fetch starts clean.
  // setBranch persists to localStorage synchronously, so the branchId survives
  // the reload (axios interceptor reads it back for X-Branch-Id).
  const switchTo = (next) => {
    const changed = String(next || '') !== String(branchId || '');
    setBranch(next);
    setOpen(false);
    if (changed) window.location.assign(getFirstNavPath(canAccess));
  };

  const choose = (value) => {
    switchTo(value === ALL_LOCATIONS ? null : value);
  };

  const openAddModal = () => {
    setOpen(false);
    setName('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setName('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const created = await BranchService.createBranch({ name: trimmed });
      await refresh(); // reload the list so the new location is present
      setName('');
      setModalOpen(false);
      toast.success(`Location "${trimmed}" added`);
      if (created?._id) switchTo(String(created._id)); // select it → land on first page + reload
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.detail || 'Could not add location');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="location-switcher" ref={ref}>
      <button
        type="button"
        className="location-switcher-trigger"
        onClick={() => setOpen((v) => !v)}
        title="Switch location"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <MapPin size={15} className="location-switcher-pin" />
        <span className="location-switcher-label">{currentLabel}</span>
        <ChevronDown size={15} className={`location-switcher-caret ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <ul className="location-switcher-menu" role="listbox">
          <li
            role="option"
            aria-selected={selectedValue === ALL_LOCATIONS}
            className={`location-switcher-item ${selectedValue === ALL_LOCATIONS ? 'active' : ''}`}
            onClick={() => choose(ALL_LOCATIONS)}
          >
            <span>All locations (Enterprise)</span>
            {selectedValue === ALL_LOCATIONS && <Check size={15} />}
          </li>

          {hasBranches && <li className="location-switcher-divider" role="separator" />}

          {(branches || []).map((b) => (
            <li
              key={b._id}
              role="option"
              aria-selected={String(b._id) === String(branchId)}
              className={`location-switcher-item ${String(b._id) === String(branchId) ? 'active' : ''}`}
              onClick={() => choose(String(b._id))}
            >
              <span>
                {b.name}
                {b.isDefault ? <span className="location-switcher-tag">default</span> : null}
              </span>
              {String(b._id) === String(branchId) && <Check size={15} />}
            </li>
          ))}

          {canManage && (
            <>
              <li className="location-switcher-divider" role="separator" />
              <li
                className="location-switcher-item location-switcher-add"
                onClick={(e) => { e.stopPropagation(); openAddModal(); }}
              >
                <span className="location-switcher-add-label">
                  <Plus size={15} /> Add location
                </span>
              </li>
            </>
          )}
        </ul>
      )}

      {/* Add-location modal — opens from the switcher (or at zero locations). */}
      <Dialog open={modalOpen} onOpenChange={(isOpen) => { if (!isOpen) closeModal(); }}>
        <DialogContent className="max-w-md p-0">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add location</DialogTitle>
              <DialogDescription>Create a new operating location for your enterprise.</DialogDescription>
            </DialogHeader>

            <div className="px-6 py-4">
              <label htmlFor="new-location-name" className="mb-2 block text-sm font-medium">
                Location name
              </label>
              <input
                id="new-location-name"
                type="text"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={name}
                autoFocus
                maxLength={80}
                placeholder="e.g. Chennai"
                disabled={submitting}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <DialogFooter>
              <button
                type="button"
                className="rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50"
                onClick={closeModal}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                disabled={submitting || !name.trim()}
              >
                {submitting ? 'Adding…' : 'Add location'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationSwitcher;
