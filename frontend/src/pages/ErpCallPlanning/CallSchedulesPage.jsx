/**
 * Call Schedules (ISOCL ERP Stage 1)
 *
 * Which weekdays each party gets called on, and by whom. The nightly job reads
 * this to open the day's tasks. Saving a schedule also reassigns the KAM on the
 * party master — the schedule is the authority on who owns the relationship.
 */

import React, { useState, useEffect } from 'react';
import { Plus, CalendarDays, Edit2, Trash2, X, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import apiClient from '../../utils/axiosConfig';
import ErpCallService from './ErpCallService';
import { WEEKDAYS } from './erpCall.constants';
import PartyService from '../ErpMasters/PartyService';
import useApi from '../../hooks/useApi';
import '../../styles/erp.css';

const EMPTY_FORM = { partyId: '', kamId: '', daysOfWeek: [], status: 'ACTIVE' };

const CallSchedulesPage = () => {
  const [schedules, setSchedules] = useState([]);
  const [parties, setParties] = useState([]);
  const [kams, setKams] = useState([]);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: schedulesResponse, loading, error: schedulesError, refetch: refetchSchedules } =
    useApi(() => ErpCallService.getSchedules({ limit: 200 }), []);

  const { data: partiesResponse } = useApi(
    () => PartyService.getParties({ status: 'ACTIVE', limit: 200 }),
    [],
  );

  const { data: kamsResponse } = useApi(
    (signal) =>
      apiClient.get('/api/employees', {
        params: { role: 'KAM', limit: 200 },
        signal,
      }),
    [],
  );

  useEffect(() => {
    if (schedulesResponse) setSchedules(schedulesResponse.data || []);
  }, [schedulesResponse]);

  useEffect(() => {
    if (partiesResponse) setParties(partiesResponse.data || []);
  }, [partiesResponse]);

  useEffect(() => {
    if (kamsResponse) setKams(kamsResponse.data?.data || []);
  }, [kamsResponse]);

  useEffect(() => {
    if (!schedulesError) return;
    if (schedulesError.status === 404) {
      toast.error('Call Planning is not enabled for your organization');
    } else {
      toast.error(schedulesError.message);
    }
    setSchedules([]);
  }, [schedulesError]);

  const openCreate = () => {
    setIsEditing(false);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (schedule) => {
    setIsEditing(true);
    setForm({
      partyId: schedule.partyId?._id || schedule.partyId || '',
      kamId: schedule.kamId?._id || schedule.kamId || '',
      daysOfWeek: schedule.daysOfWeek || [],
      status: schedule.status || 'ACTIVE',
    });
    setShowModal(true);
  };

  const toggleDay = (day) => {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.partyId || !form.kamId) {
      toast.error('Pick a party and a KAM');
      return;
    }
    if (form.daysOfWeek.length === 0) {
      toast.error('Pick at least one day');
      return;
    }

    setSaving(true);
    try {
      await ErpCallService.saveSchedule({
        partyId: form.partyId,
        kamId: form.kamId,
        daysOfWeek: form.daysOfWeek,
        status: form.status,
      });
      toast.success('Call schedule saved');
      setShowModal(false);
      refetchSchedules();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await ErpCallService.deleteSchedule(deleteTarget._id);
      toast.success('Schedule deleted');
      setDeleteTarget(null);
      refetchSchedules();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const dayLabels = (days = []) =>
    WEEKDAYS.filter((w) => days.includes(w.value))
      .map((w) => w.short)
      .join(', ') || '—';

  const kamLabel = (s) =>
    s.kamId ? `${s.kamId.firstName || ''} ${s.kamId.lastName || ''}`.trim() || '—' : '—';

  return (
    <div className="erp-page">
      <div className="erp-header">
        <div>
          <h1>Call Schedules</h1>
          <p className="erp-subtitle">
            Weekly calling plan per party — drives the nightly task generation
          </p>
        </div>
        <div className="erp-header-actions">
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={18} />
            Add Schedule
          </button>
        </div>
      </div>

      <div className="erp-container" style={{ marginTop: 24 }}>
        {loading ? (
          <div className="erp-state">
            <p>Loading schedules...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="erp-state">
            <CalendarDays size={48} />
            <p>No call schedules yet</p>
            <span className="erp-cell-muted">
              Add one to start generating daily call tasks.
            </span>
          </div>
        ) : (
          <div className="erp-table-scroll">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Party</th>
                  <th>KAM</th>
                  <th>Call Days</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {schedules.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="erp-cell-strong">{s.partyId?.name || '—'}</div>
                      {s.partyId?.code && (
                        <div className="erp-cell-muted">{s.partyId.code}</div>
                      )}
                    </td>
                    <td>{kamLabel(s)}</td>
                    <td className="erp-cell-muted">{dayLabels(s.daysOfWeek)}</td>
                    <td>
                      <span
                        className={`erp-badge ${s.status === 'ACTIVE' ? 'active' : 'warning'}`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div className="erp-actions">
                        <button
                          className="btn-icon"
                          onClick={() => openEdit(s)}
                          title="Edit schedule"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => setDeleteTarget(s)}
                          title="Delete schedule"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="erp-modal-backdrop"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="erp-modal">
            <div className="erp-modal-header">
              <h2>{isEditing ? 'Edit Call Schedule' : 'Add Call Schedule'}</h2>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="erp-modal-body">
                <div className="erp-callout info">
                  <Info size={16} />
                  <span>
                    Saving also sets this KAM on the party master. One schedule per party —
                    picking an existing party updates its schedule.
                  </span>
                </div>

                <div className="erp-form-grid">
                  <div className="erp-field full">
                    <label htmlFor="sched-party">
                      Party <span className="required">*</span>
                    </label>
                    <select
                      id="sched-party"
                      value={form.partyId}
                      onChange={(e) => setForm((p) => ({ ...p, partyId: e.target.value }))}
                      required
                    >
                      <option value="">Select a party</option>
                      {parties.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} ({p.code})
                        </option>
                      ))}
                    </select>
                    {parties.length === 0 && (
                      <span className="erp-field-hint">
                        No active parties — add one under Party Master first.
                      </span>
                    )}
                  </div>

                  <div className="erp-field full">
                    <label htmlFor="sched-kam">
                      Key Account Manager <span className="required">*</span>
                    </label>
                    <select
                      id="sched-kam"
                      value={form.kamId}
                      onChange={(e) => setForm((p) => ({ ...p, kamId: e.target.value }))}
                      required
                    >
                      <option value="">Select a KAM</option>
                      {kams.map((k) => (
                        <option key={k._id} value={k._id}>
                          {k.firstName} {k.lastName}
                        </option>
                      ))}
                    </select>
                    {kams.length === 0 && (
                      <span className="erp-field-hint">
                        No users with the KAM role — create one under Employees.
                      </span>
                    )}
                  </div>

                  <div className="erp-field full">
                    <label>
                      Call Days <span className="required">*</span>
                    </label>
                    <div className="erp-weekdays">
                      {WEEKDAYS.map((w) => (
                        <button
                          type="button"
                          key={w.value}
                          className={`erp-weekday ${
                            form.daysOfWeek.includes(w.value) ? 'selected' : ''
                          }`}
                          onClick={() => toggleDay(w.value)}
                        >
                          {w.short}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="erp-field full">
                    <label htmlFor="sched-status">Status</label>
                    <select
                      id="sched-status"
                      value={form.status}
                      onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="PAUSED">Paused</option>
                    </select>
                    <span className="erp-field-hint">
                      Paused schedules are skipped by the nightly job.
                    </span>
                  </div>
                </div>
              </div>

              <div className="erp-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="erp-modal-backdrop"
          role="presentation"
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteTarget(null); }}
        >
          <div
            className="erp-modal"
            style={{ maxWidth: 420 }}
          >
            <div className="erp-modal-header">
              <h2>Delete Schedule</h2>
              <button className="btn-icon" onClick={() => setDeleteTarget(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="erp-modal-body">
              <p style={{ margin: 0 }}>
                Stop generating call tasks for{' '}
                <strong>{deleteTarget.partyId?.name || 'this party'}</strong>? Existing tasks
                are kept.
              </p>
            </div>
            <div className="erp-modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                {saving ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallSchedulesPage;
