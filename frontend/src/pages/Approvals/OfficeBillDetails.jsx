import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import safeText from '../../utils/redactSensitive';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import billPhotoService from '../../services/billPhotoService';
import { BillThumbnail } from '../Mileage/BillsTable';
import { billDateInfo, formatBillDate } from '../Mileage/billDates';
import { candidateRows } from '../Mileage/billPhotoModel';

const show = (v) => (v == null || v === '' ? 'Unknown' : String(v));
const time = (v) =>
  v && !Number.isNaN(Date.parse(v))
    ? new Date(v).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : 'Unknown';
const role = (v) =>
  ({ OWNER: 'Owner', MANAGER: 'Manager' })[String(v || '').toUpperCase()] || 'Unknown';
// Only display explicit names, never IDs or contact details.
const name = (v, fallback) =>
  typeof v === 'object' && v
    ? safeText(v.name || v.fullName || fallback) || 'Unknown'
    : safeText(fallback) || 'Unknown';
const identity = (person, named, personRole) =>
  `${name(person, named)} · ${role(person?.role || personRole)}`;

export function HistoryDrawer({ capture, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!capture) return undefined;
    const controller = new AbortController();
    setData(null);
    setError('');
    billPhotoService
      .getBillLinkHistory(capture.id, { signal: controller.signal })
      .then(setData)
      .catch(() => {
        if (!controller.signal.aborted) setError('Could not load the log.');
      });
    return () => controller.abort();
  }, [capture]);
  return (
    <Sheet
      open={Boolean(capture)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="w-full !max-w-[460px] overflow-y-auto bg-[var(--rd-card)]">
        <SheetHeader>
          <SheetTitle>Bill log</SheetTitle>
          <SheetDescription>History for this bill</SheetDescription>
        </SheetHeader>
        {error && <p role="alert">{error}</p>}
        {!data && !error && <p>Loading log…</p>}
        {data?.entries?.length === 0 && <p>No log entries yet.</p>}
        {data?.entries?.map((entry, i) => {
          const kind = String(entry.action || entry.type || entry.event || 'EDITED').toUpperCase();
          const label = kind.includes('UPLOAD')
            ? 'Uploaded'
            : kind.includes('CONFIRM')
              ? 'Confirmed'
              : 'Edited';
          return (
            <div key={`${entry.at}-${i}`} className="my-3 border-b border-[var(--rd-line)] pb-3">
              <strong>{label}</strong>
              <p>
                {identity(
                  entry.actor || entry.by,
                  entry.actorName || entry.byName,
                  entry.actorRole || entry.role,
                )}{' '}
                · {time(entry.at || entry.createdAt)}
              </p>
              {entry.fromRegistration && (
                <p>
                  {show(entry.fromRegistration)} → {show(entry.toRegistration)}
                </p>
              )}
              {entry.reason && <p>Reason: {safeText(entry.reason)}</p>}
            </div>
          );
        })}
      </SheetContent>
    </Sheet>
  );
}

