import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import billPhotoService from '../../services/billPhotoService';
import { candidateRows } from './billPhotoModel';
import BillsTable, { BillThumbnail } from './BillsTable';

const show = (value) => (value == null || value === '' ? 'Unknown' : String(value));
const errorText = (error) =>
  error?.displayMessage || error?.body?.message || error?.message || 'Please try again.';
const statusOf = (error) => error?.status ?? error?.response?.status;
const formatTime = (value) =>
  value && !Number.isNaN(Date.parse(value))
    ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    : 'Unknown';
const normalise = (value) => (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const isFleetTruck = (vehicles, registration) =>
  Boolean(
    registration &&
    vehicles.some((v) => normalise(v.registrationNumber) === normalise(registration)),
  );

function HistoryDrawer({ capture, onClose }) {
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
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorText(e));
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
          <SheetTitle>Link history</SheetTitle>
          <SheetDescription>Corrections for bill {capture?.id}</SheetDescription>
        </SheetHeader>
        {error && <p role="alert">{error}</p>}
        {!data && !error && <p>Loading history…</p>}
        {data?.entries?.length === 0 && <p>No corrections yet.</p>}
        {data?.entries?.map((entry, i) => (
          <div key={`${entry.at}-${i}`} className="my-3 border-b border-[var(--rd-line)] pb-3">
            <p>
              {show(entry.fromRegistration)} → {show(entry.toRegistration)}
            </p>
            <p>
              By {show(entry.actorId)} · {formatTime(entry.at)}
            </p>
            <p>Reason: {show(entry.reason)}</p>
          </div>
        ))}
      </SheetContent>
    </Sheet>
  );
}

function SubmittedBill({ capture, vehicles, onUpdated, onHistory }) {
  const [editing, setEditing] = useState(false);
  const [truck, setTruck] = useState(capture.link?.registrationNumber || '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [latest, setLatest] = useState(null);
  useEffect(() => {
    if (!capture.link?.edited) {
      setLatest(null);
      return undefined;
    }
    const controller = new AbortController();
    billPhotoService
      .getBillLinkHistory(capture.id, { signal: controller.signal })
      .then((data) => setLatest(data?.entries?.[0] || null))
      .catch(() => {});
    return () => controller.abort();
  }, [capture.id, capture.link?.edited, capture.link?.registrationNumber]);
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
        statusOf(e) === 409
          ? `This link cannot be changed. It may be attached to a trip, have multiple fuel logs, or have an ambiguous registration. ${errorText(e)}`
          : errorText(e),
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
    normalise(truck) !== normalise(top.registrationNumber);
  return (
    <article
      className="my-3 rounded border border-[var(--rd-line)] p-3"
      aria-label={`Submitted bill ${capture.id}`}
    >
      <div className="flex gap-3">
        <BillThumbnail capture={capture} />
        <div>
          <strong>Bill {capture.id}</strong>
          <p>
            Litres: {show(capture.ocr?.litres)} · Time: {formatTime(capture.ocr?.time)} · Pump:{' '}
            {show(capture.ocr?.pump)}
          </p>
          <p>Truck: {show(capture.link?.registrationNumber)}</p>
          <p>
            Originally submitted by {show(capture.link?.by)} · {formatTime(capture.link?.at)}
            {capture.link?.edited ? ' · Edited' : ''}
          </p>
          {capture.link?.edited && (
            <p>
              Last changed by {show(latest?.actorId)} at {formatTime(latest?.at)}
            </p>
          )}
        </div>
      </div>
      {editing ? (
        <div className="flex flex-col items-start gap-2">
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
              <option key={v._id} value={v.registrationNumber} aria-label={v.registrationNumber} />
            ))}
          </datalist>
          {disagreement && (
            <p role="alert">
              This differs from the strong prediction {top.registrationNumber}:{' '}
              {top.reasons.join(' ? ') || 'No evidence provided'}.
            </p>
          )}
          <label>
            Reason (required){' '}
            <input
              className="bp-select"
              aria-label="Reason"
              value={reason}
              maxLength={2000}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={
                saving ||
                !reason.trim() ||
                truck === capture.link?.registrationNumber ||
                !isFleetTruck(vehicles, truck)
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
                setError('');
                setTruck(capture.link?.registrationNumber || '');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setTruck(capture.link?.registrationNumber || '');
              setEditing(true);
            }}
          >
            Change truck
          </Button>
          <Button size="sm" variant="outline" onClick={() => onHistory(capture)}>
            History
          </Button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </article>
  );
}

export default function BillsToConfirm({ uploads = [], vehicles = [], onAvailability }) {
  const [tab, setTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(null);
  const [revision, setRevision] = useState(0);
  const [unavailable, setUnavailable] = useState(false);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  const markUnavailable = useCallback(() => {
    setUnavailable(true);
    onAvailability?.(false);
  }, [onAvailability]);
  const sentCount = uploads.filter((r) => r.status === 'sent').length;
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    billPhotoService
      .listBillCaptures({ status: tab, page, limit: 50, signal: controller.signal })
      .then((next) => {
        if (controller.signal.aborted) return;
        if (!next || !Array.isArray(next.captures)) throw new Error('Invalid bill list response');
        setData((old) => ({
          ...next,
          captures: next.captures.map((row) => {
            const prior = old?.captures?.find((item) => item.id === row.id);
            return row.suggestion?.decision === 'pending' &&
              ['AUTO', 'ASK'].includes(prior?.suggestion?.decision)
              ? { ...row, suggestion: prior.suggestion }
              : row;
          }),
        }));
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          if (statusOf(e) === 404) {
            markUnavailable();
          } else setError(`Could not load bills: ${errorText(e)}`);
        }
      });
    return () => controller.abort();
  }, [tab, page, revision, sentCount, markUnavailable]);
  const rows = data?.captures || [];
  const selectTab = (next) => {
    if (next === tab) return;
    setData(null);
    setTab(next);
    setPage(1);
  };
  if (unavailable) return null;
  return (
    <section
      className="my-4 rounded border border-[var(--rd-line)] bg-[var(--rd-card)] p-4 text-[var(--rd-ink)]"
      aria-label="Bills to confirm"
    >
      <h2 className="text-base font-semibold">Bills to confirm</h2>
      <div role="tablist" aria-label="Bill status" className="flex gap-2">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'pending'}
          onClick={() => selectTab('pending')}
        >
          Pending
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'submitted'}
          onClick={() => selectTab('submitted')}
        >
          Submitted
        </button>
      </div>
      {error && (
        <p role="alert">
          {error}{' '}
          <button type="button" onClick={refresh}>
            Refresh
          </button>
        </p>
      )}
      {!data && !error && <p>Loading bills…</p>}
      {data && !rows.length && <p>No {tab} bills.</p>}
      {tab === 'pending' ? (
        <BillsTable
          rows={rows}
          vehicles={vehicles}
          onSaved={refresh}
          onUnavailable={markUnavailable}
        />
      ) : (
        rows.map((c) => (
          <SubmittedBill
            key={c.id}
            capture={c}
            vehicles={vehicles}
            onUpdated={refresh}
            onHistory={setHistory}
          />
        ))
      )}
      {data && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => {
              setData(null);
              setPage((n) => n - 1);
            }}
          >
            Previous
          </Button>
          <span>
            Page {page} · {data.total} bills
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page * 50 >= data.total}
            onClick={() => {
              setData(null);
              setPage((n) => n + 1);
            }}
          >
            Next
          </Button>
        </div>
      )}
      <HistoryDrawer capture={history} onClose={() => setHistory(null)} />
    </section>
  );
}
