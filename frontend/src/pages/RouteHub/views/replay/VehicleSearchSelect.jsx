import React, { useState, useRef, useEffect, useMemo } from 'react';
import Ico from '../../routeHubIcons.jsx';
import './VehicleSearchSelect.css';

export default function VehicleSearchSelect({
  vehicles = [],
  value = '',
  onChange,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.registrationNumber === value),
    [vehicles, value],
  );

  const filteredVehicles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter(
      (v) =>
        v.registrationNumber?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.chassisNumber?.toLowerCase().includes(q) ||
        v.manufacturer?.toLowerCase().includes(q),
    );
  }, [vehicles, query]);

  // Reset highlight index when filtered list changes
  useEffect(() => {
    setHighlightIdx(0);
  }, [filteredVehicles.length]);

  // Auto-focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const onMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', onMouseDown);
      return () => document.removeEventListener('mousedown', onMouseDown);
    }
  }, [isOpen]);

  const selectVehicle = (v) => {
    if (!v) return;
    onChange?.(v.registrationNumber, v);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev + 1 < filteredVehicles.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx((prev) => (prev > 0 ? prev - 1 : filteredVehicles.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredVehicles[highlightIdx]) {
        selectVehicle(filteredVehicles[highlightIdx]);
      }
    }
  };

  return (
    <div className="vsearch-select" ref={containerRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={`vsearch-trigger ${isOpen ? 'vsearch-trigger--open' : ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Ico n="truck" s={14} className="vsearch-truck-ico" />
        <span className="vsearch-trigger-text">
          {selectedVehicle ? (
            <>
              <strong className="vsearch-plate">{selectedVehicle.registrationNumber}</strong>
              {selectedVehicle.model && (
                <span className="vsearch-model"> · {selectedVehicle.model}</span>
              )}
            </>
          ) : value ? (
            <strong className="vsearch-plate">{value}</strong>
          ) : (
            <span className="vsearch-placeholder">Select or search vehicle…</span>
          )}
        </span>
        <Ico n="chevDown" s={14} className={`vsearch-chev ${isOpen ? 'vsearch-chev--open' : ''}`} />
      </button>

      {isOpen && (
        <div className="vsearch-popover">
          <div className="vsearch-input-wrap">
            <Ico n="search" s={14} className="vsearch-search-ico" />
            <input
              ref={inputRef}
              type="text"
              className="vsearch-input"
              placeholder="Search vehicle number, model…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search vehicle"
            />
            {query && (
              <button
                type="button"
                className="vsearch-clear-btn"
                onClick={() => setQuery('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="vsearch-meta-bar">
            <span>
              {filteredVehicles.length} vehicle{filteredVehicles.length === 1 ? '' : 's'}
              {query.trim() ? ` matching "${query.trim()}"` : ''}
            </span>
          </div>

          <div className="vsearch-list" ref={listRef} role="listbox">
            {filteredVehicles.length === 0 ? (
              <div className="vsearch-empty">No vehicles matching &ldquo;{query}&rdquo;</div>
            ) : (
              filteredVehicles.map((v, idx) => {
                const isSelected = v.registrationNumber === value;
                const isHighlighted = idx === highlightIdx;
                return (
                  <div
                    key={v._id || v.registrationNumber}
                    role="option"
                    aria-selected={isSelected}
                    className={`vsearch-item ${isSelected ? 'vsearch-item--selected' : ''} ${
                      isHighlighted ? 'vsearch-item--highlighted' : ''
                    }`}
                    onClick={() => selectVehicle(v)}
                    onMouseEnter={() => setHighlightIdx(idx)}
                  >
                    <div className="vsearch-item-main">
                      <span className="vsearch-item-plate">{v.registrationNumber}</span>
                      {v.model && <span className="vsearch-item-model">· {v.model}</span>}
                    </div>
                    {v.manufacturer && <span className="vsearch-item-mfg">{v.manufacturer}</span>}
                    {isSelected && <Ico n="checkS" s={14} className="vsearch-item-check" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
