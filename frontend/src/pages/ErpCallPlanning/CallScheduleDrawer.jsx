import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import ErpDrawer from '../../components/Erp/ErpDrawer';
import { WEEKDAYS } from './erpCall.constants';
import { dayLabel, kamName } from './callSchedule.utils';

const EMPTY = { partyId: '', kamId: '', daysOfWeek: [], status: 'ACTIVE' };

const EVERY_DAY = [1, 2, 3, 4, 5, 6, 0];
const WORKING_DAYS = [1, 2, 3, 4, 5];

/**
 * Calling pattern is UI-only — there is no `frequency` field on the model and
 * there must not be one, or the stored pattern and the stored days could
 * disagree about what actually gets generated. The pattern picks the days; the
 * days are the single source of truth.
 *
 * The earlier version showed the presets AND the full seven-day strip at all
 * times, which read as two controls for one decision: choosing "Once a week"
 * left you staring at seven unselected buttons with no hint that you now had to
 * pick one. Each pattern here owns its follow-up question, and Daily/Weekdays
 * have none because the days are implied by the name.
 */
const PATTERNS = [
  { key: 'daily', label: 'Daily', days: EVERY_DAY, picker: 'none' },
  { key: 'weekdays', label: 'Weekdays', days: WORKING_DAYS, picker: 'none' },
  { key: 'weekly', label: 'Weekly', days: [1], picker: 'single' },
  { key: 'custom', label: 'Custom', days: [], picker: 'multi' },
];

const sameDays = (a = [], b = []) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** Which pattern an existing schedule's days correspond to. */
const patternFor = (days = []) => {
  if (sameDays(days, EVERY_DAY)) return 'daily';
  if (sameDays(days, WORKING_DAYS)) return 'weekdays';
  if (days.length === 1) return 'weekly';
  return 'custom';
};

