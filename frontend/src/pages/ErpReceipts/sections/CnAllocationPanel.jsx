import React from 'react';
import { RefreshCw } from 'lucide-react';
import { emptyCnRow, cnLineTotal } from '../receiptAllocation';
import { money } from '../money';

function CnAllocationPanel({
  selectedBill,
  cnDraft,
  setCnDraft,
  voucherUnadjusted,
  allocatingForBill,
  remaining,
  overBill,
  overVoucher,
  busy,
  canPost,
  submitAdjustment,
  loadContext,
  selectedVoucherId,
}) {
  return (
    <>
      <h4>CN allocation — {selectedBill.billNumber}</h4>
      <div className="erp-table-wrap">
        <table className="erp-table compact">
          <thead>
            <tr>
              <th>CN</th>
              <th>Received</th>
              <th>Shortage</th>
              <th>Detention</th>
              <th>Others</th>
              <th>Label</th>
              <th>Remarks</th>
              <th>Line</th>
            </tr>
          </thead>
          <tbody>
            {(selectedBill.cns || []).map((cn) => {
              const row = cnDraft[cn.cnId] || emptyCnRow();
              return (
                <tr key={cn.cnId}>
                  <td>{cn.cnNumber}</td>
                  <td>
                    <input
                      aria-label={`Received for ${cn.cnNumber}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.amountReceived}
                      onChange={(e) =>
                        setCnDraft({
                          ...cnDraft,
                          [cn.cnId]: { ...row, amountReceived: e.target.value },
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`Shortage for ${cn.cnNumber}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.shortageDeducted}
                      onChange={(e) =>
                        setCnDraft({
                          ...cnDraft,
                          [cn.cnId]: { ...row, shortageDeducted: e.target.value },
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`Detention for ${cn.cnNumber}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.detentionDeducted}
                      onChange={(e) =>
                        setCnDraft({
                          ...cnDraft,
                          [cn.cnId]: { ...row, detentionDeducted: e.target.value },
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`Others for ${cn.cnNumber}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.othersDeducted}
                      onChange={(e) =>
                        setCnDraft({
                          ...cnDraft,
                          [cn.cnId]: { ...row, othersDeducted: e.target.value },
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`Label for ${cn.cnNumber}`}
                      value={row.othersLabel}
                      onChange={(e) =>
                        setCnDraft({
                          ...cnDraft,
                          [cn.cnId]: { ...row, othersLabel: e.target.value },
                        })
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label={`Remarks for ${cn.cnNumber}`}
                      value={row.remarks}
                      onChange={(e) =>
                        setCnDraft({
                          ...cnDraft,
                          [cn.cnId]: { ...row, remarks: e.target.value },
                        })
                      }
                    />
                  </td>
                  <td>{money(cnLineTotal(row))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="erp-alloc-foot">
        <div className="erp-alloc-cell">
          <span>Receipt available</span>
          <strong>{money(voucherUnadjusted)}</strong>
        </div>
        <div className="erp-alloc-cell">
          <span>Applying</span>
          <strong>{money(allocatingForBill)}</strong>
        </div>
        <div className={`erp-alloc-cell ${overVoucher ? 'neg' : ''}`}>
          <span>{remaining >= 0 ? 'Left unapplied' : 'Over-allocated'}</span>
          <strong>{money(remaining)}</strong>
        </div>
      </div>

      {overBill && (
        <p className="erp-alloc-warn">
          Allocation exceeds this bill&apos;s outstanding of {money(selectedBill.outstandingAmount)}
          .
        </p>
      )}
      {overVoucher && (
        <p className="erp-alloc-warn">Allocation exceeds the receipt&apos;s available balance.</p>
      )}
      {!overBill && !overVoucher && remaining > 0.001 && (
        <p className="erp-alloc-note">
          {money(remaining)} stays as a customer advance on this receipt — allocate it to another
          bill later.
        </p>
      )}

      <div className="erp-form-actions">
        <button
          type="button"
          className="erp-btn primary"
          disabled={busy || !canPost}
          onClick={submitAdjustment}
        >
          Post adjustment
        </button>
        <button type="button" className="erp-btn" onClick={() => loadContext(selectedVoucherId)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
    </>
  );
}

export default CnAllocationPanel;
