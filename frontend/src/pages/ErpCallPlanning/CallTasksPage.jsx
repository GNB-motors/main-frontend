/**
 * Call Tasks (ISOCL ERP Stage 1)
 *
 * The KAM's daily work queue, not a table of task records. It answers one
 * question — "who do I have to call today, and what happened when I did" — so
 * the page is organised around that: progress at the top, open calls by default,
 * one primary action per row, completed calls behind a tab.
 *
 * Tasks are opened overnight from the calling schedule. Recording an outcome
 * closes the task and, for FOLLOW_UP / NO_RESPONSE, chains a fresh one onto a
 * later date. SURE_ORDER hands off to the delivery-order form.
 *
 * Column sets differ per tab on purpose: an open task has no outcome and no
 * remarks yet, so showing those columns on the Open tab is four inches of
 * dashes between the account and the button the KAM came here to press.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PhoneCall, RefreshCw, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import RowMenu from '../../components/Erp/RowMenu';
import PageShell from '../../components/Erp/PageShell';
import ErpCallService from './ErpCallService';
import { getUserRole } from '../../utils/session.js';
import RecordCallDrawer from './RecordCallDrawer';
import { kamName, relativeDate, shortDate, taskState } from './callSchedule.utils';
import '../../styles/erp.css';

/** YYYY-MM-DD for <input type="date">, in the browser's local zone. */
const toDateInput = (d) => {
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
};

/** Mirrors the route's authorize() on POST /admin/generate. */
const CAN_GENERATE = ['OWNER', 'MANAGER', 'SUPER_ADMIN'];

const EMPTY_STATS = { total: 0, open: 0, closed: 0, completed: 0, notCalled: 0, overdue: 0 };

