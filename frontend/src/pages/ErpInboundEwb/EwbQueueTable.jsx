const STATUS_TONE = {
  SUGGESTED: 'info',
  UNMATCHED: 'warning',
  LINKED: 'success',
  IGNORED: 'neutral',
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';

const EwbQueueTable = ({ rows, tripsById, openReview, handleIgnore }) => (
  <div className="erp-table-scroll">
    <table className="erp-table">
      <thead>
        <tr>
          <th>e-Way Bill</th>
          <th>Vehicle</th>
          <th>Consignor</th>
          <th>Material</th>
          <th>Suggested trip</th>
          <th>Status</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const trip = tripsById[r.matchedTripId];
          return (
            <tr key={r._id}>
              <td>
                <div className="erp-cell-strong">{r.ewbNumber}</div>
                <div className="erp-cell-muted">
                  {formatDate(r.ewbDate)}
                  {r.validUpto ? ` · valid to ${formatDate(r.validUpto)}` : ''}
                </div>
              </td>
              <td>
                <div className="erp-cell-strong">{r.vehicleNumber || '—'}</div>
                {r.docType && <div className="erp-cell-muted">{r.docType}</div>}
              </td>
              <td>
                <div className="erp-cell-muted">{r.generatorGstin || '—'}</div>
                {r.sourceInvoiceNumber && (
                  <div className="erp-cell-muted">{r.sourceInvoiceNumber}</div>
                )}
              </td>
              <td>
                <div className="erp-cell-strong">{r.material || '—'}</div>
                <div className="erp-cell-muted erp-numeric">
                  {r.qty || 0} {r.qtyUnit || ''}
                </div>
              </td>
              <td>
                {trip ? (
                  <>
                    <div className="erp-cell-strong">{trip.tripNumber}</div>
                    <div className="erp-cell-muted">{trip.state}</div>
                  </>
                ) : (
                  <span className="erp-cell-muted">
                    {r.matchedTripId ? 'Trip not in view' : 'No match'}
                  </span>
                )}
              </td>
              <td>
                <span className={`erp-badge ${STATUS_TONE[r.matchStatus] || 'neutral'}`}>
                  {r.matchStatus}
                </span>
              </td>
              <td>
                <div className="erp-actions">
                  {r.matchStatus === 'LINKED' ? (
                    <span className="erp-cell-muted">Linked</span>
                  ) : (
                    <>
                      <button className="btn btn-primary" onClick={() => openReview(r)}>
                        Review
                      </button>
                      <button className="btn btn-secondary" onClick={() => handleIgnore(r)}>
                        Ignore
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default EwbQueueTable;
