import { useDeferredValue, useState } from 'react';
import useApi from '../../hooks/useApi';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService';
export default function PlacePicker({ label = 'Search a place', disabled, onChoose }) {
  const [search, setSearch] = useState('');
  const [siteId, setSiteId] = useState('');
  const term = useDeferredValue(search);
  const q = useApi(
    (signal) => PlaceIntelligenceService.listSites({ q: term, limit: 50 }, { signal }),
    [term],
    { enabled: term.trim().length > 0 },
  );
  return (
    <div className="sap-stack">
      <label>
        {label}
        <input
          type="search"
          aria-label={label}
          maxLength={100}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSiteId('');
          }}
        />
      </label>
      {search.trim() && (
        <>
          <label>
            Place
            <select
              value={siteId}
              disabled={q.loading || !!q.error}
              onChange={(e) => setSiteId(e.target.value)}
            >
              <option value="">{q.loading ? 'Searching…' : 'Choose a place'}</option>
              {(q.data?.records || []).map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name || s.siteType}
                </option>
              ))}
            </select>
          </label>
          {q.error && (
            <p role="alert">
              Could not search places.{' '}
              <button type="button" onClick={q.refetch}>
                Retry
              </button>
            </p>
          )}
          <button
            type="button"
            className="sap-btn"
            disabled={disabled || search !== term || !siteId || q.loading || !!q.error}
            onClick={() => onChoose(siteId)}
          >
            Choose place
          </button>
        </>
      )}
    </div>
  );
}
