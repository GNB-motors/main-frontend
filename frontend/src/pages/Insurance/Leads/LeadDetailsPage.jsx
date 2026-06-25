import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft, Mail, Pencil, Save, X, CalendarClock, MessageSquare, Plus,
  ArrowRight, Flag, UserCheck, ShieldCheck, FileText,
} from 'lucide-react';
import { InsuranceService } from '../InsuranceService';
import { StatusBadge, PriorityFlag, PriorityDropdown } from '../components/badges';
import { statusOptions } from '../components/leadMeta';
import Dropdown from '../components/Dropdown';

const ACTIVITY_META = {
  CREATED: { Icon: Plus, color: 'text-blue-500 bg-blue-50' },
  UPDATED: { Icon: Pencil, color: 'text-slate-500 bg-slate-100' },
  STATUS_CHANGED: { Icon: ArrowRight, color: 'text-violet-500 bg-violet-50' },
  PRIORITY_CHANGED: { Icon: Flag, color: 'text-amber-500 bg-amber-50' },
  ASSIGNED: { Icon: UserCheck, color: 'text-blue-500 bg-blue-50' },
  FOLLOWUP_SCHEDULED: { Icon: CalendarClock, color: 'text-teal-500 bg-teal-50' },
  NOTE_ADDED: { Icon: MessageSquare, color: 'text-slate-500 bg-slate-100' },
  POLICY_ISSUED: { Icon: ShieldCheck, color: 'text-emerald-500 bg-emerald-50' },
};

const fieldCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none';
const labelCls = 'mb-1 block text-xs font-semibold text-slate-600';

function fmtDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm text-slate-700">{value || <span className="text-slate-300">—</span>}</div>
    </div>
  );
}

