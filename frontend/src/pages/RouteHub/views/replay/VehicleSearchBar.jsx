import React, { useState, useRef, useEffect, useMemo } from 'react';
import Ico from '../../routeHubIcons.jsx';
import './VehicleSearchSelect.css';

export default function VehicleSearchBar({
  vehicles = [],
  selectedReg = '',
  onSelect,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

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

  useEffect(() => {
    setHighlightIdx(0);
  }, [filteredVehicles.length]);

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

  const handleSelect = (v) => {
    if (!v) return;
    onSelect?.(v.registrationNumber, v);
    setQuery('');
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
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
        handleSelect(filteredVehicles[highlightIdx]);
      }
    }
  };

  return (
    <div className="vsearch-bar-wrap" ref={containerRef} onKeyDown={handleKeyDown}>
      <label className="field vsearch-bar-field">
        <Ico n="search" s={14} className="vsearch-search-ico" />
        <input
          ref={inputRef}
          type="text"
          className="vsearch-bar-input"
          placeholder="Search vehicle number, model…"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          aria-label="Search vehicle"
        />
        {query && (
          <button
            type="button"
            className="vsearch-clear-btn"
            onClick={(e) => {
              e.preventDefault();
              setQuery('');
              setIsOpen(false);
            }}
            title="Clear search"
          >
            ×
          </button>
        )}
      </label>

      {isOpen && (
        <div className="vsearch-bar-popover">
          <div className="vsearch-meta-bar">
            <span>
              {filteredVehicles.length} vehicle{filteredVehicles.length === 1 ? '' : 's'}
              {query.trim() ? ` matching "${query.trim()}"` : ''}
            </span>
          </div>

          <div className="vsearch-list" role="listbox">
            {filteredVehicles.length === 0 ? (
              <div className="vsearch-empty">No vehicles matching &ldquo;{query}&rdquo;</div>
            ) : (
              filteredVehicles.map((v, idx) => {
                const isSelected = v.registrationNumber === selectedReg;
                const isHighlighted = idx === highlightIdx;
                return (
                  <div
                    key={v._id || v.registrationNumber}
                    role="option"
                    aria-selected={isSelected}
                    className={`vsearch-item ${isSelected ? 'vsearch-item--selected' : ''} ${
                      isHighlighted ? 'vsearch-item--highlighted' : ''
                    }`}
                    onClick={() => handleSelect(v)}
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
