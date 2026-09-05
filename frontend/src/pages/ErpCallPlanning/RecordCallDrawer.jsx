import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarClock, CheckCircle2, Info } from 'lucide-react';
import ErpDrawer from '../../components/Erp/ErpDrawer';
import ErpCallService from './ErpCallService';
import { CALL_OUTCOMES } from './erpCall.constants';
import { kamName, relativeDate, shortDate, taskState } from './callSchedule.utils';

/** YYYY-MM-DD for <input type="date">, in the browser's local zone. */
const toDateInput = (d) => {
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

const Row = ({ label, children }) => (
  <div className="erp-detail-row">
    <span className="erp-detail-label">{label}</span>
    <span className="erp-detail-value">{children}</span>
  </div>
);

/**
 * One call, from context to outcome to what happens next.
 *
 * Deliberately a single drawer rather than a detail drawer with a "Record call"
 * button that opens a second one: the account context — who they are, what the
 * last call produced — is exactly what a KAM needs *while* recording, not
 * instead of it. Two steps would put a click between reading the history and
 * acting on it.
 *
 * A closed task shows the same drawer with the form replaced by the result, so
 * the Completed tab is readable without a separate screen.
 */
const RecordCallDrawer = ({ task, onClose, onSaved }) => {
  const [outcome, setOutcome] = useState('');
  const [remarks, setRemarks] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const partyId = task?.partyId?._id || task?.partyId || null;
  const isOpen = task?.status === 'OPEN';

  useEffect(() => {
    if (!task) return;
    setOutcome('');
    setRemarks('');
    setResult(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNextDate(toDateInput(tomorrow));
  }, [task]);

  const fetchHistory = useCallback(async () => {
    if (!partyId) return;
    try {
      const res = await ErpCallService.getTasks({ partyId, status: 'CLOSED', limit: 3 });
      setHistory(res.data || []);
    } catch {
      // History is context, not the point of the drawer — never block on it.
      setHistory([]);
    }
  }, [partyId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const selected = useMemo(
    () => CALL_OUTCOMES.find((o) => o.value === outcome) || null,
    [outcome],
  );

  const previous = history.find((h) => h._id !== task?._id) || null;

  const valid = Boolean(
    selected
      && (!selected.needsRemark || remarks.trim().length >= 3)
      && (!selected.needsNextDate || nextDate),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!valid) return;

    setSubmitting(true);
    try {
      const res = await ErpCallService.recordOutcome(task._id, {
        outcome,
        remarks: remarks.trim() || undefined,
        // Midday so an IST-vs-UTC shift cannot roll the date back a day.
        nextFollowUpDate: selected.needsNextDate
          ? new Date(`${nextDate}T12:00:00`).toISOString()
          : undefined,
      });
      // Land on the consequence rather than a toast: "saved" tells the KAM
      // nothing about the order they just won or the task they just created.
      setResult({ outcome, ...res.data });
      onSaved();
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) return null;

  const state = taskState(task);

  return (
    <ErpDrawer
      isOpen
      onClose={onClose}
      title={task.partyId?.name || 'Call'}
      subtitle={task.partyId?.code || undefined}
      maxWidth="560px"
      footer={
        result ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            {result.doDraft && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onSaved(result.doDraft)}
              >
                Create Delivery Order
                <ArrowRight size={16} />
              </button>
            )}
          </>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {isOpen ? 'Cancel' : 'Close'}
            </button>
            {isOpen && (
              <button
                type="submit"
                form="record-call-form"
                className="btn btn-primary"
                disabled={submitting || !valid}
              >
                {submitting ? 'Saving…' : 'Save call'}
              </button>
            )}
          </>
        )
      }
    >
      <div className="erp-detail-block">
        <Row label="KAM">{kamName(task.kamId)}</Row>
        <Row label="Call date">{relativeDate(task.scheduledDate)}</Row>
        <Row label="Source">
          {task.source === 'SCHEDULE'
            ? 'Calling schedule'
            : task.source === 'FOLLOW_UP'
              ? 'Follow-up from an earlier call'
              : 'Added by hand'}
        </Row>
        {previous ? (
          <Row label="Previous call">
            {shortDate(previous.scheduledDate)}
            {' · '}
            <span className={`erp-badge ${taskState(previous).tone}`}>
              {taskState(previous).label}
            </span>
            {previous.remarks && (
              <div className="erp-cell-muted" style={{ fontWeight: 400, marginTop: 4 }}>
                {previous.remarks}
              </div>
            )}
          </Row>
        ) : (
          <Row label="Previous call">
            <span className="erp-cell-muted">First call with this account</span>
          </Row>
        )}
      </div>

      {result ? (
        <div className={`erp-callout ${result.error ? 'danger' : 'success'}`}>
          {!result.error && <CheckCircle2 size={16} />}
          <div>
            {result.error ? (
              <strong>{result.error}</strong>
            ) : (
              <>
                <strong>Call recorded.</strong>
                <div style={{ marginTop: 4 }}>
                  {result.doDraft
                    && `Order confirmed for ${result.doDraft.partyName}. Raise the delivery order to lock the rate and credit terms.`}
                  {result.childTask
                    && `Next call scheduled for ${shortDate(result.childTask.scheduledDate)} — the task is already in ${kamName(task.kamId)}'s list.`}
                  {!result.doDraft && !result.childTask && 'Task closed. No follow-up was needed.'}
                </div>
              </>
            )}
          </div>
        </div>
      ) : isOpen ? (
        <form id="record-call-form" onSubmit={handleSubmit}>
          <h3 className="erp-detail-heading">How did the call go?</h3>

          <div className="erp-outcomes">
            {CALL_OUTCOMES.map((o) => (
              <button
                type="button"
                key={o.value}
                aria-pressed={outcome === o.value}
                className={`erp-outcome ${outcome === o.value ? 'selected' : ''}`}
                onClick={() => setOutcome(o.value)}
              >
                {o.label}
                <small>{o.blurb}</small>
              </button>
            ))}
          </div>

          {selected?.needsNextDate && (
            <div className="erp-field full" style={{ marginTop: 18 }}>
              <label htmlFor="next-date">
                Next call <span className="required">*</span>
              </label>
              <input
                id="next-date"
                type="date"
                value={nextDate}
                min={toDateInput(new Date(Date.now() + 86400000))}
                onChange={(e) => setNextDate(e.target.value)}
                required
              />
              <span className="erp-field-hint">
                <CalendarClock size={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                A task for this account appears on that date automatically.
              </span>
            </div>
          )}

          {selected && (
            <div className="erp-field full" style={{ marginTop: 18 }}>
              <label htmlFor="remarks">
                {selected.needsRemark ? 'Reason' : 'Remarks'}
                {selected.needsRemark && <span className="required"> *</span>}
              </label>
              <textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  selected.needsRemark
                    ? 'What did the customer say?'
                    : 'Optional notes'
                }
                required={selected.needsRemark}
              />
              {selected.needsRemark && remarks.trim().length > 0 && remarks.trim().length < 3 && (
                <span className="erp-field-hint">A little more detail, please.</span>
              )}
            </div>
          )}

          {outcome === 'SURE_ORDER' && (
            <div className="erp-callout info" style={{ marginTop: 18, marginBottom: 0 }}>
              <Info size={16} />
              <span>
                Saving brings back this account&apos;s credit limit and terms, ready for the
                delivery order.
              </span>
            </div>
          )}
        </form>
      ) : (
        <>
          <h3 className="erp-detail-heading">Result</h3>
          <div className="erp-detail-block">
            <Row label="Outcome">
              <span className={`erp-badge ${state.tone}`}>{state.label}</span>
              {task.autoClosed && (
                <span className="erp-cell-muted" style={{ marginLeft: 8, fontWeight: 400 }}>
                  closed by the system — nobody recorded this call
                </span>
              )}
            </Row>
            <Row label="Remarks">
              {task.remarks || <span className="erp-cell-muted">—</span>}
            </Row>
            {task.nextFollowUpDate && (
              <Row label="Next call">{shortDate(task.nextFollowUpDate)}</Row>
            )}
          </div>
        </>
      )}
    </ErpDrawer>
  );
};

export default RecordCallDrawer;