const CallTasksPage = () => {
  const canGenerate = CAN_GENERATE.includes(getUserRole());

  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [date, setDate] = useState(toDateInput(new Date()));
  const [tab, setTab] = useState('OPEN');
  const [search, setSearch] = useState('');
  const [activeTask, setActiveTask] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ErpCallService.getTasks({ date, status: tab, limit: 200 });
      setTasks(res.data || []);
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
  }, [date, tab]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await ErpCallService.getTaskStats({ date });
      setStats(res.data || EMPTY_STATS);
    } catch {
      setStats(EMPTY_STATS);
    }
  }, [date]);

  const refresh = useCallback(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Same close + generate the 00:05 IST job runs. Idempotent. */
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await ErpCallService.generateTasks();
      const created = res.data?.generated?.created ?? 0;
      const closed = res.data?.closed?.closed ?? 0;
      toast.success(
        created > 0
          ? `${created} task${created === 1 ? '' : 's'} created${closed ? `, ${closed} auto-closed` : ''}`
          : 'Nothing to create — today is already generated',
      );
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Client-side because a day's list is bounded by the number of accounts with a
  // schedule and already fully loaded; a request per keystroke would add latency
  // and nothing else.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        (t.partyId?.name || '').toLowerCase().includes(q) ||
        (t.partyId?.code || '').toLowerCase().includes(q) ||
        kamName(t.kamId).toLowerCase().includes(q),
    );
  }, [tasks, search]);

  /**
   * A recorded outcome only refreshes this page. A sure order does not open the
   * delivery-order form from here — it joins the pending queue on the delivery
   * orders page, and operations raises it there.
   */
  const handleSaved = () => refresh();

  const isToday = date === toDateInput(new Date());
  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <PageShell
      title="Call Tasks"
      subtitle={
        isToday
          ? "Today's customer calls. Record what happened on each one."
          : `Calls for ${shortDate(date)}.`
      }
      actions={
        canGenerate && (
          /* Behind a menu, not a header button: this is the nightly job run by
           hand. A KAM has no reason to press it, and one that looks like a
           primary action invites pressing it when tasks appear to be
           missing — which is a support question, not a KAM's job. */
          <RowMenu
            label="Admin actions"
            items={[
              {
                key: 'generate',
                label: generating ? 'Generating…' : "Generate today's tasks",
                icon: RefreshCw,
                onSelect: handleGenerate,
              },
            ]}
          />
        )
      }
    >
      {stats.overdue > 0 && (
        <div className="erp-callout warning" style={{ marginTop: 16 }}>
          <AlertTriangle size={16} />
          <div>
            <strong>
              {stats.overdue} call{stats.overdue === 1 ? '' : 's'} from an earlier day
              {stats.overdue === 1 ? ' is' : ' are'} still open.
            </strong>
            <div style={{ marginTop: 4 }}>
              These should have been closed overnight, so the nightly job has probably not run.
              {canGenerate && ' Run it from the menu above.'}
            </div>
          </div>
        </div>
      )}

      <div className="erp-progress-card">
        <div className="erp-progress-head">
          <div>
            <span className="erp-progress-title">{isToday ? "Today's progress" : 'Progress'}</span>
            <span className="erp-progress-count">
              {stats.completed} / {stats.total} calls recorded
            </span>
          </div>
          <div className="erp-progress-legend">
            <span>
              <b>{stats.open}</b> open
            </span>
            <span>
              <b>{stats.completed}</b> completed
            </span>
            {stats.notCalled > 0 && (
              <span className="erp-progress-missed">
                <b>{stats.notCalled}</b> not called
              </span>
            )}
          </div>
        </div>
        <div
          className="erp-progress-track"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="erp-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="erp-toolbar">
        <div className="erp-tabs" style={{ margin: 0 }}>
          <button
            type="button"
            className={`erp-tab ${tab === 'OPEN' ? 'active' : ''}`}
            onClick={() => setTab('OPEN')}
          >
            Open <span className="erp-tab-count">{stats.open}</span>
          </button>
          <button
            type="button"
            className={`erp-tab ${tab === 'CLOSED' ? 'active' : ''}`}
            onClick={() => setTab('CLOSED')}
          >
            Completed <span className="erp-tab-count">{stats.closed}</span>
          </button>
        </div>

        <div className="erp-search">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search account, code or KAM…"
          />
        </div>

        <input
          type="date"
          className="erp-filter"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          aria-label="Call date"
        />
        {!isToday && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setDate(toDateInput(new Date()))}
          >
            Today
          </button>
        )}
      </div>

      <div className="erp-container">
        {loading ? (
          <div className="erp-state">
            <p>Loading calls…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="erp-state">
            <PhoneCall size={48} />
            <p>
              {search
                ? 'No calls match that search'
                : tab === 'OPEN'
                  ? stats.total > 0
                    ? 'Every call is done'
                    : 'No calls for this day'
                  : 'Nothing recorded yet'}
            </p>
            <span className="erp-cell-muted">
              {search
                ? 'Clear the search to see the rest.'
                : tab === 'OPEN' && stats.total > 0
                  ? `All ${stats.total} recorded. Check the Completed tab for the results.`
                  : 'Calls come from each account’s calling schedule.'}
            </span>
          </div>
        ) : (
          <div className="erp-table-scroll">
            <table className="erp-table">
              <thead>
                {tab === 'OPEN' ? (
                  <tr>
                    <th>Account</th>
                    <th>KAM</th>
                    <th>Due</th>
                    <th aria-label="Actions" />
                  </tr>
                ) : (
                  <tr>
                    <th>Account</th>
                    <th>KAM</th>
                    <th>Outcome</th>
                    <th>Remarks</th>
                    <th>Next call</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {filtered.map((task) => {
                  const state = taskState(task);
                  const overdue =
                    task.status === 'OPEN' &&
                    new Date(task.scheduledDate) < new Date(new Date().setHours(0, 0, 0, 0));
                  return (
                    <tr key={task._id} className="clickable" onClick={() => setActiveTask(task)}>
                      <td>
                        <div className="erp-cell-strong">{task.partyId?.name || '—'}</div>
                        {task.partyId?.code && (
                          <div className="erp-cell-muted">{task.partyId.code}</div>
                        )}
                      </td>
                      <td>{kamName(task.kamId)}</td>

                      {tab === 'OPEN' ? (
                        <>
                          <td>
                            <span className={`erp-badge ${overdue ? 'danger' : 'warning'}`}>
                              {overdue ? 'Overdue' : 'Due today'}
                            </span>
                            {task.source === 'FOLLOW_UP' && (
                              <div className="erp-cell-muted" style={{ marginTop: 2 }}>
                                follow-up
                              </div>
                            )}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              onClick={() => setActiveTask(task)}
                            >
                              <PhoneCall size={16} />
                              Record Call
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <span className={`erp-badge ${state.tone}`}>{state.label}</span>
                            {task.autoClosed && (
                              <div className="erp-cell-muted" style={{ marginTop: 2 }}>
                                not worked
                              </div>
                            )}
                          </td>
                          <td className="erp-cell-muted">{task.remarks || '—'}</td>
                          <td>
                            {task.nextFollowUpDate ? (
                              relativeDate(task.nextFollowUpDate)
                            ) : (
                              <span className="erp-cell-muted">—</span>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeTask && (
        <RecordCallDrawer
          task={activeTask}
          onClose={() => setActiveTask(null)}
          onSaved={handleSaved}
        />
      )}
    </PageShell>
  );
};

export default CallTasksPage;
