import React from 'react';
import { ArrowRight, Check, PhoneCall } from 'lucide-react';
import ErpDrawer from '../../components/Erp/ErpDrawer';
import { LIFECYCLE, money, shortDate, stageOf } from './deliveryOrder.constants';

const Row = ({ label, children }) => (
  <div className="erp-detail-row">
    <span className="erp-detail-label">{label}</span>
    <span className="erp-detail-value">{children}</span>
  </div>
);

/**
 * One delivery order, shown as a position in the pipeline rather than a record.
 *
 * The stepper is the point: three separate pages (orders, placement, trips) made
 * each one look like an endpoint, so nothing said what a DO was waiting for. The
 * step is derived from status and lifted quantity — see stageOf.
 */
const DeliveryOrderDetailDrawer = ({ order, onClose, onPlace }) => {
  if (!order) return null;

  const stage = stageOf(order);
  const lifted = order.qty > 0 ? Math.round((order.liftedQty / order.qty) * 100) : 0;
  const dead = order.status === 'CANCELLED' || order.status === 'EXPIRED';
  const placeable = order.status === 'PENDING' || order.status === 'PARTIAL';

  return (
    <ErpDrawer
      isOpen
      onClose={onClose}
      title={order.doNumber}
      subtitle={order.partyId?.name || undefined}
      maxWidth="560px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {placeable && (
            <button type="button" className="btn btn-primary" onClick={onPlace}>
              Place vehicle
              <ArrowRight size={16} />
            </button>
          )}
        </>
      }
    >
      {dead ? (
        <div className={`erp-callout ${stage.tone === 'danger' ? 'danger' : 'info'}`}>
          <div>
            <strong>{stage.label}.</strong>
            {order.cancelReason && <div style={{ marginTop: 4 }}>{order.cancelReason}</div>}
          </div>
        </div>
      ) : (
        <ol className="erp-lifecycle">
          {LIFECYCLE.map((step, idx) => {
            const state = idx < stage.step ? 'done' : idx === stage.step ? 'current' : 'todo';
            return (
              <li key={step.key} className={`erp-lifecycle-step is-${state}`}>
                <span className="erp-lifecycle-dot">
                  {state === 'done' ? <Check size={12} /> : idx + 1}
                </span>
                <span className="erp-lifecycle-label">{step.label}</span>
                {state === 'current' && (
                  <span className="erp-lifecycle-now">{stage.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="erp-detail-block">
        <Row label="Account">
          {order.partyId?.name || '—'}
          {order.partyId?.code && (
            <span className="erp-cell-muted" style={{ fontWeight: 400, marginLeft: 6 }}>
              {order.partyId.code}
            </span>
          )}
        </Row>
        <Row label="Route">
          {order.fromLocation || '—'} → {order.toLocation || '—'}
          {order.totalKm ? (
            <span className="erp-cell-muted" style={{ fontWeight: 400, marginLeft: 6 }}>
              {order.totalKm} km
            </span>
          ) : null}
        </Row>
        <Row label="Material">{order.material}</Row>
        <Row label="Quantity">
          {order.qty} {order.qtyUnit}
          {order.liftedQty > 0 && (
            <div className="erp-cell-muted" style={{ fontWeight: 400, marginTop: 4 }}>
              {order.liftedQty} lifted · {order.balanceQty} left ({lifted}%)
            </div>
          )}
        </Row>
        <Row label="Rate">
          {money(order.sbRate)}
          <span className="erp-cell-muted" style={{ fontWeight: 400, marginLeft: 6 }}>
            {order.sbRateUnit?.replace('PER_', 'per ').toLowerCase()}
            {order.rateSource === 'MANUAL' && ' · manual'}
          </span>
        </Row>
        <Row label="DO date">{shortDate(order.doDate)}</Row>
        <Row label="Expires">{shortDate(order.expiryDate)}</Row>
        {order.sourceCallTaskId && (
          <Row label="Origin">
            <PhoneCall size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />
            Confirmed on a KAM call
          </Row>
        )}
      </div>

      {order.liftedQty > 0 && !dead && (
        <div className="erp-progress-track" style={{ marginTop: 4 }}>
          <span className="erp-progress-fill" style={{ width: `${lifted}%` }} />
        </div>
      )}
    </ErpDrawer>
  );
};

export default DeliveryOrderDetailDrawer;
