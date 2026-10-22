import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createChallan, updateChallan, CHALLAN_STATUSES } from '../../services/challanService';
import { STATUS } from './challanStatus';

/**
 * ChallanFormDialog — add or edit ONE manual challan.
 *
 * Used for both create and edit (`challan` prop set ⇒ edit). The backend
 * owns validation and the amount/status transition rules; this form only
 * collects the fields and surfaces whatever the API says.
 *
 * Notes field is hidden for PROVIDER rows — a provider's payload is not
 * ours to annotate, and the source badge in the table already says where
 * the row came from. Editing a provider row (a correction the operator
 * noticed) is still allowed: same form, no notes box.
 */
const EMPTY = {
  vehicleNumber: '',
  challanNo: '',
  state: '',
  offenseDate: '',
  offenseDescription: '',
  amount: '',
  paidAmount: '',
  status: 'OPEN',
  notes: '',
};

/** `<input type="date">` gives `YYYY-MM-DD`; the API wants an ISO instant. */
function toIsoOrUndefined(value) {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Inverse: ISO instant → the `YYYY-MM-DD` the date input expects. */
function toDateInputValue(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  // IST calendar day — a challan is dated in local time, so slicing the
  // UTC string would show the previous day for anything after 05:30 IST.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// jsx-a11y's control-has-associated-label (still on at 'warn' repo-wide)
// inspects ONLY the control's own aria-label / aria-labelledby / alt — it never
// looks at ancestors, so a perfectly valid <label htmlFor> pairing still trips
// it. Pairing both: `htmlFor`/`id` for real click-to-focus + getByLabelText,
// `aria-labelledby` back to the caption so the rule is satisfied without
// duplicating the caption string on the control.
const labelCls = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1';
const inputCls =
  'w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500';

/** One labelled field: caption + control, wired for click and for the linter. */
function Field({ id, label, wide, children }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <label className={labelCls} htmlFor={id} id={`${id}-label`}>
        {label}
      </label>
      {children(id, `${id}-label`)}
    </div>
  );
}

export default function ChallanFormDialog({ open, onClose, challan = null, onSaved }) {
  const isEdit = Boolean(challan);
  const isProviderRow = isEdit && challan.source === 'PROVIDER';
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      isEdit
        ? {
            vehicleNumber: challan.vehicleNumber || '',
            challanNo: challan.challanNo || '',
            state: challan.state || '',
            offenseDate: toDateInputValue(challan.offenseDate),
            offenseDescription: challan.offenseDescription || '',
            amount: challan.amount != null ? String(challan.amount) : '',
            paidAmount: challan.paidAmount != null ? String(challan.paidAmount) : '',
            status: challan.status || 'OPEN',
            notes: challan.notes || '',
          }
        : EMPTY,
    );
  }, [open, isEdit, challan]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        challanNo: form.challanNo.trim(),
        state: form.state.trim().toUpperCase() || null,
        offenseDate: toIsoOrUndefined(form.offenseDate) ?? null,
        offenseDescription: form.offenseDescription.trim() || null,
        amount: Number(form.amount) || 0,
        paidAmount: Number(form.paidAmount) || 0,
        status: form.status,
      };
      if (!isProviderRow) payload.notes = form.notes.trim() || null;

      const saved = isEdit
        ? await updateChallan(challan._id, payload)
        : await createChallan(payload);
      toast.success(isEdit ? 'Challan updated' : `Challan ${payload.challanNo} added`);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Could not save the challan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && !saving) onClose();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit challan' : 'Add manual challan'}</DialogTitle>
          <DialogDescription>
            {isProviderRow
              ? 'This row came from the configured e-challan provider. You can correct the values here — the next scheduled pull will re-apply whatever the provider reports.'
              : 'For a challan you paid or received at a police station / online portal. Provider pulls are keyed separately, so the same challan number can exist in both without collision.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="challan-plate" label="Vehicle plate *">
            {(id, labelId) => (
              <input
                id={id}
                aria-labelledby={labelId}
                required
                value={form.vehicleNumber}
                onChange={set('vehicleNumber')}
                placeholder="KA01AB1234"
                className={`${inputCls} font-mono uppercase`}
              />
            )}
          </Field>

          <Field id="challan-no" label="Challan no *">
            {(id, labelId) => (
              <input
                id={id}
                aria-labelledby={labelId}
                required
                value={form.challanNo}
                onChange={set('challanNo')}
                placeholder="e.g. KA0120230045678"
                className={`${inputCls} font-mono`}
              />
            )}
          </Field>

          <Field id="challan-state" label="State">
            {(id, labelId) => (
              <input
                id={id}
                aria-labelledby={labelId}
                value={form.state}
                onChange={set('state')}
                placeholder="KA"
                maxLength={8}
                className={`${inputCls} uppercase`}
              />
            )}
          </Field>

          <Field id="challan-date" label="Offense date">
            {(id, labelId) => (
              <input
                id={id}
                aria-labelledby={labelId}
                type="date"
                value={form.offenseDate}
                onChange={set('offenseDate')}
                className={inputCls}
              />
            )}
          </Field>

          <Field id="challan-desc" label="Offence" wide>
            {(id, labelId) => (
              <input
                id={id}
                aria-labelledby={labelId}
                value={form.offenseDescription}
                onChange={set('offenseDescription')}
                placeholder="Exceeding speed limit"
                className={inputCls}
              />
            )}
          </Field>

          <Field id="challan-amount" label="Amount (₹) *">
            {(id, labelId) => (
              <input
                id={id}
                aria-labelledby={labelId}
                type="number"
                min="0"
                step="1"
                value={form.amount}
                onChange={set('amount')}
                className={`${inputCls} font-mono`}
              />
            )}
          </Field>

          <Field id="challan-paid" label="Paid amount (₹)">
            {(id, labelId) => (
              <input
                id={id}
                aria-labelledby={labelId}
                type="number"
                min="0"
                step="1"
                value={form.paidAmount}
                onChange={set('paidAmount')}
                disabled={form.status !== 'PAID'}
                placeholder={form.status === 'PAID' ? '0' : 'Set status to Paid first'}
                className={`${inputCls} font-mono disabled:opacity-60 disabled:cursor-not-allowed`}
              />
            )}
          </Field>

          <div className="sm:col-span-2">
            <label className={labelCls} htmlFor="challan-status" id="challan-status-label">
              Status
            </label>
            <select
              id="challan-status"
              aria-labelledby="challan-status-label"
              value={form.status}
              onChange={set('status')}
              className={inputCls}
            >
              {CHALLAN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS[s].label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[11px] text-slate-500">
              Marking a challan Paid without recording a paid amount is rejected by the server — it
              would otherwise inflate the paid total.
            </p>
          </div>

          {!isProviderRow && (
            <Field id="challan-notes" label="Notes" wide>
              {(id, labelId) => (
                <input
                  id={id}
                  aria-labelledby={labelId}
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="Receipt number, paid at, appeal ref…"
                  className={inputCls}
                />
              )}
            </Field>
          )}

          <DialogFooter className="sm:col-span-2 -mx-6 -mb-5 mt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add challan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
