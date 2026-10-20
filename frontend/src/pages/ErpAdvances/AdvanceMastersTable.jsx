import { Trash2 } from 'lucide-react';

const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const AdvanceMastersTable = ({ tab, rows, handleDelete, saving }) => (
  <div className="erp-table-scroll">
    <table className="erp-table">
      <thead>
        {tab === 'mileage' ? (
          <tr>
            <th>Model</th>
            <th>Route</th>
            <th>Load State</th>
            <th>km/L</th>
            <th aria-label="Actions" />
          </tr>
        ) : tab === 'fuel' ? (
          <tr>
            <th>State</th>
            <th>Rate</th>
            <th>Effective</th>
            <th>Source</th>
            <th aria-label="Actions" />
          </tr>
        ) : (
          <tr>
            <th>Route</th>
            <th>Model</th>
            <th>Servicing</th>
            <th>Borders</th>
            <th>Misc</th>
            <th aria-label="Actions" />
          </tr>
        )}
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r._id}>
            {tab === 'mileage' ? (
              <>
                <td className="erp-cell-strong">{r.vehicleModel}</td>
                <td className="erp-cell-muted">{r.routeId?.name || 'Any route'}</td>
                <td>
                  <span className={`erp-badge ${r.loadType === 'LOAD' ? 'open' : 'neutral'}`}>
                    {r.loadType}
                  </span>
                </td>
                <td className="erp-numeric erp-cell-strong">{r.kmPerLitre}</td>
              </>
            ) : tab === 'fuel' ? (
              <>
                <td className="erp-cell-strong">{r.state}</td>
                <td className="erp-numeric erp-cell-strong">₹{r.rate}</td>
                <td className="erp-numeric erp-cell-muted">
                  {new Date(r.effectiveDate).toLocaleDateString('en-IN')}
                </td>
                <td>
                  <span className="erp-badge neutral">{r.source}</span>
                </td>
              </>
            ) : (
              <>
                <td className="erp-cell-strong">{r.routeId?.name || '—'}</td>
                <td className="erp-cell-muted">{r.vehicleModel || 'Any model'}</td>
                <td className="erp-numeric">{money(r.servicingAmount)}</td>
                <td className="erp-numeric">{money(r.bordersAmount)}</td>
                <td className="erp-numeric">{money(r.miscAmount)}</td>
              </>
            )}
            <td>
              <div className="erp-actions">
                <button
                  className="btn-icon delete"
                  onClick={() => handleDelete(r)}
                  disabled={saving}
                  title="Remove"
                  aria-label="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default AdvanceMastersTable;
