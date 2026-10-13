import React from 'react';
import { X } from 'lucide-react';
import { money } from '../money';
import { todayInput } from '../todayInput';

function CreateBillModal({
  selectedParty,
  closeModal,
  createBill,
  billDate,
  setBillDate,
  selectedIds,
  toggleRow,
  selectedTotal,
  busy,
}) {
  return (
    <div className="erp-modal-backdrop">
      <div className="erp-modal" style={{ maxWidth: 640 }}>
        <div className="erp-modal-header">
          <h2>Bill — {selectedParty.partyName}</h2>
          <button type="button" className="erp-icon-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={createBill} className="erp-form">
          <label>
            Bill date
            <input
              aria-label="Bill date"
              type="date"
              required
              max={todayInput()}
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
            />
          </label>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th aria-label="Select" />
                  <th>CN</th>
                  <th>Trip</th>
                  <th>Qty</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {selectedParty.unloadings.map((u) => (
                  <tr key={u.unloadingId}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Select ${u.cnNumber}`}
                        checked={selectedIds.has(u.unloadingId)}
                        onChange={() => toggleRow(u.unloadingId)}
                      />
                    </td>
                    <td>{u.cnNumber}</td>
                    <td>{u.tripNumber}</td>
                    <td>
                      {u.unloadedQty} {u.qtyUnit}
                    </td>
                    <td>{money(u.netReceivable)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            <strong>Selected total: {money(selectedTotal)}</strong>
          </p>
          <div className="erp-modal-actions">
            <button type="submit" className="erp-btn erp-btn-primary" disabled={busy}>
              {busy ? 'Creating…' : 'Create bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateBillModal;
