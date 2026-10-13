import { Truck, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { dateLabel } from './boardFormat';

/** Whole days until a DO expires; negative once it has. */
const daysToExpiry = (o) =>
  o.expiryDate
    ? Math.ceil(
        (new Date(o.expiryDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000,
      )
    : null;

const OrderQueue = ({
  orders,
  untouched,
  started,
  queueSearch,
  setQueueSearch,
  queue,
  awaitingApproval,
  setSelectedDoId,
  notShown,
  PAGE,
  visible,
  setShowEveryRow,
}) => (
  <>
    <h2 className="erp-section-heading">
      {orders.length} order{orders.length === 1 ? '' : 's'} awaiting placement
      {orders.length > 0 && (
        <>
          <span className="erp-badge info">{untouched} not started</span>
          {started > 0 && <span className="erp-badge purple">{started} partly placed</span>}
        </>
      )}
    </h2>

    {orders.length > 3 && (
      <div className="erp-toolbar" style={{ marginTop: 0 }}>
        <div className="erp-search">
          <input
            type="search"
            value={queueSearch}
            onChange={(e) => setQueueSearch(e.target.value)}
            placeholder="Search order, customer or material…"
            aria-label="Search orders"
            style={{ paddingLeft: 14 }}
          />
        </div>
      </div>
    )}

    <div className="erp-container">
      {queue.length === 0 ? (
        <div className="erp-state">
          <Truck size={48} />
          <p>
            {queueSearch
              ? 'Nothing matches that search'
              : awaitingApproval.length > 0
                ? 'Nothing to place yet'
                : 'Nothing to place'}
          </p>
          <span className="erp-cell-muted">
            {queueSearch
              ? 'Clear the search to see the rest.'
              : awaitingApproval.length > 0
                ? `${awaitingApproval.length} order${awaitingApproval.length === 1 ? ' is' : 's are'} waiting on approval below. They move into this queue once approved.`
                : 'Orders arrive here once a delivery order is raised and approved.'}
          </span>
        </div>
      ) : (
        <div className="erp-table-scroll">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Route</th>
                <th>Requirement</th>
                <th>Expires</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {queue.map((o) => {
                const left = o.balanceQty || 0;
                const total = o.qty || 0;
                const placedQty = Math.max(0, total - left);
                const dte = daysToExpiry(o);
                const urgent = dte !== null && dte <= 1;
                return (
                  <tr key={o._id} className="clickable" onClick={() => setSelectedDoId(o._id)}>
                    <td>
                      <div className="erp-cell-strong">{o.partyId?.name || '—'}</div>
                      <div className="erp-cell-muted">
                        {o.doNumber} · {o.material}
                      </div>
                    </td>
                    <td className="erp-cell-muted">
                      {o.fromLocation || '—'} → {o.toLocation || '—'}
                    </td>
                    <td>
                      <div>
                        {placedQty} / {total} {o.qtyUnit}
                      </div>
                      <div className="erp-progress-track" style={{ marginTop: 4, height: 5 }}>
                        <span
                          className="erp-progress-fill"
                          style={{ width: `${total > 0 ? (placedQty / total) * 100 : 0}%` }}
                        />
                      </div>
                    </td>
                    <td>
                      {dte === null ? (
                        <span className="erp-cell-muted">—</span>
                      ) : (
                        <span
                          className={`erp-badge ${urgent ? 'danger' : dte <= 3 ? 'warning' : 'neutral'}`}
                        >
                          {urgent && <AlertTriangle size={11} />}
                          {dte < 0
                            ? 'expired'
                            : dte === 0
                              ? 'today'
                              : dte === 1
                                ? 'tomorrow'
                                : `${dte} days`}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setSelectedDoId(o._id)}
                      >
                        {placedQty > 0 ? 'Continue' : 'Start placement'}
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {notShown > 0 && (
            <div className="erp-more-row">
              <span className="erp-cell-muted">
                Showing the {PAGE} most useful of {visible.length}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowEveryRow(true)}
              >
                Show all {visible.length}
              </button>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Awaiting approval. Read-only by design: these orders exist, so the
              board must account for them, but nothing here can be placed until
              an approver releases them. No row click, no placement button. */}
    {awaitingApproval.length > 0 && (
      <>
        <h2 className="erp-section-heading">
          {awaitingApproval.length} order{awaitingApproval.length === 1 ? '' : 's'} awaiting
          approval
          <span className="erp-badge warning">
            <Clock size={11} />
            not placeable yet
          </span>
        </h2>

        <div className="erp-container">
          <div className="erp-table-scroll">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Route</th>
                  <th>Requirement</th>
                  <th>Raised</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {awaitingApproval.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <div className="erp-cell-strong">{o.partyId?.name || '—'}</div>
                      <div className="erp-cell-muted">
                        {o.doNumber} · {o.material}
                      </div>
                    </td>
                    <td className="erp-cell-muted">
                      {o.fromLocation || '—'} → {o.toLocation || '—'}
                    </td>
                    <td>
                      {o.qty} {o.qtyUnit}
                    </td>
                    <td className="erp-cell-muted">{dateLabel(o.doDate || o.createdAt)}</td>
                    <td>
                      <span className="erp-badge warning">
                        <Clock size={11} />
                        Approval pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    )}
  </>
);

export default OrderQueue;