const CallScheduleDrawer = ({
  isOpen,
  onClose,
  onSubmit,
  saving,
  schedule = null,
  parties = [],
  kams = [],
  schedules = [],
}) => {
  const [form, setForm] = useState(EMPTY);
  const [pattern, setPattern] = useState('custom');
  const [kamTouched, setKamTouched] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const next = schedule
      ? {
          partyId: schedule.partyId?._id || schedule.partyId || '',
          kamId: schedule.kamId?._id || schedule.kamId || '',
          daysOfWeek: schedule.daysOfWeek || [],
          status: schedule.status || 'ACTIVE',
        }
      : EMPTY;
    setForm(next);
    setPattern(next.daysOfWeek.length ? patternFor(next.daysOfWeek) : 'custom');
    setKamTouched(Boolean(schedule));
  }, [isOpen, schedule]);

  const isEditing = Boolean(schedule);

  const party = parties.find((p) => p._id === form.partyId) || null;
  const kam = kams.find((k) => k._id === form.kamId) || null;
  const partyKamId = party?.kamId?._id || party?.kamId || '';

  // The account master already knows who owns the relationship, so making the
  // user re-answer it is a decision they can only get wrong. Auto-filled only
  // while they have not chosen for themselves.
  useEffect(() => {
    if (!isOpen || isEditing || kamTouched || !partyKamId) return;
    setForm((prev) => (prev.kamId ? prev : { ...prev, kamId: partyKamId }));
  }, [isOpen, isEditing, kamTouched, partyKamId]);

  const kamFromAccount = Boolean(partyKamId) && form.kamId === partyKamId;

  // One schedule per party is enforced by a unique index, so picking a party
  // that already has one silently *replaces* it. Show what is about to be lost
  // rather than mentioning it in grey text beside an info icon.
  const clash = useMemo(() => {
    if (isEditing || !form.partyId) return null;
    return schedules.find((s) => (s.partyId?._id || s.partyId) === form.partyId) || null;
  }, [isEditing, form.partyId, schedules]);

  // Saving writes kamId onto the Party too (ErpCallService#upsertSchedule), so a
  // different KAM here quietly changes who owns the account. Worth surfacing —
  // but only when it is an actual change, and only as information: nothing here
  // is destructive, and a KAM may hold any number of accounts.
  const changesAccountKam = Boolean(kam && party && partyKamId && partyKamId !== form.kamId);

  const activePattern = PATTERNS.find((p) => p.key === pattern) || PATTERNS[3];

  const selectPattern = (p) => {
    setPattern(p.key);
    if (p.picker === 'none') setForm((prev) => ({ ...prev, daysOfWeek: p.days }));
    // Weekly keeps a single day; if several were selected, keep the earliest so
    // the choice is deterministic rather than "whichever we happened to find".
    if (p.picker === 'single') {
      setForm((prev) => ({
        ...prev,
        daysOfWeek: prev.daysOfWeek.length === 1 ? prev.daysOfWeek : [
          WEEKDAYS.find((w) => prev.daysOfWeek.includes(w.value))?.value ?? 1,
        ],
      }));
    }
  };

  const toggleDay = (day) => {
    if (activePattern.picker === 'single') {
      setForm((prev) => ({ ...prev, daysOfWeek: [day] }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const valid = form.partyId && form.kamId && form.daysOfWeek.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit(form);
  };

  return (
    <ErpDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit calling schedule' : 'Create calling schedule'}
      subtitle={
        isEditing
          ? party?.name || schedule?.partyId?.name
          : 'Recurring follow-ups for one account'
      }
      maxWidth="560px"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form="call-schedule-form"
            className="btn btn-primary"
            disabled={saving || !valid}
          >
            {saving ? 'Saving…' : clash ? 'Replace schedule' : 'Save schedule'}
          </button>
        </>
      }
    >
      <form id="call-schedule-form" onSubmit={handleSubmit}>
        <div className="erp-form-grid">
          <div className="erp-field full">
            <label htmlFor="sched-party">
              Account <span className="required">*</span>
            </label>
            <select
              id="sched-party"
              value={form.partyId}
              disabled={isEditing}
              onChange={(e) => setForm((p) => ({ ...p, partyId: e.target.value }))}
              required
            >
              <option value="">Select an account</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.code ? `(${p.code})` : ''}
                </option>
              ))}
            </select>
            {isEditing && (
              <span className="erp-field-hint">
                The account cannot be changed — delete this schedule and create one instead.
              </span>
            )}
            {!isEditing && parties.length === 0 && (
              <span className="erp-field-hint">
                No active accounts — add one under Party Master first.
              </span>
            )}
          </div>

          {clash && (
            <div className="erp-callout warning full">
              <AlertTriangle size={16} />
              <div>
                <strong>{clash.partyId?.name} already has a calling schedule.</strong>
                <div style={{ marginTop: 4 }}>
                  {kamName(clash.kamId)} · {dayLabel(clash.daysOfWeek)} ·{' '}
                  {clash.status === 'ACTIVE' ? 'Active' : 'Paused'}
                </div>
                <div style={{ marginTop: 4 }}>
                  Saving replaces it. Calls already logged are kept.
                </div>
              </div>
            </div>
          )}

          <div className="erp-field full">
            <label htmlFor="sched-kam">
              Key Account Manager <span className="required">*</span>
            </label>
            <select
              id="sched-kam"
              value={form.kamId}
              onChange={(e) => {
                setKamTouched(true);
                setForm((p) => ({ ...p, kamId: e.target.value }));
              }}
              required
            >
              <option value="">Select a KAM</option>
              {kams.map((k) => (
                <option key={k._id} value={k._id}>
                  {k.firstName} {k.lastName}
                </option>
              ))}
            </select>
            {kamFromAccount && !isEditing && (
              <span className="erp-field-hint">
                Taken from {party?.name || 'the account master'}. Changing it updates that
                account&apos;s KAM as well.
              </span>
            )}
            {kams.length === 0 && (
              <span className="erp-field-hint">
                No users with the KAM role — create one under Employees.
              </span>
            )}
          </div>

          {changesAccountKam && (
            <div className="erp-callout info full">
              <Info size={16} />
              <div>
                <strong>{party?.name}&apos;s account manager will change too.</strong>
                <div style={{ marginTop: 4 }}>
                  Saving sets {kamName(kam)} as the KAM on the {party?.name} account master,
                  replacing {kamName(party?.kamId)}. Every other account either of them manages
                  is untouched — a KAM can hold as many accounts as you like.
                </div>
              </div>
            </div>
          )}

          <div className="erp-field full">
            <label>
              Calling pattern <span className="required">*</span>
            </label>
            <div className="erp-preset-row">
              {PATTERNS.map((p) => (
                <button
                  type="button"
                  key={p.key}
                  aria-pressed={pattern === p.key}
                  className={`erp-preset ${pattern === p.key ? 'selected' : ''}`}
                  onClick={() => selectPattern(p)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {activePattern.picker !== 'none' && (
              <div style={{ marginTop: 12 }}>
                <span className="erp-field-sublabel">
                  {activePattern.picker === 'single' ? 'Which day?' : 'Call on'}
                </span>
                <div className="erp-weekdays" style={{ marginTop: 6 }}>
                  {WEEKDAYS.map((w) => (
                    <button
                      type="button"
                      key={w.value}
                      aria-pressed={form.daysOfWeek.includes(w.value)}
                      className={`erp-weekday ${form.daysOfWeek.includes(w.value) ? 'selected' : ''}`}
                      onClick={() => toggleDay(w.value)}
                    >
                      {w.short}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <span className="erp-field-hint">
              {form.daysOfWeek.length > 0
                ? `${dayLabel(form.daysOfWeek)} — ${form.daysOfWeek.length} call${form.daysOfWeek.length > 1 ? 's' : ''} a week`
                : 'Pick at least one day.'}
            </span>
          </div>

          <div className="erp-field full">
            <label htmlFor="sched-status">Status</label>
            <select
              id="sched-status"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="ACTIVE">Active — generate call tasks</option>
              <option value="PAUSED">Paused — generate nothing</option>
            </select>
          </div>

          <div className="erp-callout info full">
            <Info size={16} />
            <span>
              Call tasks are created automatically for the KAM on each selected day, starting
              from the next one.
            </span>
          </div>
        </div>
      </form>
    </ErpDrawer>
  );
};

export default CallScheduleDrawer;
