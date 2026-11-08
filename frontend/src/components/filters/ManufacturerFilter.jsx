import SearchableSelect from '@/components/SearchableDropdown/SearchableSelect';
import { useEffect, useId, useState } from 'react';
import { getManufacturerCatalog } from '../../services/manufacturerService';
import './ManufacturerFilter.css';
export default function ManufacturerFilter({ value = '', onChange }) {
  const id = useId();
  const [options, setOptions] = useState([]);
  const [state, setState] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setState('loading');
    getManufacturerCatalog()
      .then((rows) => {
        if (active) {
          setOptions(rows);
          setState('ready');
        }
      })
      .catch(() => {
        if (active) setState('error');
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  const items = [
    {
      value: null,
      label: 'All manufacturers',
    },
    ...(value && !options.some((item) => item.value === value)
      ? [
          {
            value,
            label: value === 'UNKNOWN' ? 'Unclassified (current filter)' : value,
          },
        ]
      : []),
    ...options,
  ];
  return (
    <div className="manufacturer-filter">
      <label htmlFor={id}>Manufacturer</label>
      <SearchableSelect
        value={value || null}
        onValueChange={(next) => onChange(next || '')}
        id={id}
        className="manufacturer-filter-trigger"
        aria-busy={state === 'loading'}
        placeholder="All manufacturers"
      >
        {items.map((item) => (
          <option key={item.value ?? 'all'} value={item.value}>
            {item.label}
          </option>
        ))}
      </SearchableSelect>
      {state === 'loading' ? <small role="status">Loading manufacturers…</small> : null}
      {state === 'error' ? (
        <small role="status">
          Could not load manufacturers.{' '}
          <button type="button" onClick={() => setAttempt((n) => n + 1)}>
            Retry
          </button>
        </small>
      ) : null}
    </div>
  );
}
