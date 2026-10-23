import React from 'react';
import { X, Printer, ExternalLink } from 'lucide-react';
import StatusBadge from '../../../components/Erp/StatusBadge';
import { money } from '../money';

function SaleBillDetailModal({ detail, closeModal, handlePrint, busy }) {
  return (
    <div className="erp-modal-backdrop">
      <div className="erp-modal" style={{ maxWidth: 720 }}>
        <div className="erp-modal-header">
          <h2>{detail.billNumber}</h2>
          <button type="button" className="erp-icon-btn" onClick={closeModal}>
            <X size={18} />
          </button>
        </div>
        <div className="erp-form">
          <p>
            Party: {detail.partyId?.name} · Status: <StatusBadge status={detail.status} /> · Net:{' '}
            {money(detail.netAmount)}
          </p>
          <div className="erp-table-wrap">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>CN</th>
                  <th>Vehicle</th>
                  <th>Route</th>
                  <th>Net</th>
                  <th>Bilty</th>
                </tr>
              </thead>
              <tbody>
                {(detail.lines || []).map((line) => (
                  <tr key={line.cnId || line.unloadingId}>
                    <td>{line.cnNumber}</td>
                    <td>{line.vehicleNumber}</td>
                    <td>
                      {line.fromLocation} → {line.toLocation}
                    </td>
                    <td>{money(line.lineNet)}</td>
                    <td>
                      {line.biltyUrl ? (
                        <a href={line.biltyUrl} target="_blank" rel="noreferrer">
                          <ExternalLink size={14} /> View
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {['APPROVED', 'SUBMITTED', 'PARTIALLY_PAID', 'PAID'].includes(detail.status) && (
            <button
              type="button"
              className="erp-btn erp-btn-primary"
              onClick={() => handlePrint(detail._id)}
              disabled={busy}
            >
              <Printer size={14} /> Print
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SaleBillDetailModal;
