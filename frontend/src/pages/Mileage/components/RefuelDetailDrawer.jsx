import React, { useState } from 'react';
import { FileText, Fuel, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import apiClient from '../../../utils/axiosConfig';
import DocumentService from '../../Trip/services/DocumentService';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { formatINR, formatKm, formatLitres } from '../../../utils/formatters';
import { CORRECTION_META, ODOMETER_SOURCE_META, calibrationHint } from '../mileageRows';

const Field = ({ label, children }) => (
  <div className="flex items-baseline justify-between gap-4 py-1.5 text-xs">
    <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
    <span className="text-right font-medium text-slate-800 dark:text-slate-200 break-words">
      {children ?? '—'}
    </span>
  </div>
);

const Section = ({ icon, title, action = null, children }) => (
  <section className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
    <div className="mb-1 flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {icon}
        {title}
      </h3>
      {action}
    </div>
    <div className="divide-y divide-slate-100 dark:divide-slate-800">{children}</div>
  </section>
);

const fmtRate = (rate) =>
  rate?.value != null
    ? `${formatINR(rate.value, { decimals: 2 })}/L${rate.provenance === 'CALCULATED' ? ' (amount ÷ litres)' : ''}`
    : null;

const signedL = (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} L`;

const pad = (n) => String(n).padStart(2, '0');
const toDatetimeLocal = (iso) => {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const inputClass =
  'w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-200';

/** PUT /api/mileage/fuel-log/:id — the same fields the old Refuel Logs edit had. */
function BillEditForm({ bill, onCancel, onSaved }) {
  const [form, setForm] = useState({
    fuelType: bill.fuelType || 'DIESEL',
    fillingType: bill.fillingType || 'PARTIAL',
    litres: bill.litres ?? '',
    rate: bill.rawRate ?? '',
    odometerReading: bill.odometer ?? '',
    location: bill.rawLocation || '',
    refuelTime: toDatetimeLocal(bill.at),
  });
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const numberOrUndefined = (v) => (v === '' || v == null ? undefined : Number(v));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put(`/api/mileage/fuel-log/${bill.id}`, {
        fuelType: form.fuelType,
        fillingType: form.fillingType,
        litres: numberOrUndefined(form.litres),
        rate: numberOrUndefined(form.rate),
        odometerReading: numberOrUndefined(form.odometerReading),
        location: form.location.trim() || undefined,
        refuelTime: form.refuelTime ? new Date(form.refuelTime).toISOString() : undefined,
      });
      toast.success('Bill updated');
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update the bill');
    } finally {
      setSaving(false);
    }
  };

  const label = (text, control) => (
    <label className="flex flex-col gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
      {text}
      {control}
    </label>
  );

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-2.5 py-2">
      {label(
        'Fuel',
        <select className={inputClass} value={form.fuelType} onChange={set('fuelType')}>
          <option value="DIESEL">Diesel</option>
          <option value="ADBLUE">AdBlue</option>
        </select>,
      )}
      {label(
        'Fill',
        <select className={inputClass} value={form.fillingType} onChange={set('fillingType')}>
          <option value="PARTIAL">Partial</option>
          <option value="FULL_TANK">Full tank</option>
        </select>,
      )}
      {label(
        'Litres',
        <input
          className={inputClass}
          type="number"
          min="0"
          step="0.01"
          value={form.litres}
          onChange={set('litres')}
        />,
      )}
      {label(
        'Rate (₹/L)',
        <input
          className={inputClass}
          type="number"
          min="0"
          step="0.01"
          value={form.rate}
          onChange={set('rate')}
        />,
      )}
      {label(
        'Odometer (km)',
        <input
          className={inputClass}
          type="number"
          min="0"
          value={form.odometerReading}
          onChange={set('odometerReading')}
        />,
      )}
      {label(
        'Refuel time',
        <input
          className={inputClass}
          type="datetime-local"
          value={form.refuelTime}
          onChange={set('refuelTime')}
        />,
      )}
      <div className="col-span-2">
        {label(
          'Station',
          <input className={inputClass} value={form.location} onChange={set('location')} />,
        )}
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white cursor-pointer disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

/**
 * One refuel, bill beside tank sensor. `detail` is the normalised shape from
 * mileageRows.drawerFromLiveRow / drawerFromReconciliationRow, so both tabs
 * share this drawer without either pretending to be a FuelComparisonTask.
 * Litres, bill check and flags are shown as the server sends them.
 */
export default function RefuelDetailDrawer({ detail, onClose, canEdit = false, onChanged }) {
  const [openingBill, setOpeningBill] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const bill = detail?.bill;
  const sensor = detail?.sensor;
  const check = detail?.billCheck;

  // A new row opens in read mode.
  const [shownDetail, setShownDetail] = useState(detail);
  if (shownDetail !== detail) {
    setShownDetail(detail);
    setEditing(false);
    setConfirmingDelete(false);
  }

  const openBill = async () => {
    if (!bill?.documentId) return;
    setOpeningBill(true);
    try {
      const doc = await DocumentService.getDocument(bill.documentId);
      const url = doc?.publicUrl || doc?.data?.publicUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else toast.error('No image found for this bill');
    } catch {
      toast.error('Failed to load the bill');
    } finally {
      setOpeningBill(false);
    }
  };

  const deleteBill = async () => {
    setDeleting(true);
    try {
      await apiClient.delete(`/api/mileage/fuel-log/${bill.id}`);
      toast.success('Bill deleted');
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete the bill');
    } finally {
      setDeleting(false);
    }
  };

  const odoMeta = bill?.odometerSource ? ODOMETER_SOURCE_META[bill.odometerSource] : null;
  const correction = sensor?.correction ? CORRECTION_META[sensor.correction] : null;
  const isGlitch = sensor?.correction === 'SENSOR_GLITCH';
  const editable = canEdit && bill?.id;

  return (
    <Sheet
      open={Boolean(detail)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full !max-w-[440px] gap-0 p-0">
        <SheetHeader className="shrink-0 items-start gap-3">
          <div className="min-w-0 flex flex-col gap-1.5">
            <SheetTitle className="flex items-center gap-2">
              <span className="mileage-plate">{detail?.title || '—'}</span>
              {detail?.badge && (
                <span
                  className={`mileage-badge mileage-badge-${detail.badge.tone}`}
                  title={detail.badge.hint}
                >
                  {detail.badge.label}
                </span>
              )}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {detail?.subtitle || 'Refuel detail'}
            </SheetDescription>
          </div>
          <SheetClose
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </SheetClose>
        </SheetHeader>

        {detail && (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {detail.varianceL != null && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-xs">
                <div className="text-slate-500 dark:text-slate-400">Tank rise − billed litres</div>
                <div
                  className={`mt-0.5 font-mono text-base font-bold ${
                    (check ? check.flagged : detail.varianceL < 0)
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {signedL(detail.varianceL)}
                  {detail.variancePct != null && (
                    <span className="ml-1.5 text-xs font-medium text-slate-500">
                      ({detail.variancePct > 0 ? '+' : ''}
                      {detail.variancePct.toFixed(1)}%)
                    </span>
                  )}
                </div>
                {check?.toleranceL != null && (
                  <div className="mt-1 text-slate-500 dark:text-slate-400">
                    Allowed ±{check.toleranceL.toFixed(1)} L for this truck ·{' '}
                    {check.flagged ? 'outside the allowance' : 'within the allowance'}
                  </div>
                )}
                {!check && detail.varianceL < 0 && (
                  <div className="mt-1 text-slate-500 dark:text-slate-400">
                    The bill claims more fuel than reached the tank.
                  </div>
                )}
                {check?.v1VarianceL != null && (
                  <div className="mt-2 border-t border-slate-200 dark:border-slate-700 pt-1.5 text-[10px] text-slate-400">
                    Old check: {signedL(check.v1VarianceL)}, {check.v1Flagged ? 'flagged' : 'ok'}
                  </div>
                )}
              </div>
            )}

            <Section
              icon={<FileText className="w-3.5 h-3.5" />}
              title="Bill"
              action={
                editable && !editing ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                ) : null
              }
            >
              {confirmingDelete && (
                <div className="my-1.5 flex items-center justify-between gap-2 rounded-md bg-rose-50 dark:bg-rose-950/60 px-3 py-2 text-xs text-rose-700 dark:text-rose-300">
                  <span>Delete this bill? This can&apos;t be undone.</span>
                  <span className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="px-2 py-1 rounded font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={deleteBill}
                      disabled={deleting}
                      className="px-2 py-1 rounded bg-rose-600 font-semibold text-white cursor-pointer disabled:opacity-60"
                    >
                      {deleting ? 'Deleting…' : 'Delete'}
                    </button>
                  </span>
                </div>
              )}
              {bill && editing ? (
                <BillEditForm
                  bill={bill}
                  onCancel={() => setEditing(false)}
                  onSaved={() => {
                    setEditing(false);
                    onChanged?.();
                  }}
                />
              ) : bill ? (
                <>
                  <Field label="Litres">{formatLitres(bill.litres)}</Field>
                  <Field label="Amount">
                    {bill.amount != null ? formatINR(bill.amount) : null}
                  </Field>
                  <Field label="Rate">{fmtRate(bill.rate)}</Field>
                  <Field label="Refuel time">{bill.at ? formatDateTimeIST(bill.at) : null}</Field>
                  <Field label="Station">{bill.location}</Field>
                  <Field label="Fuel">
                    {[bill.fuelType, bill.fillingType?.replace('_', ' ')]
                      .filter(Boolean)
                      .join(' · ') || null}
                  </Field>
                  <Field label="Driver">{bill.driverName}</Field>
                  <Field label="Odometer">
                    {bill.odometer != null ? (
                      <span title={odoMeta?.hint}>
                        {formatKm(bill.odometer)}
                        {odoMeta?.suffix ? ` (${odoMeta.suffix})` : ''}
                      </span>
                    ) : null}
                  </Field>
                  {bill.channel && <Field label="Submitted via">{bill.channel}</Field>}
                  {bill.documentId && (
                    <div className="pt-2.5">
                      <button
                        type="button"
                        onClick={openBill}
                        disabled={openingBill}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-60"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {openingBill ? 'Opening…' : 'View bill'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="py-1.5 text-xs text-slate-500">No bill matched to this fill yet.</p>
              )}
            </Section>

            <Section icon={<Fuel className="w-3.5 h-3.5" />} title="Tank sensor">
              {sensor ? (
                <>
                  <Field label="Litres">
                    {isGlitch ? (
                      'Not a refuel'
                    ) : sensor.litres != null ? (
                      <>
                        {formatLitres(sensor.litres)}
                        {sensor.bandL != null && ` ± ${sensor.bandL.toFixed(1)} L`}
                      </>
                    ) : null}
                  </Field>
                  <Field label="Gauge rose">
                    {sensor.rawLitres != null ? (
                      <span className={isGlitch ? 'line-through' : undefined}>
                        {formatLitres(sensor.rawLitres)}
                      </span>
                    ) : null}
                  </Field>
                  <Field label="Correction">
                    {correction ? (
                      <span title={calibrationHint(sensor.gainBills)}>
                        {correction.label} · {calibrationHint(sensor.gainBills)}
                      </span>
                    ) : isGlitch ? (
                      'Gauge glitch'
                    ) : null}
                  </Field>
                  <Field label="Detected at">
                    {sensor.at ? formatDateTimeIST(sensor.at) : null}
                  </Field>
                  <Field label="Pump">{sensor.pumpName}</Field>
                  <Field label="Location">
                    {sensor.lat != null && sensor.lng != null
                      ? `${sensor.lat.toFixed(4)}, ${sensor.lng.toFixed(4)}`
                      : null}
                  </Field>
                  <Field label="Confidence">{sensor.confirmationStatus}</Field>
                </>
              ) : (
                <p className="py-1.5 text-xs text-slate-500">
                  No tank-level rise matched to this bill.
                </p>
              )}
            </Section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
