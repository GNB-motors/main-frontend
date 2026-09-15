import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ErpCallService from './ErpCallService';
import {
  addDays, dayKey, isSameDay, kamInitials, kamName, startOfWeek, taskState,
} from './callSchedule.utils';

const WEEK_LENGTH = 7;

/**
 * The week a KAM actually works, rather than the configuration that produces it.
 *
 * Two sources, deliberately: the plan for every day comes from the schedules
 * (a weekday repeats every week, so no query is needed), while the outcome comes
 * from CallTasks — which exist only for days the cron has already run. So future
 * days show intent, past days show what happened, and today shows both.
 */
const ScheduleCalendar = ({ schedules = [], onSelect }) => {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [tasks, setTasks] = useState([]);

  const days = useMemo(
    () => Array.from({ length: WEEK_LENGTH }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const fetchTasks = useCallback(async () => {
    try {
      const res = await ErpCallService.getTasks({
        from: days[0].toISOString(),
        to: days[WEEK_LENGTH - 1].toISOString(),
        limit: 200,
      });
      setTasks(res.data || []);
    } catch {
      // Outcomes are an overlay on the plan. If they fail to load the plan is
      // still the answer to "who do I call this week", so render it regardless.
      setTasks([]);
    }
  }, [days]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // { '<dayKey>|<partyId>': task } — the unique index guarantees one per pair.
  const taskIndex = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      map.set(`${dayKey(t.scheduledDate)}|${t.partyId?._id || t.partyId}`, t);
    });
    return map;
  }, [tasks]);

  const byDay = useMemo(
    () =>
      days.map((day) => {
        const dow = day.getDay();
        const entries = schedules
          .filter((s) => s.status === 'ACTIVE' && (s.daysOfWeek || []).includes(dow))
          .map((s) => {
            const task = taskIndex.get(`${dayKey(day)}|${s.partyId?._id || s.partyId}`) || null;
            return { schedule: s, task, state: taskState(task) };
          })
          .sort((a, b) =>
            (a.schedule.partyId?.name || '').localeCompare(b.schedule.partyId?.name || ''),
          );
        return { day, entries };
      }),
    [days, schedules, taskIndex],
  );

  const label = `${days[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${days[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
  const thisWeek = isSameDay(weekStart, startOfWeek(new Date()));

  return (
    <div className="erp-calendar">
      <div className="erp-calendar-nav">
        <button
          type="button"
          className="btn-icon"
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          aria-label="Previous week"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="erp-calendar-range">{label}</span>
        <button
          type="button"
          className="btn-icon"
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          aria-label="Next week"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={thisWeek}
          onClick={() => setWeekStart(startOfWeek(new Date()))}
        >
          Today
        </button>
      </div>

      <div className="erp-calendar-grid">
        {byDay.map(({ day, entries }) => {
          const today = isSameDay(day, new Date());
          return (
            <div key={day.toISOString()} className={`erp-calendar-day ${today ? 'is-today' : ''}`}>
              <div className="erp-calendar-day-head">
                <span className="erp-calendar-dow">
                  {day.toLocaleDateString('en-IN', { weekday: 'short' })}
                </span>
                <span className="erp-calendar-date">{day.getDate()}</span>
                {entries.length > 0 && (
                  <span className="erp-calendar-count">{entries.length}</span>
                )}
              </div>

              <div className="erp-calendar-day-body">
                {entries.length === 0 ? (
                  <span className="erp-calendar-empty">—</span>
                ) : (
                  entries.map(({ schedule, state }) => (
                    <button
                      type="button"
                      key={schedule._id}
                      className={`erp-calendar-item tone-${state.tone}`}
                      onClick={() => onSelect(schedule)}
                      title={`${schedule.partyId?.name} · ${kamName(schedule.kamId)} · ${state.label}`}
                    >
                      <span className="erp-calendar-item-top">
                        <span className="erp-calendar-item-name">
                          {schedule.partyId?.name || '—'}
                        </span>
                        <span className="erp-calendar-item-kam">
                          {kamInitials(schedule.kamId)}
                        </span>
                      </span>
                      <span className={`erp-calendar-item-state tone-${state.tone}`}>
                        {state.label}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="erp-calendar-legend">
        {[
          { label: 'Scheduled', tone: 'neutral', hint: 'planned, task not created yet' },
          { label: 'Open', tone: 'info', hint: 'task waiting to be worked' },
          { label: 'Sure Order', tone: 'success' },
          { label: 'Follow Up', tone: 'warning' },
          { label: 'No Order', tone: 'danger' },
        ].map((l) => (
          <span key={l.label} className="erp-calendar-legend-item">
            <i className={`erp-calendar-swatch tone-${l.tone}`} />
            {l.label}
            {l.hint && <span className="erp-cell-muted">— {l.hint}</span>}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ScheduleCalendar;
