import React, { useState } from 'react';
import { FileText, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import StatusChip from '../../../components/ui/StatusChip';
import FuelBillPopup from '../../../components/ui/FuelBillPopup';
import { useMutation } from '../../../hooks/useMutation';
import { toneOf } from '../../../lib/vocabulary';
import DocumentService from '../../Trip/services/DocumentService';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { formatINR, formatKm, formatLitres } from '../../../utils/formatters';
import { MileageApi } from '../mileageApi';
import { ODOMETER_SOURCE, fillVerdict } from '../mileageRows';
import BillEditForm from './BillEditForm';
import ExplanationLines from './ExplanationLines';

const Row = ({ label, children }) => (
  <div className="mhub-kv">
    <span>{label}</span>
    <span>{children ?? '—'}</span>
  </div>
);

const rateText = (rate) =>
  rate?.value != null ? `${formatINR(rate.value, { decimals: 2 })} a litre` : null;

/**
 * One fill: what happened in a sentence, what to do, then the bill and the
 * tank. `detail` comes from mileageRows.drawerFromLiveRow /
 * drawerFromReconciliationRow, so both lists share this drawer.
 */
export default function RefuelDetailDrawer({ detail, onClose, canEdit = false, onChanged }) {
  const [openingBill, setOpeningBill] = useState(false);
  const [billPreview, setBillPreview] = useState(null); // { url, title } | null
  const [mode, setMode] = useState('view'); // 'view' | 'edit' | 'confirm-delete'
  const remove = useMutation((id, opts) => MileageApi.deleteBill(id, opts));
  const bill = detail?.bill;
  const sensor = detail?.sensor;
  const verdict = fillVerdict(detail);

  // A new fill opens in read mode with no photo up.
  const [shownDetail, setShownDetail] = useState(detail);
  if (shownDetail !== detail) {
    setShownDetail(detail);
    setMode('view');
    setBillPreview(null);
  }

  const openBill = async () => {
    if (!bill?.documentId) return;
    setOpeningBill(true);
    try {
      const doc = await DocumentService.getDocument(bill.documentId);
      const url = doc?.publicUrl || doc?.data?.publicUrl;
      // Shown in place: a window.open after the await is no longer a user
      // gesture, so popup blockers drop it.
      if (url) setBillPreview({ url, title: `Fuel bill · ${detail?.title || ''}`.trim() });
      else toast.error('This bill has no photo.');
    } catch {
      toast.error('Could not open the bill photo. Try again.');
    } finally {
      setOpeningBill(false);
    }
  };

  const deleteBill = async () => {
    try {
      await remove.mutate(bill.id);
      toast.success('Bill deleted');
      onChanged?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete the bill. Try again.');
    }
  };

  const odoSource = bill?.odometerSource ? ODOMETER_SOURCE[bill.odometerSource] : null;
  const editable = canEdit && bill?.id;

  return (
    <Sheet
      open={Boolean(detail)}
      // The bill photo sits above the drawer: its clicks and Esc must not
      // close the drawer underneath.
      disablePointerDismissal={Boolean(billPreview)}
      onOpenChange={(open) => {
        if (!open && !billPreview) onClose();
      }}
    >
      <SheetContent className="w-full !max-w-[440px] gap-0 p-0">
        <SheetHeader className="shrink-0 items-start gap-3">
          <div className="min-w-0 flex flex-col gap-1.5">
            <SheetTitle className="flex items-center gap-2">
              <span className="mhub-plate">{detail?.title || '—'}</span>
              {detail?.result && <StatusChip group="refuel" value={detail.result} />}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {detail?.subtitle || 'Diesel fill'}
            </SheetDescription>
          </div>
          <SheetClose className="pshell-btn" aria-label="Close">
            <X size={16} />
          </SheetClose>
        </SheetHeader>

        {detail && (
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {verdict && (
              <div className={`mhub-verdict mhub-verdict--${toneOf('refuel', detail.result)}`}>
                <strong>{verdict.headline}</strong>
                <span>{verdict.next}</span>
              </div>
            )}

            <section className="mhub-box">
              <h3>
                <span>Bill</span>
                {editable && mode === 'view' && (
                  <span className="flex gap-1">
                    <button type="button" className="pshell-btn" onClick={() => setMode('edit')}>
                      <Pencil size={13} aria-hidden /> Edit
                    </button>
                    <button
                      type="button"
                      className="pshell-btn pshell-btn--danger"
                      onClick={() => setMode('confirm-delete')}
                    >
                      <Trash2 size={13} aria-hidden /> Delete
                    </button>
                  </span>
                )}
              </h3>
              {mode === 'confirm-delete' && (
                <div className="mhub-verdict mhub-verdict--critical my-1.5">
                  <strong>Delete this bill?</strong>
                  <span>This can’t be undone.</span>
                  <span className="mhub-actions">
                    <button type="button" className="pshell-btn" onClick={() => setMode('view')}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="pshell-btn pshell-btn--danger"
                      onClick={deleteBill}
                      disabled={remove.loading}
                    >
                      {remove.loading ? 'Deleting…' : 'Delete'}
                    </button>
                  </span>
                </div>
              )}
              {bill && mode === 'edit' ? (
                <BillEditForm
                  bill={bill}
                  onCancel={() => setMode('view')}
                  onSaved={() => {
                    setMode('view');
                    onChanged?.();
                  }}
                />
              ) : bill ? (
                <>
                  <Row label="Diesel">{formatLitres(bill.litres)}</Row>
                  <Row label="Amount">{bill.amount != null ? formatINR(bill.amount) : null}</Row>
                  <Row label="Rate">{rateText(bill.rate)}</Row>
                  <Row label="Filled at">{bill.at ? formatDateTimeIST(bill.at) : null}</Row>
                  <Row label="Pump">{bill.location}</Row>
                  <Row label="Driver">{bill.driverName}</Row>
                  <Row label="Odometer">
                    {bill.odometer != null
                      ? `${formatKm(bill.odometer)}${odoSource ? ` (${odoSource})` : ''}`
                      : null}
                  </Row>
                  {bill.fillingType && (
                    <Row label="Fill">
                      {bill.fillingType === 'FULL_TANK' ? 'Full tank' : 'Part tank'}
                    </Row>
                  )}
                  {bill.channel && <Row label="Sent by">{bill.channel}</Row>}
                  {bill.documentId && (
                    <div className="mhub-actions">
                      <button
                        type="button"
                        className="pshell-btn pshell-btn--primary"
                        onClick={openBill}
                        disabled={openingBill}
                      >
                        <FileText size={14} aria-hidden />
                        {openingBill ? 'Opening…' : 'See bill photo'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p className="mhub-note">No bill for this fill yet.</p>
              )}
            </section>

            <section className="mhub-box">
              <h3>
                <span>Tank sensor</span>
              </h3>
              {sensor ? (
                <>
                  <Row label="Diesel into tank">
                    {detail.result === 'GAUGE_JUMP'
                      ? 'None (gauge jump)'
                      : formatLitres(sensor.litres)}
                  </Row>
                  <Row label="Seen at">{sensor.at ? formatDateTimeIST(sensor.at) : null}</Row>
                  <Row label="Where">
                    {sensor.pumpName ||
                      (sensor.lat != null && sensor.lng != null
                        ? `${sensor.lat.toFixed(4)}, ${sensor.lng.toFixed(4)}`
                        : null)}
                  </Row>
                </>
              ) : (
                <p className="mhub-note">The tank sensor saw no refill around this time.</p>
              )}
            </section>

            {detail.explanation && (
              <details className="mhub-how mhub-box">
                <summary>How we worked this out</summary>
                <p>{detail.explanation.text}</p>
                <ExplanationLines lines={detail.explanation.lines} />
              </details>
            )}
          </div>
        )}
      </SheetContent>
      {billPreview && (
        <FuelBillPopup
          imageSrc={billPreview.url}
          title={billPreview.title}
          onClose={() => setBillPreview(null)}
        />
      )}
    </Sheet>
  );
}
