import React from 'react';

function PendingBillingTable({ pendingGroups, openParty }) {
  return (
    <div className="erp-table-wrap">
      <table className="erp-table">
        <thead>
          <tr>
            <th>Party</th>
            <th>Pending trips</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {pendingGroups.length === 0 ? (
            <tr>
              <td colSpan={3} className="erp-muted">
                No unbilled unloadings.
              </td>
            </tr>
          ) : (
            pendingGroups.map((g) => (
              <tr key={g.partyId}>
                <td>
                  {g.partyName} <span className="erp-muted">({g.partyCode})</span>
                </td>
                <td>{g.unloadings.length}</td>
                <td>
                  <button
                    type="button"
                    className="erp-btn erp-btn-primary"
                    onClick={() => openParty(g)}
                  >
                    Create bill
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default PendingBillingTable;
