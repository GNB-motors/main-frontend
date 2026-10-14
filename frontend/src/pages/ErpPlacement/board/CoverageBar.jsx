import { Truck, CheckCircle2, ArrowRight } from 'lucide-react';

const CoverageBar = ({
  remaining,
  order,
  fleetCeiling,
  eligible,
  externalNeeded,
  setTarget,
  required,
  navigate,
}) => (
  <div className="erp-sticky-bar">
    {remaining > 0 ? (
      <>
        <div className="erp-coverage-figures">
          {/* Three figures that subtract: remaining − available fleet =
                      gap. The earlier labels ("still required" against "your
                      fleet can cover") described the same numbers but did not
                      read as arithmetic, so a 100 KL order with 95 KL of fleet
                      looked like it needed 100 and 5 at the same time. */}
          <div>
            <span className="erp-order-figure-label">Remaining</span>
            <span className="erp-order-figure is-remaining">
              {remaining} {order.qtyUnit}
            </span>
          </div>
          <div>
            <span className="erp-order-figure-label">Available fleet</span>
            <span className="erp-order-figure is-small">
              {fleetCeiling} {order.qtyUnit}
              <span className="erp-cell-muted" style={{ fontWeight: 400 }}>
                {' '}
                · {eligible.length} tanker{eligible.length === 1 ? '' : 's'}
              </span>
            </span>
          </div>
          <div>
            <span className="erp-order-figure-label">Coverage gap</span>
            <span className="erp-order-figure is-small" style={{ color: '#b45309' }}>
              {externalNeeded} {order.qtyUnit}
            </span>
          </div>
        </div>

        <div className="erp-coverage-actions">
          {/* The gap is a number the operator should not have to work
                      out, so the button carries it and pre-fills the form. */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setTarget({ mode: 'HIRE', suggestedQty: externalNeeded })}
          >
            <Truck size={18} />
            Hire {externalNeeded} {order.qtyUnit}
          </button>
        </div>
      </>
    ) : (
      <>
        <div>
          <strong className="erp-coverage-done">
            <CheckCircle2 size={16} />
            Placement complete — {required} of {required} {order.qtyUnit} assigned
          </strong>
          <div className="erp-cell-muted">
            Every unit on {order.doNumber} has a vehicle against it.
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate('/erp/pipeline?tab=trips')}
        >
          Go to trips
          <ArrowRight size={16} />
        </button>
      </>
    )}
  </div>
);

export default CoverageBar;
