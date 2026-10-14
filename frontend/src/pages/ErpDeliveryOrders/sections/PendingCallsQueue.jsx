import { PhoneCall } from 'lucide-react';

const PendingCallsQueue = ({ pendingCalls, waitingDays, kamName, openFromCall }) => (
  <section className="erp-queue">
    <div className="erp-queue-head">
      <PhoneCall size={16} />
      <div>
        <strong>
          {pendingCalls.length} confirmed order
          {pendingCalls.length === 1 ? '' : 's'} ready to release
        </strong>
      </div>
    </div>

    <div className="erp-table-scroll">
      <table className="erp-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Material</th>
            <th>Quantity</th>
            <th>Confirmed by</th>
            <th>Waiting</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {pendingCalls.map((task) => {
            const days = waitingDays(task);
            return (
              <tr key={task._id}>
                <td>
                  <div className="erp-cell-strong">{task.partyId?.name || '—'}</div>
                  {task.partyId?.code && <div className="erp-cell-muted">{task.partyId.code}</div>}
                  {task.remarks && (
                    <div className="erp-cell-muted erp-queue-note">{task.remarks}</div>
                  )}
                </td>
                <td>{task.orderMaterial || <span className="erp-cell-muted">—</span>}</td>
                <td className="erp-numeric">
                  {task.orderQty != null ? (
                    `${task.orderQty} ${task.orderQtyUnit || ''}`
                  ) : (
                    <span className="erp-cell-muted">not captured</span>
                  )}
                </td>
                <td>{kamName(task.kamId)}</td>
                <td>
                  <span
                    className={`erp-badge ${days >= 2 ? 'danger' : days >= 1 ? 'warning' : 'success'}`}
                  >
                    {days === 0 ? 'Today' : `${days}d`}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => openFromCall(task)}
                  >
                    Create DO
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </section>
);

export default PendingCallsQueue;
