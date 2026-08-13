import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { MapPin, ChevronDown, Check, Plus, X } from 'lucide-react';
import { useActiveBranch } from '../contexts/BranchContext.jsx';
import { useFeatureFlags } from '../contexts/FeatureFlagsContext.jsx';
import { BranchService } from '../services/branchService';
import { getFirstNavPath } from '../utils/sideNavUtils.js';
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
 * Owners/managers get a "＋ Add location" shortcut at the bottom of the dropdown,
 * so a location can be created without leaving the current screen; the new one is
 * selected immediately. The control is shown for owners/managers even with no
 * locations yet (so they can add the first); for everyone else it hides until the
 * business has at least one location.
 */
const ALL_LOCATIONS = '__ALL__';

const LocationSwitcher = () => {
  const { branchId, branches, activeBranch, loading, setBranch, refresh } = useActiveBranch();
  const { isEnabled } = useFeatureFlags();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef(null);

  const canManage = ['OWNER', 'MANAGER'].includes(localStorage.getItem('user_role'));

  useEffect(() => {
    if (!open) return undefined;
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setAdding(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // Hide only for non-managers with no locations. Owners/managers keep the control
  // (even at zero) so they can add the first location from here.
  if (loading) return null;
  const hasBranches = Array.isArray(branches) && branches.length >= 1;
  if (!hasBranches && !canManage) return null;

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
    if (changed) window.location.assign(getFirstNavPath(isEnabled));
  };

  const choose = (value) => {
    switchTo(value === ALL_LOCATIONS ? null : value);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const created = await BranchService.createBranch({ name: trimmed });
      await refresh(); // reload the list so the new location is present
      setName('');
      setAdding(false);
      if (created?._id) {
        toast.success(`Location "${trimmed}" added`);
        switchTo(String(created._id)); // switch to it → lands on first sidebar page + reload
        return;
      }
      setOpen(false);
      toast.success(`Location "${trimmed}" added`);
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
              {adding ? (
                <li className="location-switcher-addrow" onClick={(e) => e.stopPropagation()}>
                  <form className="location-switcher-addform" onSubmit={handleCreate}>
                    <input
                      className="location-switcher-input"
                      type="text"
                      value={name}
                      autoFocus
                      maxLength={80}
                      placeholder="New location name"
                      disabled={submitting}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') { setAdding(false); setName(''); }
                      }}
                    />
                    <button
                      type="submit"
                      className="location-switcher-iconbtn save"
                      disabled={submitting || !name.trim()}
                      title="Save location"
                    >
                      <Check size={15} />
                    </button>
                    <button
                      type="button"
                      className="location-switcher-iconbtn"
                      disabled={submitting}
                      title="Cancel"
                      onClick={() => { setAdding(false); setName(''); }}
                    >
                      <X size={15} />
                    </button>
                  </form>
                </li>
              ) : (
                <li
                  className="location-switcher-item location-switcher-add"
                  onClick={(e) => { e.stopPropagation(); setAdding(true); }}
                >
                  <span className="location-switcher-add-label">
                    <Plus size={15} /> Add location
                  </span>
                </li>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  );
};

export default LocationSwitcher;
