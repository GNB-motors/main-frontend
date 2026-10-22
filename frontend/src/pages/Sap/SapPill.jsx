import { SAP_REASONS, verdictView } from './sapModel';
import './Sap.css';
export default function SapPill({
  sap,
  comparison = sap?.oneWay,
  tolerance = sap?.tolerancePct ?? 10,
}) {
  if (sap && sap.status !== 'MATCHED')
    return <span className="sap-muted">{SAP_REASONS[sap.status] || 'SAP not computed yet'}</span>;
  const view = verdictView(comparison, tolerance);
  return (
    <span className={`sap-pill sap-pill--${view.tone}`}>
      {view.text === '—' ? 'Not compared' : view.text}
    </span>
  );
}
