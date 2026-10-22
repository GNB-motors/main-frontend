import SapPill from './SapPill';
import { kmText, signed } from './sapModel';
export default function SapComparison({ label, reference, comparison, tolerance }) {
  return (
    <section className="sap-comparison" aria-label={`${label} SAP comparison`}>
      <div className="sap-comparison-title">
        <div>
          <h3>{label}</h3>
          <span className="sap-muted">
            {label === 'One-way' ? 'Loaded distance' : 'Loaded + return distance'}
          </span>
        </div>
        <SapPill comparison={comparison} tolerance={tolerance} />
      </div>
      <dl className="sap-comparison-metrics">
        <div>
          <dt>SAP reference</dt>
          <dd>{kmText(reference)}</dd>
        </div>
        <div>
          <dt>Actual GPS</dt>
          <dd>{kmText(comparison?.actualKm)}</dd>
        </div>
        <div>
          <dt>Difference (km)</dt>
          <dd>
            {signed(comparison?.deltaKm)}
            <small>{signed(comparison?.deltaPct, '%')}</small>
          </dd>
        </div>
      </dl>
    </section>
  );
}
