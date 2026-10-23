import React from 'react';
import { Info, PhoneCall } from 'lucide-react';
import { shortDate } from '../deliveryOrder.constants';
import Row from './Row';

const ConfirmedCallSummary = ({ sourceTask }) => (
  <>
    <h3 className="erp-detail-heading">
      <PhoneCall size={14} />
      Confirmed on the call
    </h3>
    <div className="erp-detail-block">
      <Row label="Account">
        {sourceTask.partyId?.name || '—'}
        {sourceTask.partyId?.code && (
          <span className="erp-cell-muted" style={{ fontWeight: 400, marginLeft: 6 }}>
            {sourceTask.partyId.code}
          </span>
        )}
      </Row>
      <Row label="Material">
        {sourceTask.orderMaterial || <span className="erp-cell-muted">not captured</span>}
      </Row>
      <Row label="Quantity">
        {sourceTask.orderQty != null ? (
          `${sourceTask.orderQty} ${sourceTask.orderQtyUnit || ''}`
        ) : (
          <span className="erp-cell-muted">not captured</span>
        )}
      </Row>
      <Row label="Confirmed by">
        {sourceTask.kamId
          ? `${sourceTask.kamId.firstName || ''} ${sourceTask.kamId.lastName || ''}`.trim()
          : '—'}
      </Row>
      <Row label="Confirmed on">{shortDate(sourceTask.closedAt || sourceTask.scheduledDate)}</Row>
      {sourceTask.remarks && <Row label="Notes">{sourceTask.remarks}</Row>}
    </div>

    {(!sourceTask.orderMaterial || sourceTask.orderQty == null) && (
      <div className="erp-callout info">
        <Info size={16} />
        <span>
          This order was confirmed before the call form captured material and quantity, so both need
          filling in below.
        </span>
      </div>
    )}
  </>
);

export default ConfirmedCallSummary;
