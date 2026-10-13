import React from 'react';
import { Download } from 'lucide-react';
import { money } from '../money';

function ShortageReport({ exportReport, loading, reportRows }) {
  return (
    <section className="erp-card">
      <div className="erp-page-header" style={{ marginBottom: '1rem' }}>
        <h3>Shortage & detention (party vs company)</h3>
        <button type="button" className="erp-btn" onClick={exportReport}>
          <Download size={14} /> CSV
        </button>
      </div>
      {loading && <p>Loading…</p>}
      {!loading && (
        <div className="erp-table-wrap">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Party</th>
                <th>Bill</th>
                <th>CN</th>
                <th>Co. shortage</th>
                <th>Party shortage</th>
                <th>Co. detention</th>
                <th>Party detention</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.map((r, i) => (
                <tr key={`${r.adjustmentNumber}-${r.cnNumber}-${i}`}>
                  <td>{r.adjustmentDate?.slice?.(0, 10) || '—'}</td>
                  <td>{r.partyName}</td>
                  <td>{r.billNumber}</td>
                  <td>{r.cnNumber}</td>
                  <td>{money(r.companyShortage)}</td>
                  <td>{money(r.partyShortage)}</td>
                  <td>{money(r.companyDetention)}</td>
                  <td>{money(r.partyDetention)}</td>
                  <td>{r.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ShortageReport;
