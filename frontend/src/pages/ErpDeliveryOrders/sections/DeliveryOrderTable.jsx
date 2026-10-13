import { money, stageOf } from '../deliveryOrder.constants';

const DeliveryOrderTable = ({ orders, setDetail }) => (
  <div className="erp-table-scroll">
    <table className="erp-table">
      <thead>
        <tr>
          <th>DO No.</th>
          <th>Account</th>
          <th>Route</th>
          <th>Material</th>
          <th>Quantity</th>
          <th>Rate</th>
          <th>Stage</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => {
          const stage = stageOf(o);
          return (
            <tr key={o._id} className="clickable" onClick={() => setDetail(o)}>
              <td className="erp-cell-strong">{o.doNumber}</td>
              <td>
                <div>{o.partyId?.name || '—'}</div>
                <div className="erp-cell-muted">
                  {new Date(o.doDate).toLocaleDateString('en-IN')}
                </div>
              </td>
              <td className="erp-cell-muted">
                {o.fromLocation} → {o.toLocation}
              </td>
              <td>{o.material}</td>
              <td className="erp-numeric">
                <div>
                  {o.qty} {o.qtyUnit}
                </div>
                {o.liftedQty > 0 && <div className="erp-cell-muted">{o.balanceQty} left</div>}
              </td>
              <td className="erp-numeric">
                {money(o.sbRate)}
                {o.rateSource === 'MANUAL' && <div className="erp-cell-muted">manual</div>}
              </td>
              <td>
                <span className={`erp-badge ${stage.tone}`}>{stage.label}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default DeliveryOrderTable;
