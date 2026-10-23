import { Edit2, Trash2 } from 'lucide-react';

const formatCurrency = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');

const kamName = (party) => {
  const kam = party.kamId;
  if (!kam) return '—';
  if (typeof kam === 'string') return '—';
  return `${kam.firstName || ''} ${kam.lastName || ''}`.trim() || '—';
};

const PartiesTable = ({ parties, openEdit, handleDeactivate, saving }) => (
  <div className="erp-table-scroll">
    <table className="erp-table">
      <thead>
        <tr>
          <th>Party</th>
          <th>Code</th>
          <th>KAM</th>
          <th>Credit Limit</th>
          <th>Credit Days</th>
          <th>Status</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {parties.map((party) => (
          <tr key={party._id}>
            <td>
              <div className="erp-cell-strong">{party.name}</div>
              {party.contact?.person && (
                <div className="erp-cell-muted">{party.contact.person}</div>
              )}
            </td>
            <td className="erp-cell-muted">{party.code}</td>
            <td>{kamName(party)}</td>
            <td className="erp-numeric">{formatCurrency(party.creditLimit)}</td>
            <td className="erp-numeric">{party.creditDays ?? 0}</td>
            <td>
              <span className={`erp-badge ${party.status?.toLowerCase()}`}>{party.status}</span>
            </td>
            <td>
              <div className="erp-actions">
                <button
                  className="btn-icon"
                  onClick={() => openEdit(party)}
                  title="Edit party"
                  aria-label="Edit party"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn-icon delete"
                  onClick={() => handleDeactivate(party)}
                  disabled={party.status === 'INACTIVE' || saving}
                  title="Deactivate party"
                  aria-label="Deactivate party"
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

export default PartiesTable;
