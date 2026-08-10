import React, { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Search, X, ChevronDown, AlertTriangle } from 'lucide-react';
import { searchEntities, getEntityById, ENTITY_LABELS } from './entityLookup.service';

/**
 * EntityPicker — pick a party / vendor / supplier / vehicle / driver by name.
 *
 * This replaces the raw Mongo `_id` text inputs that were the primary data-entry
 * mechanism on the Finance and Supplier Payments screens (one of which literally
 * read "Paste supplier _id from masters" and offered a comma-joined list of
 * names as the helper). Nobody can be expected to know an ObjectId.
 *
 * Hand-rolled rather than reusing SearchableDropdown (which filters a
 * pre-loaded array client-side, so it cannot page through a large master list)
 * or react-select (used by zero ERP pages; adding it introduces a second form
 * control language across the module).
 */
const EntityPicker = ({
  type,
  value = '',
  onChange,
  placeholder = null,
  allowClear = true,
  required = false,
  disabled = false,
  autoFocus = false,
}) => {
  const label = ENTITY_LABELS[type] || 'record';
  const listboxId = useId();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [unavailable, setUnavailable] = useState(false);

  const rootRef = useRef(null);
  const inputRef = useRef(null);

  // Hydrate an incoming id (edit forms, deep links) into a readable label.
  useEffect(() => {
    let active = true;
    if (!value) { setSelected(null); return undefined; }
    if (selected?.id === value) return undefined;
    getEntityById(type, value).then((row) => {
      if (active) setSelected(row || { id: value, name: value, code: '' });
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, type]);

  useEffect(() => {
    if (!open) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      searchEntities(type, query, { signal: controller.signal })
        .then((rows) => {
          setOptions(rows);
          setHighlight(0);
          setUnavailable(false);
        })
        .catch((err) => {
          if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
          setOptions([]);
          // Distinguish "module off" from "no matches" — see the service docblock.
          if (err.moduleUnavailable) setUnavailable(true);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, open, type]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const choose = useCallback((row) => {
    setSelected(row);
    onChange(row.id, row);
    setOpen(false);
    setQuery('');
  }, [onChange]);

  const clear = () => {
    setSelected(null);
    onChange('', null);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (open && options[highlight]) { e.preventDefault(); choose(options[highlight]); }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  // Degraded mode: the org can reach financials but not masters, so there is no
  // list to pick from. A plain id field is honest; an empty dropdown is not.
  if (unavailable) {
    return (
      <div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value, null)}
          placeholder={`Paste ${label} ID`}
          disabled={disabled}
          required={required}
        />
        <div className="erp-callout warning" style={{ marginTop: '8px', marginBottom: 0 }}>
          <AlertTriangle size={14} />
          <span>Masters module is not enabled for this organisation, so {label} search is unavailable.</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      {selected && !open ? (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            border: '1px solid #e2e8f0', borderRadius: '8px',
            padding: '8px 10px', background: disabled ? '#f8fafc' : '#fff',
            cursor: disabled ? 'not-allowed' : 'pointer', minHeight: '38px',
          }}
          onClick={() => { if (!disabled) { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); } }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(true); } }}
        >
          <span style={{ flex: 1, fontSize: '14px', color: '#1a202c' }}>
            {selected.name}
            {selected.code && <span style={{ color: '#94a3b8', marginLeft: '6px' }}>({selected.code})</span>}
          </span>
          {allowClear && !disabled && (
            <button
              type="button"
              className="btn-icon"
              onClick={(e) => { e.stopPropagation(); clear(); }}
              aria-label={`Clear selected ${label}`}
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={14} style={{ color: '#94a3b8' }} />
        </div>
      ) : (
        <div className="erp-search" style={{ width: '100%' }}>
          <Search size={16} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={open && options[highlight] ? `${listboxId}-${highlight}` : undefined}
            value={query}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder={placeholder || `Search ${label} by name or code…`}
            onFocus={() => setOpen(true)}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onKeyDown={onKeyDown}
          />
        </div>
      )}

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          style={{
            position: 'absolute', zIndex: 30, top: 'calc(100% + 4px)', left: 0, right: 0,
            maxHeight: '260px', overflowY: 'auto', margin: 0, padding: '4px',
            listStyle: 'none', background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          }}
        >
          {loading && (
            <li style={{ padding: '10px 12px', fontSize: '13px', color: '#64748b' }}>Searching…</li>
          )}
          {!loading && options.length === 0 && (
            <li style={{ padding: '10px 12px', fontSize: '13px', color: '#64748b' }}>
              {query ? `No ${label} matches “${query}”` : `No ${label} records yet`}
            </li>
          )}
          {!loading && options.map((row, idx) => (
            <li
              key={row.id}
              id={`${listboxId}-${idx}`}
              role="option"
              aria-selected={idx === highlight}
              onMouseEnter={() => setHighlight(idx)}
              onMouseDown={(e) => { e.preventDefault(); choose(row); }}
              style={{
                padding: '8px 12px', borderRadius: '6px', cursor: 'pointer',
                background: idx === highlight ? '#f0fdfa' : 'transparent',
              }}
            >
              <div style={{ fontSize: '14px', color: '#1a202c', fontWeight: 500 }}>{row.name}</div>
              {(row.code || row.meta) && (
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  {[row.code, row.meta].filter(Boolean).join(' · ')}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EntityPicker;
