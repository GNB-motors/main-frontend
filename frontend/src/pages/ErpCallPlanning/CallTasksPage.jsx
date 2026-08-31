/**
 * Call Tasks (ISOCL ERP Stage 1)
 *
 * The KAM's daily worklist. Tasks are opened overnight from the call schedule;
 * recording an outcome closes the task and, for FOLLOW_UP / NO_RESPONSE, chains
 * a fresh one onto a later date. SURE_ORDER hands off to the Stage 2 DO form.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PhoneCall, RefreshCw, Info, CheckCircle2, X, CalendarClock } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import ErpCallService from './ErpCallService';
import { CALL_OUTCOMES, OUTCOME_LABELS, OUTCOME_TONE } from './erpCall.constants';
import '../../styles/erp.css';

/** YYYY-MM-DD for <input type="date">, in the browser's local zone. */
const toDateInput = (d) => {
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

/** Only these roles may run the generate job — mirrors the route's authorize(). */
const CAN_GENERATE = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];

const CallTasksPage = () => {
  const navigate = useNavigate();
  const canGenerate = CAN_GENERATE.includes(localStorage.getItem('user_role'));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [date, setDate] = useState(toDateInput(new Date()));
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 50, totalPages: 0 });

  const [activeTask, setActiveTask] = useState(null);
  const [outcome, setOutcome] = useState('');
  const [remarks, setRemarks] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedOutcome = useMemo(
    () => CALL_OUTCOMES.find((o) => o.value === outcome) || null,
    [outcome],
  );

  const fetchTasks = useCallback(async (forDate, status, page = 1) => {
    setLoading(true);
    try {
      const res = await ErpCallService.getTasks({
        date: forDate,
        ...(status ? { status } : {}),
        page,
        limit: 50,
      });
      setTasks(res.data || []);
      setMeta(res.meta || { total: 0, page: 1, limit: 50, totalPages: 0 });
    } catch (err) {
      if (err.status === 404) {
        toast.error('Call Planning is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks(date, statusFilter);
  }, [fetchTasks, date, statusFilter]);

  /** Manual run of the nightly job — safe to press twice, it is idempotent. */
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await ErpCallService.generateTasks();
      const created = res.data?.generated?.created ?? 0;
      const closed = res.data?.closed?.closed ?? 0;
      toast.success(
        created > 0
          ? `${created} task${created === 1 ? '' : 's'} created` +
              (closed ? `, ${closed} auto-closed` : '')
          : 'No new tasks — today is already generated',
      );
      fetchTasks(date, statusFilter);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const openOutcomeModal = (task) => {
    setActiveTask(task);
    setOutcome('');
    setRemarks('');
    // Default the follow-up to tomorrow so the common case is one click.
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNextDate(toDateInput(tomorrow));
  };

  const closeOutcomeModal = () => {
    setActiveTask(null);
    setOutcome('');
    setRemarks('');
  };

  const handleSubmitOutcome = async (e) => {
    e.preventDefault();
    if (!selectedOutcome) {
      toast.error('Select an outcome');
      return;
    }
    if (selectedOutcome.needsRemark && remarks.trim().length < 3) {
      toast.error('Remarks are required for this outcome');
      return;
    }
    if (selectedOutcome.needsNextDate && !nextDate) {
      toast.error('Pick a follow-up date');
      return;
    }

    setSubmitting(true);
    try {
      const res = await ErpCallService.recordOutcome(activeTask._id, {
        outcome,
        remarks: remarks.trim() || undefined,
        // Send midday so an IST-vs-UTC shift cannot roll the date backwards.
        nextFollowUpDate: selectedOutcome.needsNextDate
          ? new Date(`${nextDate}T12:00:00`).toISOString()
          : undefined,
      });

      const draft = res.data?.doDraft;
      if (draft) {
        toast.success(`Sure order from ${draft.partyName} — opening the delivery order form`);
        closeOutcomeModal();
        // Hand off to Stage 2 with the party pre-selected.
        navigate('/erp/pipeline?tab=dos', { state: { doDraft: draft } });
        return;
      }
      if (res.data?.childTask) {
        toast.success('Outcome saved — follow-up task created');
      } else {
        toast.success('Outcome saved');
      }

      closeOutcomeModal();
      fetchTasks(date, statusFilter);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const partyName = (task) => task.partyId?.name || '—';
  const partyCode = (task) => task.partyId?.code || '';
  const kamLabel = (task) =>
    task.kamId ? `${task.kamId.firstName || ''} ${task.kamId.lastName || ''}`.trim() : '—';

  const openCount = tasks.filter((t) => t.status === 'OPEN').length;

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>Call Tasks</h1>
          <p className="erp-subtitle">
            Daily call list generated from each party&apos;s call schedule
          </p>
        </div>
        {canGenerate && (
          <div className="erp-header-actions">
            <button
              className="btn btn-secondary"
              onClick={handleGenerate}
              disabled={generating}
              title="Runs the same close + generate as the 00:05 IST job. Safe to press repeatedly."
            >
              <RefreshCw size={18} />
              {generating ? 'Generating...' : "Run Today's Job"}
            </button>
          </div>
        )}
      </div>

      <div className="erp-toolbar">
        <div className="erp-field" style={{ minWidth: 180 }}>
          <input
            type="date"
            className="erp-filter"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Task date"
          />
        </div>
        <select
          className="erp-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All tasks</option>
          <option value="OPEN">Open only</option>
          <option value="CLOSED">Closed only</option>
        </select>
        {!loading && tasks.length > 0 && (
          <span className="erp-cell-muted">
            {openCount} open · {meta.total} total
          </span>
        )}
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading call tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="erp-state">
            <PhoneCall size={48} />
            <p>No call tasks for this day</p>
            <span className="erp-cell-muted">
              Tasks appear from the party call schedule, or use Generate above.
            </span>
          </div>
        ) : (
          <div className="erp-table-scroll">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Party</th>
                  <th>KAM</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Outcome</th>
                  <th>Remarks</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td>
                      <div className="erp-cell-strong">{partyName(task)}</div>
                      {partyCode(task) && (
                        <div className="erp-cell-muted">{partyCode(task)}</div>
                      )}
                    </td>
                    <td>{kamLabel(task)}</td>
                    <td className="erp-cell-muted">{task.source}</td>
                    <td>
                      <span
                        className={`erp-badge ${task.status === 'OPEN' ? 'open' : 'neutral'}`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td>
                      {task.outcome ? (
                        <span className={`erp-badge ${OUTCOME_TONE[task.outcome] || 'neutral'}`}>
                          {OUTCOME_LABELS[task.outcome] || task.outcome}
                        </span>
                      ) : (
                        <span className="erp-cell-muted">—</span>
                      )}
                    </td>
                    <td className="erp-cell-muted">
                      {task.remarks || '—'}
                      {task.nextFollowUpDate && (
                        <div
                          className="erp-cell-muted"
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <CalendarClock size={12} />
                          {new Date(task.nextFollowUpDate).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="erp-actions">
                        {task.status === 'OPEN' ? (
                          <button
                            className="btn btn-primary"
                            onClick={() => openOutcomeModal(task)}
                          >
                            <PhoneCall size={16} />
                            Record Call
                          </button>
                        ) : (
                          <span className="erp-cell-muted">
                            {task.autoClosed ? 'Auto-closed' : 'Done'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeTask && (
        <div className="erp-modal-backdrop" onClick={closeOutcomeModal}>
          <div className="erp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h2>Record Call — {partyName(activeTask)}</h2>
              <button className="btn-icon" onClick={closeOutcomeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitOutcome}>
              <div className="erp-modal-body">
                <div className="erp-callout info">
                  <Info size={16} />
                  <span>
                    Follow Up and No Response need a reason and a next date — a new task is
                    created automatically. Sure Order opens a delivery order.
                  </span>
                </div>

                <div className="erp-field full" style={{ marginBottom: 16 }}>
                  <label>Outcome <span className="required">*</span></label>
                  <div className="erp-outcomes">
                    {CALL_OUTCOMES.map((o) => (
                      <button
                        type="button"
                        key={o.value}
                        className={`erp-outcome ${outcome === o.value ? 'selected' : ''}`}
                        onClick={() => setOutcome(o.value)}
                      >
                        {o.label}
                        <small>
                          {o.needsNextDate
                            ? 'Reason + next date'
                            : o.needsRemark
                              ? 'Reason required'
                              : 'Opens delivery order'}
                        </small>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedOutcome?.needsNextDate && (
                  <div className="erp-field full" style={{ marginBottom: 16 }}>
                    <label htmlFor="next-date">
                      Next Follow-up Date <span className="required">*</span>
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
                      Must be after today. A new task is created on this date.
                    </span>
                  </div>
                )}

                {selectedOutcome && (
                  <div className="erp-field full">
                    <label htmlFor="remarks">
                      Remarks
                      {selectedOutcome.needsRemark && <span className="required"> *</span>}
                    </label>
                    <textarea
                      id="remarks"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder={
                        selectedOutcome.needsRemark
                          ? 'Why? (required)'
                          : 'Optional notes'
                      }
                      required={selectedOutcome.needsRemark}
                    />
                  </div>
                )}

                {outcome === 'SURE_ORDER' && (
                  <div className="erp-callout success">
                    <CheckCircle2 size={16} />
                    <span>
                      Saving will return the party&apos;s credit limit and terms, ready for the
                      delivery order form.
                    </span>
                  </div>
                )}
              </div>

              <div className="erp-modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeOutcomeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || !outcome}
                >
                  {submitting ? 'Saving...' : 'Save Outcome'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallTasksPage;
