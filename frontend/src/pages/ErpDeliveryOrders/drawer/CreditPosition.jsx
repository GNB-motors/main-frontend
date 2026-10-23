import React from 'react';
import { money } from '../deliveryOrder.constants';

const CreditPosition = ({ creditInfo, willBreachCredit, orderValue }) => (
  <div className="erp-credit">
    <div className="erp-credit-head">
      <span className={`erp-badge ${willBreachCredit ? 'danger' : 'active'}`}>
        {willBreachCredit ? 'Over limit' : 'Within limit'}
      </span>
      <span className="erp-credit-figure">{money(creditInfo.available)} available</span>
    </div>
    <div className="erp-credit-detail erp-cell-muted">
      Limit {money(creditInfo.creditLimit)} · outstanding {money(creditInfo.exposure)}
      {orderValue > 0 && ` · this order ${money(orderValue)}`}
    </div>
    {willBreachCredit && (
      <div className="erp-credit-detail" style={{ color: '#b91c1c' }}>
        This order crosses the limit, so it will be created as awaiting approval and cannot be
        placed until it clears.
      </div>
    )}
  </div>
);

export default CreditPosition;
