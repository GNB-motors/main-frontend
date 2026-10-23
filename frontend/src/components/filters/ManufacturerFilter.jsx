import { useEffect, useState } from 'react';
import { getManufacturerCatalog } from '../../services/manufacturerService';
import './ManufacturerFilter.css';

export default function ManufacturerFilter({ value = '', onChange }) {
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
  return (
    <div className="manufacturer-filter">
      <label>
        <span>Manufacturer</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-busy={state === 'loading'}
        >
          <option value="">All manufacturers</option>
          {value && value !== 'UNKNOWN' && !options.some((item) => item.value === value) ? (
            <option value={value}>{value}</option>
          ) : null}
          <option value="UNKNOWN">Unclassified</option>
          {options
            .filter((item) => item.value !== 'UNKNOWN')
            .map((item) => (
              <option key={item.value} value={item.value}>
                {item.value === 'UNKNOWN' ? 'Unclassified' : item.label}
              </option>
            ))}
        </select>
      </label>
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
