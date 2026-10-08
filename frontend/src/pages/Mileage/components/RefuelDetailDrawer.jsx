import React, { useState } from 'react';
import { FileText, Fuel, X } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import DocumentService from '../../Trip/services/DocumentService';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { formatINR, formatKm, formatLitres } from '../../../utils/formatters';
import { ODOMETER_SOURCE_META } from '../mileageRows';

const Field = ({ label, children }) => (
  <div className="flex items-baseline justify-between gap-4 py-1.5 text-xs">
    <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
    <span className="text-right font-medium text-slate-800 dark:text-slate-200 break-words">
      {children ?? '—'}
    </span>
  </div>
);

const Section = ({ icon, title, children }) => (
  <section className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
      {icon}
      {title}
    </h3>
    <div className="divide-y divide-slate-100 dark:divide-slate-800">{children}</div>
  </section>
);

const fmtRate = (rate) =>
  rate?.value != null
    ? `${formatINR(rate.value, { decimals: 2 })}/L${rate.provenance === 'CALCULATED' ? ' (amount ÷ litres)' : ''}`
    : null;

/**
 * One refuel, bill beside tank sensor. `detail` is the normalised shape from
 * mileageRows.drawerFromLiveRow / drawerFromReconciliationRow, so both tabs
 * share this drawer without either pretending to be a FuelComparisonTask.
 */
export default function RefuelDetailDrawer({ detail, onClose }) {
  const [openingBill, setOpeningBill] = useState(false);
  const bill = detail?.bill;
  const sensor = detail?.sensor;

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

  const odoMeta = bill?.odometerSource ? ODOMETER_SOURCE_META[bill.odometerSource] : null;

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
            {(detail.varianceL != null || detail.variancePct != null) && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-xs">
                <div className="text-slate-500 dark:text-slate-400">Tank rise − billed litres</div>
                <div
                  className={`mt-0.5 font-mono text-base font-bold ${
                    detail.varianceL < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {detail.varianceL != null
                    ? `${detail.varianceL > 0 ? '+' : ''}${detail.varianceL.toFixed(1)} L`
                    : '—'}
                  {detail.variancePct != null && (
                    <span className="ml-1.5 text-xs font-medium text-slate-500">
                      ({detail.variancePct > 0 ? '+' : ''}
                      {detail.variancePct.toFixed(1)}%)
                    </span>
                  )}
                </div>
                {detail.varianceL < 0 && (
                  <div className="mt-1 text-slate-500 dark:text-slate-400">
                    The bill claims more fuel than reached the tank.
                  </div>
                )}
              </div>
            )}

            <Section icon={<FileText className="w-3.5 h-3.5" />} title="Bill">
              {bill ? (
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
                  <Field label="Level rise">{formatLitres(sensor.litres)}</Field>
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
