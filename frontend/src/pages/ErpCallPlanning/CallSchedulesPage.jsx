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
import { Plus, CalendarDays, List as ListIcon, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import PageShell from '../../components/Erp/PageShell';
import ErpCallService from './ErpCallService';
import CallScheduleDrawer from './CallScheduleDrawer';
import ScheduleDetailDrawer from './ScheduleDetailDrawer';
import ScheduleCalendar from './ScheduleCalendar';
import ScheduleStatTiles from './ScheduleStatTiles';
import ScheduleTable from './ScheduleTable';
import DeleteScheduleModal from './DeleteScheduleModal';
import { WEEKDAYS } from './erpCall.constants';
import { kamName } from './callSchedule.utils';
import PartyService from '../ErpMasters/PartyService';
import ErpMasterService from '../ErpMasters/ErpMasterService';
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
      setKams(await ErpMasterService.getKams());
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
      <ScheduleStatTiles stats={stats} loading={loading} />

      <div className="erp-toolbar">
        <div className="erp-search">
          <Search size={16} className="search-icon" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search account, code or KAM…"
            aria-label="Search schedules"
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
            <ScheduleTable
              filtered={filtered}
              setDetail={setDetail}
              openEdit={openEdit}
              handleToggleStatus={handleToggleStatus}
              setDeleteTarget={setDeleteTarget}
            />
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
        <DeleteScheduleModal
          deleteTarget={deleteTarget}
          setDeleteTarget={setDeleteTarget}
          handleDelete={handleDelete}
          saving={saving}
        />
      )}
    </PageShell>
  );
};

export default CallSchedulesPage;
