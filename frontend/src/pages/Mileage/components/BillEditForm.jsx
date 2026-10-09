import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useMutation } from '../../../hooks/useMutation';
import { MileageApi } from '../mileageApi';

const pad = (n) => String(n).padStart(2, '0');
const toDatetimeLocal = (iso) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const numberOrUndefined = (v) => (v === '' || v == null ? undefined : Number(v));

const inputClass =
  'w-full rounded-md border border-[var(--ds-line2)] bg-white px-2 py-1.5 text-[13px] text-[var(--ds-ink)]';

const Field = ({ id, label, children }) => (
  <label htmlFor={id} className="flex flex-col gap-1 text-[12px] font-medium text-[var(--ds-ink3)]">
    {label}
    {children}
  </label>
);

/** Edit one bill — PUT /api/mileage/fuel-log/:id, the fields the old Refuel Logs edit had. */
export default function BillEditForm({ bill, onCancel, onSaved }) {
  const [form, setForm] = useState({
    fuelType: bill.fuelType || 'DIESEL',
    fillingType: bill.fillingType || 'PARTIAL',
    litres: bill.litres ?? '',
    rate: bill.rawRate ?? '',
    odometerReading: bill.odometer ?? '',
    location: bill.rawLocation || '',
    refuelTime: toDatetimeLocal(bill.at),
  });
  const save = useMutation(MileageApi.updateBill);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    try {
      await save.mutate({
        id: bill.id,
        fuelType: form.fuelType,
        fillingType: form.fillingType,
        litres: numberOrUndefined(form.litres),
        rate: numberOrUndefined(form.rate),
        odometerReading: numberOrUndefined(form.odometerReading),
        location: form.location.trim() || undefined,
        refuelTime: form.refuelTime ? new Date(form.refuelTime).toISOString() : undefined,
      });
      toast.success('Bill saved');
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the bill. Try again.');
    }
  };

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-2.5 py-2">
      <Field id="bill-fuel" label="Fuel">
        <select
          id="bill-fuel"
          className={inputClass}
          value={form.fuelType}
          onChange={set('fuelType')}
        >
          <option value="DIESEL">Diesel</option>
          <option value="ADBLUE">AdBlue</option>
        </select>
      </Field>
      <Field id="bill-fill" label="Fill">
        <select
          id="bill-fill"
          className={inputClass}
          value={form.fillingType}
          onChange={set('fillingType')}
        >
          <option value="PARTIAL">Part tank</option>
          <option value="FULL_TANK">Full tank</option>
        </select>
      </Field>
      <Field id="bill-litres" label="Litres">
        <input
          id="bill-litres"
          className={inputClass}
          type="number"
          min="0"
          step="0.01"
          value={form.litres}
          onChange={set('litres')}
        />
      </Field>
      <Field id="bill-rate" label="Rate (₹ a litre)">
        <input
          id="bill-rate"
          className={inputClass}
          type="number"
          min="0"
          step="0.01"
          value={form.rate}
          onChange={set('rate')}
        />
      </Field>
      <Field id="bill-odo" label="Odometer (km)">
        <input
          id="bill-odo"
          className={inputClass}
          type="number"
          min="0"
          value={form.odometerReading}
          onChange={set('odometerReading')}
        />
      </Field>
      <Field id="bill-time" label="Fill time">
        <input
          id="bill-time"
          className={inputClass}
          type="datetime-local"
          value={form.refuelTime}
          onChange={set('refuelTime')}
        />
      </Field>
      <div className="col-span-2">
        <Field id="bill-pump" label="Pump">
          <input
            id="bill-pump"
            className={inputClass}
            value={form.location}
            onChange={set('location')}
          />
        </Field>
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-1">
        <button type="button" className="pshell-btn" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="pshell-btn pshell-btn--primary" disabled={save.loading}>
          {save.loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
