import { sapNoteText, verdictView } from './sapModel';
import './Sap.css';
export default function SapPill({
  sap,
  comparison = sap?.comparison,
  tolerance = sap?.tolerancePct ?? 10,
}) {
  const text = sapNoteText(sap, comparison, tolerance);
  if (sap && sap.status && sap.status !== 'MATCHED')
    return <span className="sap-muted">{text}</span>;
  return (
    <span className={`sap-pill sap-pill--${verdictView(comparison, tolerance).tone}`}>{text}</span>
  );
}
