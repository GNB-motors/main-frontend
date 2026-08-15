import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { Check, Plus, Search } from 'lucide-react';
import { useActiveBranch } from '../contexts/BranchContext.jsx';
import { useFeatureFlags, useOrganization } from '../contexts/FeatureFlagsContext.jsx';
import { BranchService } from '../services/branchService';
import { getFirstNavPath } from '../utils/sideNavUtils.js';
import NewEnterpriseIcon from './Icons/NewEnterpriseIcon.jsx';
import BranchIcon from './Icons/BranchIcon.jsx';
import Chevron from './Icons/Chevron.jsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from './ui/dialog';
import './LocationSwitcher.css';

const MENU_WIDTH = 380;

// Compose a one-line address from a branch's parts.
const branchAddress = (b) => [b.address, b.city, b.state, b.pincode].filter(Boolean).join(', ');

/**
 * Enterprise / location switcher (top bar). Opens a searchable picker with the
 * Enterprise (all locations) row plus each branch (address + launch status).
 * The dropdown aligns left or right of the trigger based on available space so
 * it never overflows. Shown only once the enterprise has at least one location;
 * owners/managers can add more from here.
 */
const LocationSwitcher = () => {
  const { branchId, branches, activeBranch, loading, setBranch, refresh } = useActiveBranch();
  const { canAccess } = useFeatureFlags();
  const { organization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [align, setAlign] = useState('left');
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);

  const canManage = ['OWNER', 'MANAGER'].includes(localStorage.getItem('user_role'));

  useEffect(() => {
    if (!open) return undefined;
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // Decide left/right alignment from the space to the right of the trigger.
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setAlign(rect.left + MENU_WIDTH > window.innerWidth - 8 ? 'right' : 'left');
    setQuery('');
  }, [open]);

  if (loading) return null;
  const hasBranches = Array.isArray(branches) && branches.length >= 1;
  if (!hasBranches) return null; // hidden until the enterprise has a location

  const orgName = organization?.companyName || 'Enterprise';
  const currentLabel = activeBranch ? activeBranch.name : orgName;
  const isEnterprise = !branchId;

  const q = query.trim().toLowerCase();
  const visibleBranches = (branches || []).filter(
    (b) => !q || b.name?.toLowerCase().includes(q) || branchAddress(b).toLowerCase().includes(q),
  );

  const switchTo = (next) => {
    const changed = String(next || '') !== String(branchId || '');
    setBranch(next);
    setOpen(false);
    if (changed) window.location.assign(getFirstNavPath(canAccess));
  };

  const openAddModal = () => { setOpen(false); setName(''); setModalOpen(true); };
  const closeModal = () => { if (!submitting) { setModalOpen(false); setName(''); } };

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const created = await BranchService.createBranch({ name: trimmed });
      await refresh();
      setName('');
      setModalOpen(false);
      toast.success(`Location "${trimmed}" added`);
      if (created?._id) switchTo(String(created._id));
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.detail || 'Could not add location');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="location-switcher" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        className="location-switcher-trigger"
        onClick={() => setOpen((v) => !v)}
        title="Switch enterprise / location"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="location-switcher-pin">
          {isEnterprise
            ? <NewEnterpriseIcon width={18} height={18} />
            : <BranchIcon width={18} height={18} />}
        </span>
        <span className="location-switcher-label">{currentLabel}</span>
        <Chevron size={18} className={`location-switcher-caret ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className={`ls-menu ls-menu--${align}`} role="listbox">
          <div className="ls-search">
            <Search size={16} className="ls-search__icon" />
            <input
              className="ls-search__input"
              type="text"
              value={query}
              autoFocus
              placeholder="Search here..."
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="ls-list">
            {/* Enterprise (all locations) */}
            <button
              type="button"
              className={`ls-row ${isEnterprise ? 'ls-row--active' : ''}`}
              onClick={() => switchTo(null)}
            >
              <span className="ls-row__icon"><NewEnterpriseIcon width={22} height={22} /></span>
              <span className="ls-row__body">
                <span className="ls-row__title">{orgName}</span>
                <span className="ls-row__sub">All locations · Enterprise</span>
              </span>
              {isEnterprise && <Check size={16} className="ls-row__check" />}
            </button>

            {visibleBranches.map((b) => {
              const active = String(b._id) === String(branchId);
              const addr = branchAddress(b);
              return (
                <button
                  key={b._id}
                  type="button"
                  className={`ls-row ${active ? 'ls-row--active' : ''}`}
                  onClick={() => switchTo(String(b._id))}
                >
                  <span className="ls-row__icon"><BranchIcon width={22} height={22} /></span>
                  <span className="ls-row__body">
                    <span className="ls-row__title">
                      {b.name}
                      {b.isDefault && <span className="ls-tag">default</span>}
                    </span>
                    {addr && <span className="ls-row__sub">{addr}</span>}
                  </span>
                  {active && <Check size={16} className="ls-row__check" />}
                </button>
              );
            })}

            {visibleBranches.length === 0 && (
              <div className="ls-empty">No locations match “{query}”.</div>
            )}
          </div>

          {canManage && (
            <button type="button" className="ls-add" onClick={openAddModal}>
              <Plus size={16} /> Add location
            </button>
          )}
        </div>
      )}

      {/* Add-location modal */}
      <Dialog open={modalOpen} onOpenChange={(isOpen) => { if (!isOpen) closeModal(); }}>
        <DialogContent className="max-w-md p-0">
          <form onSubmit={handleCreate}>
            <DialogHeader>
              <DialogTitle>Add location</DialogTitle>
              <DialogDescription>Create a new operating location for your enterprise.</DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4">
              <label htmlFor="new-location-name" className="mb-2 block text-sm font-medium">Location name</label>
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
              <button type="button" className="rounded-md border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50" onClick={closeModal} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50" disabled={submitting || !name.trim()}>
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
