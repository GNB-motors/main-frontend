import { money, dateLabel } from './boardFormat';

const OrderRequirementCard = ({ order, remaining, done, required, pct }) => (
  <section className="erp-order-card">
    <div className="erp-order-card-head">
      <div>
        <div className="erp-order-card-party">{order.partyId?.name || '—'}</div>
        <div className="erp-cell-muted">
          {order.doNumber} · {order.fromLocation || '—'} → {order.toLocation || '—'} ·{' '}
          {order.material} · sale rate {money(order.sbRate)}
          {order.sbRateUnit ? `/${order.sbRateUnit.replace('PER_', '')}` : ''}
        </div>
      </div>
      <span className={`erp-badge ${remaining === 0 ? 'success' : done > 0 ? 'purple' : 'info'}`}>
        {remaining === 0 ? 'Fully placed' : done > 0 ? 'Partially placed' : 'Ready for placement'}
      </span>
    </div>

    <div className="erp-order-card-figures">
      <div>
        <span className="erp-order-figure-label">Required</span>
        <span className="erp-order-figure">
          {required} {order.qtyUnit}
        </span>
      </div>
      <div>
        <span className="erp-order-figure-label">Placed</span>
        <span className="erp-order-figure">
          {done} {order.qtyUnit}
        </span>
      </div>
      <div>
        <span className="erp-order-figure-label">Remaining</span>
        <span className="erp-order-figure is-remaining">
          {remaining} {order.qtyUnit}
        </span>
      </div>
      {order.expiryDate && (
        <div>
          <span className="erp-order-figure-label">Expires</span>
          <span className="erp-order-figure is-small">{dateLabel(order.expiryDate)}</span>
        </div>
      )}
    </div>

    <div className="erp-progress-track">
      <span className="erp-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  </section>
);

export default OrderRequirementCard;
