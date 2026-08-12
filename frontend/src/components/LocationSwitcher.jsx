import React, { useEffect, useRef, useState } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { useActiveBranch } from '../contexts/BranchContext.jsx';
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
 * Hidden when the business has one location or none — single-location businesses
 * see no change.
 */
const ALL_LOCATIONS = '__ALL__';

const LocationSwitcher = () => {
  const { branchId, branches, activeBranch, loading, setBranch } = useActiveBranch();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  // No locations defined yet → nothing to switch; everything is enterprise-level.
  if (loading || !branches || branches.length < 1) return null;

  const currentLabel = activeBranch ? activeBranch.name : 'All locations';
  const selectedValue = branchId || ALL_LOCATIONS;

  const choose = (value) => {
    setBranch(value === ALL_LOCATIONS ? null : value);
    setOpen(false);
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
          <li className="location-switcher-divider" role="separator" />
          {branches.map((b) => (
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
        </ul>
      )}
    </div>
  );
};

export default LocationSwitcher;