export function ConfirmedBillRow({ capture, index, vehicles, onUpdated, onHistory }) {
  const [editing, setEditing] = useState(false);
  const [truck, setTruck] = useState(capture.link?.registrationNumber || '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState(false);
  const norm = (v) =>
    String(v || '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
  const valid = vehicles.some((v) => norm(v.registrationNumber) === norm(truck));
  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await billPhotoService.editBillLink(capture.id, {
        registrationNumber: truck,
        reason: reason.trim(),
      });
      setEditing(false);
      setReason('');
      onUpdated();
    } catch (e) {
      setError(
        (e?.status ?? e?.response?.status) === 409
          ? 'This link cannot be changed. It may be attached to a trip, have multiple fuel logs, or have an ambiguous registration.'
          : 'Could not change truck. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };
  const top = candidateRows(capture.suggestion)[0];
  const disagreement =
    capture.suggestion?.decision === 'AUTO' &&
    top &&
    truck &&
    norm(truck) !== norm(top.registrationNumber);
  const ocr = capture.ocr || {};
  const link = capture.link || {};
  // The bill cell reads like the shared bill table: what was bought, the money,
  // then the details grouped under "Bill" and "Pump & truck".
  const dash = (value) => (value == null || value === '' ? '\u2014' : String(value));
  const money = (value) => {
    if (value == null || value === '') return '\u2014';
    const amount = Number(value);
    return Number.isFinite(amount) ? '\u20b9' + amount.toLocaleString('en-IN') : '\u2014';
  };
  const dateInfo = billDateInfo(ocr.printedDate || ocr.date || null);
  const litresText = ocr.litres == null || ocr.litres === '' ? '\u2014' : `${ocr.litres} L`;
  const rateText = ocr.rate == null || ocr.rate === '' ? '\u2014' : `₹${ocr.rate}/L`;
  return (
    <tr>
      <td data-label="#">{index + 1}</td>
      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a data cell, not a control (no grid role); its text sits deeper than the rule scans */}
      <td data-label="Bill">
        <div className="bp-bill">
          <div className="bp-bill__head">
            <span className="bp-bill__amount">{litresText}</span>
            <span className="bp-bill__rate">{rateText}</span>
            {ocr.fuelType ? <span className="bp-badge">{ocr.fuelType}</span> : null}
          </div>
          <div className="bp-bill__sub">{money(ocr.amount)}</div>
          <dl className="bp-bill__meta">
            <div className="bp-bill__group">
              <dt className="bp-bill__group-label">Bill</dt>
              <div className="bp-bill__group-grid">
                <div className="bp-bill__pair">
                  <dt>Date</dt>
                  <dd className={dateInfo.text ? '' : 'is-empty'}>
                    {dash(dateInfo.text)}
                    {dateInfo.yearWarning ? (
                      <span className="bp-bill__warning"> {dateInfo.yearWarning}</span>
                    ) : null}
                  </dd>
                </div>
                <div className="bp-bill__pair">
                  <dt>Time</dt>
                  <dd>{dash(ocr.printedTime)}</dd>
                </div>
                <div className="bp-bill__pair">
                  <dt>Receipt no.</dt>
                  <dd>{dash(ocr.receiptNo)}</dd>
                </div>
              </div>
            </div>
            <div className="bp-bill__group">
              <dt className="bp-bill__group-label">Pump &amp; truck</dt>
              <div className="bp-bill__group-grid">
                <div className="bp-bill__pair">
                  <dt>Pump / station</dt>
                  <dd>{dash(ocr.pump || ocr.station)}</dd>
                </div>
                <div className="bp-bill__pair">
                  <dt>Truck on bill</dt>
                  <dd>{dash(ocr.vehicleNo || ocr.vehicleNumber || ocr.registrationNumber)}</dd>
                </div>
                <div className="bp-bill__pair">
                  <dt>Odometer</dt>
                  <dd>
                    {dash(
                      ocr.odometer == null || ocr.odometer === '' ? null : `${ocr.odometer} km`,
                    )}
                  </dd>
                </div>
              </div>
            </div>
          </dl>
        </div>
      </td>
      <td data-label="Photo">
        <button
          type="button"
          onClick={() => setPhoto(true)}
          aria-label={`Open bill photo ${index + 1}`}
        >
          <BillThumbnail capture={capture} />
        </button>
        <Dialog open={photo} onOpenChange={setPhoto}>
          <DialogContent>
            <DialogTitle>Bill photo</DialogTitle>
            <BillThumbnail capture={capture} large />
          </DialogContent>
        </Dialog>
      </td>
      <td data-label="Truck">
        {show(link.registrationNumber)}
        {editing ? (
          <div>
            <label>
              Change truck{' '}
              <input
                className="bp-select"
                aria-label="Change truck"
                list={`edit-${capture.id}`}
                value={truck}
                onChange={(e) => setTruck(e.target.value)}
              />
            </label>
            <datalist id={`edit-${capture.id}`}>
              {vehicles.map((v) => (
                <option
                  key={v._id || v.id}
                  value={v.registrationNumber}
                  aria-label={v.registrationNumber}
                />
              ))}
            </datalist>
            {disagreement && (
              <p role="alert">
                This differs from the strong prediction {top.registrationNumber}:{' '}
                {top.reasons.join(', ') || 'No evidence provided'}.
              </p>
            )}
            <label>
              Reason (required){' '}
              <input
                className="bp-select"
                aria-label="Reason (required)"
                value={reason}
                maxLength={2000}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <Button
              size="sm"
              disabled={
                saving || !reason.trim() || !valid || norm(truck) === norm(link.registrationNumber)
              }
              onClick={save}
            >
              Save change
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditing(false);
                setTruck(link.registrationNumber || '');
                setError('');
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            Change truck
          </Button>
        )}
        {error && <p role="alert">{error}</p>}
      </td>
      <td data-label="Uploaded by">
        {identity(
          capture.uploadedBy,
          capture.uploaderName || capture.uploadedByName,
          capture.uploaderRole || capture.uploadedByRole,
        )}
        <br />
        {formatBillDate(capture.createdAt || capture.uploadedAt) || '—'}
      </td>
      <td data-label="Confirmed by">
        {identity(
          link.by || link.confirmedBy,
          link.byName || link.confirmedByName,
          link.byRole || link.confirmedByRole,
        )}
        <br />
        {formatBillDate(link.at || link.confirmedAt) || '—'}
        <br />
        {link.via === 'UPLOAD' ? 'at upload' : 'in Approvals'}
      </td>
      <td data-label="Log">
        <Button size="sm" variant="outline" onClick={() => onHistory(capture)}>
          Log
        </Button>
      </td>
    </tr>
  );
}

