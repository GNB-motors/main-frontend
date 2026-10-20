const AssignedPlacements = ({ placed, order, setCancelling }) => (
  <>
    <h2 className="erp-section-heading">Assigned to this order</h2>
    <div className="erp-container">
      <div className="erp-table-scroll">
        <table className="erp-table">
          <thead>
            <tr>
              <th>Placement</th>
              <th>Vehicle</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {placed.map((p) => (
              <tr key={p._id}>
                <td className="erp-cell-strong">{p.placementNumber}</td>
                <td>
                  {p.vehicleId?.registrationNumber || p.hireVehicleNumber || '—'}
                  {p.vendorId?.name && <div className="erp-cell-muted">{p.vendorId.name}</div>}
                </td>
                <td className="erp-cell-muted">
                  {p.vehicleType === 'HIRE' ? 'Hired' : 'Own fleet'}
                </td>
                <td className="erp-numeric">
                  {p.plannedQty} {order.qtyUnit}
                </td>
                <td>
                  <span
                    className={`erp-badge ${p.status === 'PENDING_APPROVAL' ? 'warning' : 'open'}`}
                  >
                    {p.status === 'PENDING_APPROVAL' ? 'Awaiting approval' : p.status}
                  </span>
                </td>
                <td>
                  {/* Not "Undo": the server needs a reason and may
                                carry empty running forward, so this reverses a
                                real operational commitment. */}
                  <button
                    type="button"
                    className="erp-inline-link"
                    onClick={() => setCancelling(p)}
                  >
                    Cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </>
);

export default AssignedPlacements;