export default function LeadDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  const [followUp, setFollowUp] = useState({ at: '', note: '' });
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await InsuranceService.getLead(id);
      setLead(data);
      setActivities(data.activities || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load lead');
      navigate('/insurance/leads');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
    InsuranceService.listAgents().then(setAgents).catch(() => {});
  }, [load]);

  const startEdit = () => {
    setForm({
      customerName: lead.customerName || '',
      mobileNumber: lead.mobileNumber || '',
      email: lead.email || '',
      companyName: lead.companyName || '',
      vehicleNumber: lead.vehicleNumber || '',
      remarks: lead.remarks || '',
      assignedAgent: lead.assignedAgent?._id || '',
      policyNumber: lead.policyNumber || '',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      const payload = { ...form, assignedAgent: form.assignedAgent || null };
      await InsuranceService.updateLead(id, payload);
      toast.success('Lead updated');
      setEditing(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSavingEdit(false);
    }
  };

  const changeStatus = async (status) => {
    try {
      await InsuranceService.updateStatus(id, { status });
      toast.success(`Status set to ${status}`);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change status');
    }
  };

  const changePriority = async (priority) => {
    try {
      await InsuranceService.updatePriority(id, priority);
      load();
    } catch {
      toast.error('Failed to change priority');
    }
  };

  const submitFollowUp = async () => {
    if (!followUp.at) return toast.error('Pick a date & time');
    try {
      await InsuranceService.scheduleFollowUp(id, { nextFollowUpAt: new Date(followUp.at).toISOString(), nextFollowUpNote: followUp.note || undefined });
      toast.success('Follow-up scheduled');
      setFollowUp({ at: '', note: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    }
  };

  const submitNote = async () => {
    if (!note.trim()) return;
    try {
      await InsuranceService.addNote(id, note.trim());
      setNote('');
      load();
    } catch {
      toast.error('Failed to add note');
    }
  };

  if (loading || !lead) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  const agentName = lead.assignedAgent ? `${lead.assignedAgent.firstName || ''} ${lead.assignedAgent.lastName || ''}`.trim() : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <button onClick={() => navigate('/insurance/leads')} className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft size={15} /> Back to Leads
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-800">{lead.customerName}</h1>
          <StatusBadge status={lead.status} />
          <PriorityFlag priority={lead.priority} />
        </div>
        <div
          className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-400"
          title="Email sending arrives in a later phase"
        >
          <Mail size={15} /> Send email
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left: info + actions */}
        <div className="space-y-5 lg:col-span-2">
          {/* Info card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Lead details</h3>
              {!editing ? (
                <button onClick={startEdit} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  <Pencil size={13} /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    <X size={13} /> Cancel
                  </button>
                  <button onClick={saveEdit} disabled={savingEdit} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                    <Save size={13} /> {savingEdit ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {!editing ? (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <Field label="Mobile" value={lead.mobileNumber} />
                <Field label="Email" value={lead.email} />
                <Field label="Company" value={lead.companyName} />
                <Field label="Vehicle Number" value={lead.vehicleNumber} />
                <Field label="Assigned Agent" value={agentName} />
                <Field label="Policy Number" value={lead.policyNumber} />
                <div className="col-span-2"><Field label="Remarks" value={lead.remarks} /></div>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Customer Name</label><input className={fieldCls} value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} /></div>
                <div><label className={labelCls}>Mobile</label><input className={fieldCls} value={form.mobileNumber} onChange={(e) => setForm((f) => ({ ...f, mobileNumber: e.target.value }))} /></div>
                <div><label className={labelCls}>Email</label><input className={fieldCls} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></div>
                <div><label className={labelCls}>Company</label><input className={fieldCls} value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} /></div>
                <div><label className={labelCls}>Vehicle Number</label><input className={fieldCls} value={form.vehicleNumber} onChange={(e) => setForm((f) => ({ ...f, vehicleNumber: e.target.value }))} /></div>
                <div>
                  <label className={labelCls}>Assigned Agent</label>
                  <Dropdown
                    value={form.assignedAgent}
                    onChange={(v) => setForm((f) => ({ ...f, assignedAgent: v }))}
                    placeholder="Unassigned"
                    options={[{ value: '', label: 'Unassigned' }, ...agents.map((a) => ({ value: a._id, label: `${a.firstName} ${a.lastName}` }))]}
                  />
                </div>
                <div><label className={labelCls}>Policy Number</label><input className={fieldCls} value={form.policyNumber} onChange={(e) => setForm((f) => ({ ...f, policyNumber: e.target.value }))} /></div>
                <div className="col-span-2"><label className={labelCls}>Remarks</label><textarea rows={3} className={fieldCls} value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} /></div>
              </div>
            )}
          </div>

          {/* Pipeline + actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800">Pipeline & follow-up</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Status</label>
                <Dropdown value={lead.status} onChange={changeStatus} options={statusOptions()} ariaLabel="Lead status" />
              </div>
              <div>
                <label className={labelCls}>Priority</label>
                <div className="pt-1"><PriorityDropdown value={lead.priority} onChange={changePriority} /></div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
              <div className="mb-2 text-xs font-semibold text-slate-600">Schedule next follow-up</div>
              {lead.nextFollowUpAt && (
                <div className="mb-2 text-xs text-slate-500">Current: <span className="font-semibold text-slate-700">{fmtDateTime(lead.nextFollowUpAt)}</span></div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <input type="datetime-local" className={`${fieldCls} flex-1`} value={followUp.at} onChange={(e) => setFollowUp((f) => ({ ...f, at: e.target.value }))} />
                <input className={`${fieldCls} flex-1`} placeholder="Note (optional)" value={followUp.note} onChange={(e) => setFollowUp((f) => ({ ...f, note: e.target.value }))} />
                <button onClick={submitFollowUp} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  <CalendarClock size={14} /> Schedule
                </button>
              </div>
            </div>

            <div className="mt-4">
              <label className={labelCls}>Add a note / log a call</label>
              <div className="flex gap-2">
                <input className={`${fieldCls} flex-1`} placeholder="e.g. Called, will share quote tomorrow" value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitNote()} />
                <button onClick={submitNote} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: timeline */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
            <FileText size={15} className="text-slate-400" /> Activity timeline
          </h3>
          {activities.length === 0 ? (
            <p className="text-xs text-slate-400">No activity yet.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-slate-100 pl-4">
              {activities.map((a) => {
                const meta = ACTIVITY_META[a.type] || ACTIVITY_META.UPDATED;
                const { Icon } = meta;
                const actor = a.actor ? `${a.actor.firstName || ''} ${a.actor.lastName || ''}`.trim() : 'System';
                return (
                  <li key={a._id} className="relative">
                    <span className={`absolute -left-[26px] flex h-5 w-5 items-center justify-center rounded-full ${meta.color}`}>
                      <Icon size={11} />
                    </span>
                    <div className="text-sm text-slate-700">{a.message}</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">{actor} · {fmtDateTime(a.createdAt)}</div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
