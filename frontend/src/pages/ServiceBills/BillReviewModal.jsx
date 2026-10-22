import { useCallback, useEffect, useMemo, useState } from 'react';
import ServiceBillService from '../../services/ServiceBillService';
import {
  buildFieldRows,
  buildReviewPayload,
  CONFIDENCE_BAND_LABEL,
  summariseRows,
} from './serviceBillFields';

/**
 * BillReviewModal — the photo, what the extractor claimed off it, and the
 * figure the record already holds.
 *
 * The layout is the argument: an extracted figure never appears alone. It shows
 * its confidence, and where the record disagrees it shows the record's figure
 * right next to it. There is no "apply all" and no blended value — one field,
 * one decision.
 */
const ACTIONS = [
  { key: 'ACCEPT', label: 'Use this' },
  { key: 'CORRECT', label: 'Change it' },
  { key: 'KEEP_RECORDED', label: 'Keep the record' },
  { key: 'REJECT', label: 'Not this' },
];

const BillReviewModal = ({ billId, onClose, onReviewed }) => {
  const [extraction, setExtraction] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    ServiceBillService.getBill(billId)
      .then((data) => {
        if (mounted && data) setExtraction(data);
      })
      .catch((err) => {
        if (mounted) setError(err?.message || 'Could not load this bill');
      });
    return () => {
      mounted = false;
    };
  }, [billId]);

  const rows = useMemo(() => buildFieldRows(extraction), [extraction]);
  const counts = useMemo(() => summariseRows(rows), [rows]);
  const lineItems = extraction?.lineItems || [];

  const setDecision = useCallback((field, action) => {
    setDecisions((prev) => ({ ...prev, [field]: { action } }));
  }, []);

  const submit = useCallback(async () => {
    setSaving(true);
    setError(null);
    // A CORRECT decision is only meaningful with the reviewer's own value, so
    // the typed values ride along with the action.
    const withValues = {};
    for (const [field, decision] of Object.entries(decisions)) {
      withValues[field] =
        decision.action === 'CORRECT' ? { ...decision, value: edits[field] } : decision;
    }
    try {
      await ServiceBillService.reviewBill(billId, buildReviewPayload(withValues));
      onReviewed();
    } catch (err) {
      setError(err?.message || 'Could not save the review');
    } finally {
      setSaving(false);
    }
  }, [billId, decisions, edits, onReviewed]);

  return (
    <div className="sbills-modal" role="dialog" aria-modal="true" aria-label="Review service bill">
      <div className="sbills-modal-panel">
        <header className="sbills-modal-head">
          <div>
            <h2>Service bill</h2>
            <p className="sbills-modal-sub">
              Read from a photo on{' '}
              {extraction?.createdAt ? new Date(extraction.createdAt).toLocaleString('en-IN') : '—'}.
              Every figure below is a claim until someone decides on it.
            </p>
          </div>
          <button type="button" className="pshell-btn" onClick={onClose}>
            Close
          </button>
        </header>

        {error ? <div className="sbills-error">{error}</div> : null}

        <div className="sbills-modal-body">
          <aside className="sbills-photo">
            {extraction?.sourceFile?.publicUrl ? (
              <img src={extraction.sourceFile.publicUrl} alt="The uploaded service bill" />
            ) : (
              <div className="sbills-muted">No photo</div>
            )}
            <div className="sbills-counts">
              <div>
                <strong>{counts.proposed}</strong> read
              </div>
              <div>
                <strong>{counts.blank}</strong> not read
              </div>
              <div>
                <strong>{counts.faint}</strong> faint or unreported
              </div>
              <div>
                <strong>{counts.disagreed}</strong> disagree with the record
              </div>
            </div>
          </aside>

          <div className="sbills-fields">
            <table className="sbills-fields-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Read from the bill</th>
                  <th>On the record</th>
                  <th>Decision</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.field} className={row.differs ? 'sbills-field--differs' : ''}>
                    <th scope="row">{row.label}</th>
                    <td>
                      {row.extracted ? (
                        <>
                          <span className={`sbills-amount sbills-amount--${row.band}`}>
                            {row.extracted}
                          </span>
                          <span className="sbills-source">
                            OCR · {row.confidence ?? '—'}% · {CONFIDENCE_BAND_LABEL[row.band]}
                          </span>
                        </>
                      ) : (
                        <span className="sbills-blank">{row.blankLabel}</span>
                      )}
                    </td>
                    <td>
                      {row.recorded ? (
                        <span className={row.differs ? 'sbills-recorded sbills-recorded--differs' : 'sbills-recorded'}>
                          {row.recorded}
                          <span className="sbills-source">on the record</span>
                        </span>
                      ) : (
                        <span className="sbills-muted">nothing recorded</span>
                      )}
                    </td>
                    <td>
                      {row.actionable ? (
                        <div className="sbills-decision">
                          {decisions[row.field]?.action === 'CORRECT' ? (
                            <input
                              type="text"
                              aria-label={`Corrected ${row.label}`}
                              value={edits[row.field] ?? ''}
                              onChange={(e) =>
                                setEdits((prev) => ({ ...prev, [row.field]: e.target.value }))
                              }
                            />
                          ) : null}
                          <div className="sbills-decision-buttons">
                            {ACTIONS.filter(
                              (a) => a.key !== 'KEEP_RECORDED' || row.recorded,
                            ).map((action) => (
                              <button
                                key={action.key}
                                type="button"
                                className={
                                  decisions[row.field]?.action === action.key
                                    ? 'pshell-btn pshell-btn--primary'
                                    : 'pshell-btn'
                                }
                                onClick={() => setDecision(row.field, action.key)}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="sbills-muted">{row.statusLabel}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {lineItems.length ? (
              <div className="sbills-lines">
                <h3>Lines on the bill</h3>
                <ul>
                  {lineItems.map((item, i) => (
                    <li key={`${item.description}-${i}`}>
                      <span>
                        {item.description || (item.status === 'BLANK' ? item.blankReason : '—')}
                      </span>
                      <span className="sbills-source">
                        {item.status === 'BLANK'
                          ? 'not read'
                          : `OCR · ${item.confidence ?? '—'}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <footer className="sbills-modal-foot">
          <span className="sbills-muted">
            Nothing is written to the maintenance record until you save, and the figure it held is
            kept.
          </span>
          <div>
            <button type="button" className="pshell-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="pshell-btn pshell-btn--primary"
              disabled={saving}
              onClick={submit}
            >
              {saving ? 'Saving…' : 'Save review'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default BillReviewModal;