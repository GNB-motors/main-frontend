import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../components/Modal';
import { InsuranceService } from '../InsuranceService';

const MOBILE_RE = /^(\+91[-\s]?|0)?[6-9]\d{9}$/;

const fieldCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none';
const labelCls = 'mb-1 block text-xs font-semibold text-slate-600';

// One-column Add Lead form per the brief — minimal fields, inline validation,
// then redirect to the new lead's details page.
export default function AddLeadModal({ agents = [], onClose, onCreated }) {
  const [form, setForm] = useState({
    customerName: '',
    mobileNumber: '',
    email: '',
    companyName: '',
    vehicleNumber: '',
    remarks: '',
    assignedAgent: '',
    priority: 'Warm',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.customerName.trim()) e.customerName = 'Customer name is required';
    if (!form.mobileNumber.trim()) e.mobileNumber = 'Mobile number is required';
    else if (!MOBILE_RE.test(form.mobileNumber.trim())) e.mobileNumber = 'Enter a valid 10-digit mobile number';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        customerName: form.customerName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        email: form.email.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        vehicleNumber: form.vehicleNumber.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
        assignedAgent: form.assignedAgent || undefined,
        priority: form.priority,
      };
      const lead = await InsuranceService.createLead(payload);
      toast.success('Lead created');
      onCreated(lead);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Lead" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Customer Name *</label>
          <input className={fieldCls} value={form.customerName} onChange={(e) => set('customerName', e.target.value)} placeholder="e.g. Rajesh Kumar" />
          {errors.customerName && <p className="mt-1 text-[11px] text-red-500">{errors.customerName}</p>}
        </div>
        <div>
          <label className={labelCls}>Mobile Number *</label>
          <input className={fieldCls} value={form.mobileNumber} onChange={(e) => set('mobileNumber', e.target.value)} placeholder="98765 43210" />
          {errors.mobileNumber && <p className="mt-1 text-[11px] text-red-500">{errors.mobileNumber}</p>}
        </div>
        <div>
          <label className={labelCls}>Email Address</label>
          <input className={fieldCls} value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="optional" />
          {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>}
        </div>
        <div>
          <label className={labelCls}>Company Name</label>
          <input className={fieldCls} value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="optional — for business insurance" />
        </div>
        <div>
          <label className={labelCls}>Vehicle Number</label>
          <input className={fieldCls} value={form.vehicleNumber} onChange={(e) => set('vehicleNumber', e.target.value)} placeholder="optional — for motor insurance" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Assign Agent</label>
            <select className={fieldCls} value={form.assignedAgent} onChange={(e) => set('assignedAgent', e.target.value)}>
              <option value="">Unassigned</option>
              {agents.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.firstName} {a.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Priority</label>
            <select className={fieldCls} value={form.priority} onChange={(e) => set('priority', e.target.value)}>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Remarks</label>
          <textarea className={fieldCls} rows={3} value={form.remarks} onChange={(e) => set('remarks', e.target.value)} placeholder="Any initial notes" />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Lead'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
