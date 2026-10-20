import React from 'react';
import { money } from '../money';

function SupplierReleaseTab({ loading, pending, setReleaseTarget }) {
  return (
    <section className="erp-card">
      <h3>Approved supplier payments</h3>
      {loading && <p>Loading…</p>}
      {!loading && pending.length === 0 && (
        <p className="erp-muted">No approved supplier payments awaiting release.</p>
      )}
      {!loading && pending.length > 0 && (
        <ul className="erp-list">
          {pending.map((p) => (
            <li key={p._id}>
              <button type="button" className="erp-link-btn" onClick={() => setReleaseTarget(p)}>
                {p.paymentNumber} — {money(p.netPayable)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default SupplierReleaseTab;
