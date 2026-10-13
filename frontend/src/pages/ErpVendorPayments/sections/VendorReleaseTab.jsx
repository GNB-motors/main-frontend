import React from 'react';
import { money } from '../money';

function VendorReleaseTab({ loading, pending, setReleaseTarget }) {
  return (
    <section className="erp-card">
      <h3>Approved — awaiting release</h3>
      {loading && <p>Loading…</p>}
      {!loading && pending.length === 0 && (
        <p className="erp-muted">No payments awaiting release.</p>
      )}
      {!loading && pending.length > 0 && (
        <ul className="erp-list">
          {pending.map((p) => (
            <li key={p._id}>
              <button type="button" className="erp-link-btn" onClick={() => setReleaseTarget(p)}>
                {p.paymentNumber} — {money(p.netPayable)} net ({p.billAllocations?.length} bills)
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default VendorReleaseTab;
