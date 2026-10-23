import React from 'react';
import { money } from '../money';

function SubmissionTab({ submissionGroups, openSubmit, openReceive }) {
  return (
    <div>
      {submissionGroups.length === 0 ? (
        <p className="erp-muted">No approved bills awaiting submission.</p>
      ) : (
        submissionGroups.map((g) => (
          <div key={g.partyId} className="erp-callout" style={{ marginBottom: 16 }}>
            <h3>
              {g.partyName} <span className="erp-muted">({g.partyCode})</span>
            </h3>
            {g.notSent?.length > 0 && (
              <>
                <h4>Not sent yet</h4>
                <div className="erp-table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Bill #</th>
                        <th>Date</th>
                        <th>Net</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {g.notSent.map((b) => (
                        <tr key={b.billId}>
                          <td>{b.billNumber}</td>
                          <td>
                            {b.billDate ? new Date(b.billDate).toLocaleDateString('en-IN') : '—'}
                          </td>
                          <td>{money(b.netAmount)}</td>
                          <td>
                            <button
                              type="button"
                              className="erp-btn erp-btn-primary"
                              onClick={() => openSubmit(b)}
                            >
                              Submit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {g.waitingAcknowledgement?.length > 0 && (
              <>
                <h4>Sent — waiting for party acknowledgement</h4>
                <div className="erp-table-wrap">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Bill #</th>
                        <th>Submitted</th>
                        <th>Ageing</th>
                        <th>Courier</th>
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {g.waitingAcknowledgement.map((b) => (
                        <tr key={b.billId}>
                          <td>{b.billNumber}</td>
                          <td>
                            {b.submittedDate
                              ? new Date(b.submittedDate).toLocaleDateString('en-IN')
                              : '—'}
                          </td>
                          <td>{b.ageingDays ?? 0} days</td>
                          <td>{b.courierDocket || b.deliveryMode || '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="erp-btn erp-btn-primary"
                              onClick={() => openReceive(b)}
                            >
                              Mark received
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default SubmissionTab;
