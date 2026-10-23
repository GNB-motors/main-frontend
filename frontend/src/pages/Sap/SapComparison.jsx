import SapPill from './SapPill';
import { BASIS_LABEL, COMPARED_WITH, kmText, signed } from './sapModel';
/** A route SAP against the km it pays for: loaded km (one way) or loaded + return (round trip). */
export default function SapComparison({ basis = 'ONE_WAY', sapKm, comparison, tolerance }) {
  return (
    <section className="sap-comparison" aria-label="SAP comparison">
      <div className="sap-comparison-title">
        <div>
          <h3>{BASIS_LABEL[basis] || BASIS_LABEL.ONE_WAY}</h3>
          <span className="sap-muted">
            Compared with {COMPARED_WITH[basis] || COMPARED_WITH.ONE_WAY}
          </span>
        </div>
        <SapPill comparison={comparison} tolerance={tolerance} />
      </div>
      <dl className="sap-comparison-metrics">
        <div>
          <dt>SAP</dt>
          <dd>{kmText(sapKm)}</dd>
        </div>
        <div>
          <dt>Actual GPS</dt>
          <dd>{kmText(comparison?.actualKm)}</dd>
        </div>
        <div>
          <dt>Difference</dt>
          <dd>
            {signed(comparison?.deltaKm)}
            <small>{signed(comparison?.deltaPct, '%')}</small>
          </dd>
        </div>
      </dl>
    </section>
  );
}
