const METRICS = [
  ['rows', 'Sheet rows'],
  ['lanes', 'Unique lanes'],
  ['withConflictingSap', 'Multiple SAP values'],
  ['notInSap', 'Without SAP km'],
  ['written', 'To write'],
  ['unchanged', 'Unchanged'],
  ['superseded', 'To replace'],
  ['vanished', 'Removed from sheet'],
];
const DETAILS = [
  ['skipped', 'Skipped rows'],
  ['rejectedNumericLabels', 'Invalid place labels'],
  ['possibleDuplicates', 'Possible duplicates'],
];
export default function SapImportPreview({ result }) {
  return (
    <div className="sap-stack">
      <h3>Sheet preview</h3>
      <dl className="sap-import-stats">
        {METRICS.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>{result[key] ?? '—'}</dd>
          </div>
        ))}
      </dl>
      {DETAILS.map(([key, label]) => (
        <details className="sap-disclosure" key={key}>
          <summary>
            {label} · {result[key]?.length || 0}
          </summary>
          <ul>
            {(result[key] || []).map((item) => (
              <li key={JSON.stringify(item)}>
                {typeof item === 'string'
                  ? item
                  : Object.entries(item)
                      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                      .join(' · ')}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
