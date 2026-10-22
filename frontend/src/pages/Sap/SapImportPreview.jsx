import { useState } from 'react';
import PlacePicker from './PlacePicker';
import { BASIS_LABEL, kmText } from './sapModel';
import { choiceValid, proposalsIn } from './sapImportModel';

const VIEWS = [
  ['ready', 'Places found'],
  ['places', 'Need places'],
  ['selected', 'Selected'],
  ['all', 'All'],
];

/** One end of a proposal: the place found for the sheet label, another candidate, or a search. */
function EndPicker({ label, end, value, onChange }) {
  const [names, setNames] = useState({});
  const candidates = end?.candidates || [];
  const chosen = value && !candidates.some((c) => c.siteId === value);
  return (
    <div className="sap-stack">
      {candidates.length > 0 && (
        <select
          aria-label={`${label} place`}
          value={chosen ? '' : value || ''}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">No place</option>
          {candidates.map((c) => (
            <option key={c.siteId} value={c.siteId}>
              {c.name || 'Unnamed place'}
            </option>
          ))}
        </select>
      )}
      {chosen && <span className="sap-muted">{names[value] || 'Chosen place'}</span>}
      <details className="sap-disclosure">
        <summary>{candidates.length ? 'Another place' : 'Choose a place'}</summary>
        <PlacePicker
          label={`Search ${label.toLowerCase()} place`}
          onChoose={(id, site) => {
            setNames((n) => ({ ...n, [id]: site?.name || 'Chosen place' }));
            onChange(id);
          }}
        />
      </details>
    </div>
  );
}

/**
 * The proposals of a sheet import, each a route SAP the person may take: its two places, which of
 * the sheet's values, and what the km pays for.
 */
export default function SapImportPreview({ preview, choices, onChange }) {
  const [view, setView] = useState(
    preview.totals?.needPlaces && !preview.totals?.ready ? 'places' : 'ready',
  );
  const shown = proposalsIn(view, preview.proposals, choices);
  const totals = preview.totals || {};
  return (
    <div className="sap-stack">
      <h3>Sheet preview</h3>
      <p className="sap-muted">
        {totals.lanes ?? 0} lanes · places found for {totals.ready ?? 0} · {totals.needPlaces ?? 0}{' '}
        need places · {totals.alreadySet ?? 0} routes already have a SAP. Nothing is saved until you
        apply.
      </p>
      <div className="sap-tabs" aria-label="Proposals">
        {VIEWS.map(([id, label]) => (
          <button
            type="button"
            key={id}
            className="sap-tab"
            aria-pressed={view === id}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="sap-scroll">
        <table className="sap-table">
          <thead>
            <tr>
              <th>Use</th>
              <th>Sheet lane</th>
              <th>Plant place</th>
              <th>Drop place</th>
              <th>SAP km</th>
              <th>Pays for</th>
              <th>Route now</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => {
              const c = choices[p.ref];
              return (
                <tr key={p.ref}>
                  <td>
                    <input
                      type="checkbox"
                      aria-label={`Use ${p.ref}`}
                      checked={Boolean(c.include)}
                      disabled={!choiceValid(c) && !c.include}
                      onChange={(e) => onChange(p.ref, { include: e.target.checked })}
                    />
                  </td>
                  <td>
                    {p.fromLabel} → {p.toLabel}
                  </td>
                  <td>
                    <EndPicker
                      label="Plant"
                      end={p.from}
                      value={c.fromSiteId}
                      onChange={(id) => onChange(p.ref, { fromSiteId: id })}
                    />
                  </td>
                  <td>
                    <EndPicker
                      label="Drop"
                      end={p.to}
                      value={c.toSiteId}
                      onChange={(id) => onChange(p.ref, { toSiteId: id })}
                    />
                  </td>
                  <td>
                    {(p.sapValues || []).length > 1 ? (
                      <select
                        aria-label={`SAP km for ${p.ref}`}
                        value={c.sapKm ?? ''}
                        onChange={(e) => onChange(p.ref, { sapKm: Number(e.target.value) })}
                      >
                        {p.sapValues.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    ) : (
                      kmText(c.sapKm)
                    )}
                  </td>
                  <td>
                    <select
                      aria-label={`Basis for ${p.ref}`}
                      value={c.basis}
                      onChange={(e) => onChange(p.ref, { basis: e.target.value })}
                    >
                      {Object.entries(BASIS_LABEL).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {p.existing
                      ? `${kmText(p.existing.sapKm)} ${BASIS_LABEL[p.existing.basis]?.toLowerCase() || ''}`
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!shown.length && <p className="sap-muted">No lanes in this view.</p>}
      {(preview.skipped || []).length > 0 && (
        <details className="sap-disclosure">
          <summary>Skipped rows · {preview.skipped.length}</summary>
          <ul>
            {preview.skipped.map((s) => (
              <li key={`${s.line}-${s.reason}`}>
                Line {s.line}: {s.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
