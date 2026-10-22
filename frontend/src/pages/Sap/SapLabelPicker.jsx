import { useState } from 'react';
import useApi from '../../hooks/useApi';
import SapService from '../../services/SapService';
import { laneLabels } from './sapModel';
export default function SapLabelPicker({ kind, disabled, onChoose }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const q = useApi(
    (signal) => SapService.lanes({ search, page: 1, limit: 100 }, { signal }),
    [search],
    { enabled: search.trim().length > 0 },
  );
  return (
    <div className="sap-stack">
      <label>
        Search SAP sheet {kind === 'PLANT' ? 'plants' : 'destinations'}
        <input
          type="search"
          aria-label={`Search SAP sheet ${kind === 'PLANT' ? 'plants' : 'destinations'}`}
          maxLength={60}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelected('');
          }}
        />
      </label>
      {search.trim() && (
        <>
          <label>
            Sheet label
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={q.loading || !!q.error}
            >
              <option value="">{q.loading ? 'Searching…' : 'Choose a sheet label'}</option>
              {laneLabels(q.data, kind).map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {q.error && (
            <p className="sap-error" role="alert">
              Could not search labels.{' '}
              <button type="button" onClick={q.refetch}>
                Retry
              </button>
            </p>
          )}
          <button
            className="sap-btn"
            type="button"
            disabled={disabled || !selected || q.loading || !!q.error}
            onClick={() => onChoose(selected)}
          >
            Link selected label
          </button>
        </>
      )}
    </div>
  );
}
