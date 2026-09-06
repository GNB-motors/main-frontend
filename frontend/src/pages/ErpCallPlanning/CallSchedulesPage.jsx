/**
 * Account Calling Schedule (ISOCL ERP Stage 1)
 *
 * Which weekdays each account gets called on, and by whom. The nightly job reads
 * this to open the day's tasks; /erp/call-tasks is where those get worked.
 *
 * Three concepts stay separate throughout, because collapsing them is what made
 * the old screen unreadable: a SCHEDULE is the recurring intent, a TASK is one
 * generated call, and an OUTCOME is how that call went. "Open" is a task status,
 * never an outcome.
 *
 * The page answers two different questions and so has two views. List is the
 * configuration — who is set up, on what cadence, when they were last reached.
 * Calendar is the operational one — "who do I call today", which the table could
 * never answer because a row of weekday chips is not a plan you can read across
 * fifty accounts.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  CalendarDays,
  List as ListIcon,
  Search,
  Pencil,
  Pause,
  Play,
  History,
  Trash2,
  PhoneCall,
  CalendarCheck,
  CircleDot,
} from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/axiosConfig';
import StatTile from '../../components/Erp/StatTile';
import RowMenu from '../../components/Erp/RowMenu';
import PageShell from '../../components/Erp/PageShell';
import ErpCallService from './ErpCallService';
import CallScheduleDrawer from './CallScheduleDrawer';
import ScheduleDetailDrawer from './ScheduleDetailDrawer';
import ScheduleCalendar from './ScheduleCalendar';
import { WEEKDAYS } from './erpCall.constants';
import { kamName, relativeDate, scheduleLabel, shortDate } from './callSchedule.utils';
import PartyService from '../ErpMasters/PartyService';
import '../../styles/erp.css';

const EMPTY_STATS = {
  activeSchedules: 0,
  pausedSchedules: 0,
  callsThisWeek: 0,
  dueToday: 0,
  completedToday: 0,
};

const CallSchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [parties, setParties] = useState([]);
  const [kams, setKams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [kamFilter, setKamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ErpCallService.getSchedules({ limit: 200 });
      setSchedules(res.data || []);
    } catch (err) {
      if (err.status === 404) {
        toast.error('Call Planning is not enabled for your organization');
      } else {
        toast.error(err.message);
      }
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await ErpCallService.getScheduleStats();
      setStats(res.data || EMPTY_STATS);
    } catch {
      setStats(EMPTY_STATS);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const res = await PartyService.getParties({ status: 'ACTIVE', limit: 200 });
      setParties(res.data || []);
    } catch {
      setParties([]);
    }
    try {
      const res = await apiClient.get('/api/employees', { params: { role: 'KAM', limit: 200 } });
      setKams(res.data?.data || []);
    } catch {
      setKams([]);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchSchedules();
    fetchStats();
  }, [fetchSchedules, fetchStats]);

  useEffect(() => {
    refresh();
    fetchOptions();
  }, [refresh, fetchOptions]);

  // Filtering client-side: the list is capped at 200 schedules, so a round trip
  // per keystroke would buy nothing but latency. The server filters exist for
  // when an org outgrows that cap.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return schedules.filter((s) => {
      if (statusFilter && s.status !== statusFilter) return false;
      if (kamFilter && (s.kamId?._id || s.kamId) !== kamFilter) return false;
      if (dayFilter !== '' && !(s.daysOfWeek || []).includes(Number(dayFilter))) return false;
      if (!q) return true;
      return (
        (s.partyId?.name || '').toLowerCase().includes(q) ||
        (s.partyId?.code || '').toLowerCase().includes(q) ||
        kamName(s.kamId).toLowerCase().includes(q)
      );
    });
  }, [schedules, search, statusFilter, kamFilter, dayFilter]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (schedule) => {
    setDetail(null);
    setEditing(schedule);
    setEditorOpen(true);
  };

  const handleSubmit = async (form) => {
    setSaving(true);
    try {
      await ErpCallService.saveSchedule({
        partyId: form.partyId,
        kamId: form.kamId,
        daysOfWeek: form.daysOfWeek,
        status: form.status,
      });
      toast.success('Calling schedule saved');
      setEditorOpen(false);
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Pause/resume goes to the status endpoint, never to saveSchedule — the latter
   * rewrites the KAM on the party master, so pausing through it would reassign
   * the account as an invisible side effect.
   */
  const handleToggleStatus = async (schedule) => {
    const next = schedule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await ErpCallService.setScheduleStatus(schedule._id, { status: next });
      toast.success(next === 'PAUSED' ? 'Schedule paused' : 'Schedule resumed');
      refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await ErpCallService.deleteSchedule(deleteTarget._id);
      toast.success('Schedule deleted');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtersActive = search || kamFilter || statusFilter || dayFilter !== '';

  return (
    <PageShell
      title="Account Calling Schedule"
      subtitle="Recurring customer follow-ups. Each calling day creates a task for the KAM."
      actions={
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={18} />
          Create Schedule
        </button>
      }
    >
      <div className="erp-stat-grid" style={{ marginTop: 20 }}>
        <StatTile
          label="Active accounts"
          value={stats.activeSchedules}
          icon={CircleDot}
          loading={loading}
          derived
        />
        <StatTile
          label="Calls planned this week"
          value={stats.callsThisWeek}
          sublabel="Schedule occurrences, not open tasks"
          icon={CalendarCheck}
          loading={loading}
          derived
        />
        <StatTile
          label="Due today"
          value={stats.dueToday}
          sublabel={stats.completedToday ? `${stats.completedToday} already logged` : null}
          sublabelTone={stats.dueToday > 0 ? 'warning' : null}
          icon={PhoneCall}
          to="/erp/call-tasks"
          cta="Open tasks"
        />
        <StatTile
          label="Paused"
          value={stats.pausedSchedules}
          sublabel={stats.pausedSchedules > 0 ? 'Generating no tasks' : null}
          icon={Pause}
          loading={loading}
          derived
        />
      </div>

      <div className="erp-toolbar">
        <div className="erp-search">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search account, code or KAM…"
          />
        </div>

        <select
          className="erp-filter"
          value={kamFilter}
          onChange={(e) => setKamFilter(e.target.value)}
          aria-label="Filter by KAM"
        >
          <option value="">All KAMs</option>
          {kams.map((k) => (
            <option key={k._id} value={k._id}>
              {k.firstName} {k.lastName}
            </option>
          ))}
        </select>

        <select
          className="erp-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>

        <select
          className="erp-filter"
          value={dayFilter}
          onChange={(e) => setDayFilter(e.target.value)}
          aria-label="Filter by call day"
        >
          <option value="">Any call day</option>
          {WEEKDAYS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.short}
            </option>
          ))}
        </select>

        <div className="erp-tabs" style={{ margin: 0, marginLeft: 'auto' }}>
          <button
            type="button"
            className={`erp-tab ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            <ListIcon size={14} /> List
          </button>
          <button
            type="button"
            className={`erp-tab ${view === 'calendar' ? 'active' : ''}`}
            onClick={() => setView('calendar')}
          >
            <CalendarDays size={14} /> Calendar
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="erp-container">
          <ScheduleCalendar schedules={filtered} onSelect={setDetail} />
        </div>
      ) : (
        <div className="erp-container">
          {loading ? (
            <div className="erp-state">
              <p>Loading schedules…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="erp-state">
              <CalendarDays size={48} />
              <p>
                {filtersActive ? 'No schedules match these filters' : 'No calling schedules yet'}
              </p>
              <span className="erp-cell-muted">
                {filtersActive
                  ? 'Clear a filter to see the rest.'
                  : 'Set a weekly calling pattern for an account and its KAM gets a task on every call day.'}
              </span>
              {!filtersActive && (
                <button className="btn btn-primary" onClick={openCreate} style={{ marginTop: 4 }}>
                  <Plus size={16} />
                  Create Schedule
                </button>
              )}
            </div>
          ) : (
            <div className="erp-table-scroll">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>KAM</th>
                    <th>Calling schedule</th>
                    <th>Next call</th>
                    <th>Last call</th>
                    <th>Status</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const paused = s.status === 'PAUSED';
                    return (
                      <tr key={s._id} className="clickable" onClick={() => setDetail(s)}>
                        <td>
                          <div className="erp-cell-strong">{s.partyId?.name || '—'}</div>
                          {s.partyId?.code && (
                            <div className="erp-cell-muted">{s.partyId.code}</div>
                          )}
                        </td>
                        <td>{kamName(s.kamId)}</td>
                        <td>
                          <div>{scheduleLabel(s.daysOfWeek)}</div>
                          <div className="erp-cell-muted">{s.daysOfWeek?.length || 0}× / week</div>
                        </td>
                        <td>
                          {s.nextCallDate ? (
                            relativeDate(s.nextCallDate)
                          ) : (
                            <span className="erp-cell-muted">Not scheduled</span>
                          )}
                        </td>
                        <td>
                          {s.lastCall ? (
                            <>
                              <div>{shortDate(s.lastCall.date)}</div>
                              <div className="erp-cell-muted">
                                {s.lastCall.outcome?.replace(/_/g, ' ').toLowerCase() || '—'}
                              </div>
                            </>
                          ) : (
                            <span className="erp-cell-muted">Never called</span>
                          )}
                        </td>
                        <td>
                          <span className={`erp-badge ${paused ? 'warning' : 'active'}`}>
                            {paused ? 'Paused' : 'Active'}
                          </span>
                          {paused && (
                            <div className="erp-cell-muted" style={{ marginTop: 2 }}>
                              {s.pausedUntil
                                ? `Resumes ${shortDate(s.pausedUntil)}`
                                : 'Creating no tasks'}
                            </div>
                          )}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <RowMenu
                            label={`Actions for ${s.partyId?.name || 'schedule'}`}
                            items={[
                              {
                                key: 'history',
                                label: 'View call history',
                                icon: History,
                                onSelect: () => setDetail(s),
                              },
                              {
                                key: 'edit',
                                label: 'Edit schedule',
                                icon: Pencil,
                                onSelect: () => openEdit(s),
                              },
                              {
                                key: 'status',
                                label: paused ? 'Resume schedule' : 'Pause schedule',
                                icon: paused ? Play : Pause,
                                onSelect: () => handleToggleStatus(s),
                              },
                              {
                                key: 'delete',
                                label: 'Delete schedule',
                                icon: Trash2,
                                tone: 'danger',
                                onSelect: () => setDeleteTarget(s),
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <CallScheduleDrawer
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSubmit={handleSubmit}
        saving={saving}
        schedule={editing}
        parties={parties}
        kams={kams}
        schedules={schedules}
      />

      {detail && (
        <ScheduleDetailDrawer schedule={detail} onClose={() => setDetail(null)} onEdit={openEdit} />
      )}

      {deleteTarget && (
        <div className="erp-modal-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="erp-modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="erp-modal-header">
              <h2>Delete schedule</h2>
            </div>
            <div className="erp-modal-body">
              <p style={{ margin: 0 }}>
                Stop generating call tasks for{' '}
                <strong>{deleteTarget.partyId?.name || 'this account'}</strong>? Tasks already
                created are kept.
              </p>
              <p className="erp-cell-muted" style={{ marginTop: 8 }}>
                To stop calls temporarily without losing the pattern, pause it instead.
              </p>
            </div>
            <div className="erp-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default CallSchedulesPage;
