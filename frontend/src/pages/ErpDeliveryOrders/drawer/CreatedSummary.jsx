import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { money, shortDate } from '../deliveryOrder.constants';
import Row from './Row';

const CreatedSummary = ({ created, party }) => (
  <>
    <div className={`erp-callout ${created.status === 'PENDING_APPROVAL' ? 'warning' : 'success'}`}>
      {created.status === 'PENDING_APPROVAL' ? (
        <AlertTriangle size={16} />
      ) : (
        <CheckCircle2 size={16} />
      )}
      <div>
        <strong>
          {created.status === 'PENDING_APPROVAL'
            ? `${created.doNumber} needs approval before it can be placed.`
            : `${created.doNumber} is ready for placement.`}
        </strong>
        <div style={{ marginTop: 4 }}>
          {created.status === 'PENDING_APPROVAL'
            ? 'It is in the approvals queue. Nothing can be placed against it until it clears.'
            : 'Place vehicles against it to start drawing the quantity down.'}
        </div>
      </div>
    </div>
    <div className="erp-detail-block">
      <Row label="Account">{created.partyId?.name || party?.name || '—'}</Row>
      <Row label="Pickup → drop">
        {created.pickupName || '—'} → {created.dropName || '—'}
      </Row>
      <Row label="Quantity">
        {created.qty} {created.qtyUnit}
      </Row>
      <Row label="Rate">
        {money(created.sbRate)}
        {created.rateSource === 'MANUAL' && (
          <span className="erp-cell-muted" style={{ fontWeight: 400, marginLeft: 6 }}>
            manual
          </span>
        )}
      </Row>
      <Row label="Expires">{shortDate(created.expiryDate)}</Row>
    </div>
  </>
);

export default CreatedSummary;
