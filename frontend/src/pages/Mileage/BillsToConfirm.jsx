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

// Each row owns its timer and request, so one slow matcher cannot block the rest.
function useSuggestion(capture, onMatched) {
  const [suggestion, setSuggestion] = useState(capture.suggestion);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState('idle');
  const [retryKey, setRetryKey] = useState(0);
  const savedDecision = capture.suggestion?.decision;
  useEffect(() => {
    if (savedDecision === 'AUTO' || savedDecision === 'ASK') setSuggestion(capture.suggestion);
  }, [capture.suggestion, savedDecision]);
  useEffect(() => {
    if (!retryKey && (savedDecision === 'AUTO' || savedDecision === 'ASK')) return undefined;
    const controller = new AbortController();
    let timer;
    let count = 0;
    const run = async () => {
      setState('loading');
      try {
        const result = await billPhotoService.getBillSuggestion(capture.id, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (!['AUTO', 'ASK'].includes(result?.decision))
          throw new Error('Suggestion is still being prepared.');
        setSuggestion(result);
        setState('ready');
        onMatched(capture.id, result);
      } catch (error) {
        if (controller.signal.aborted) return;
        count += 1;
        setAttempt(count);
        const status = statusOf(error);
        if (count >= 5 || [401, 403, 404].includes(status)) {
          setState('failed');
          return;
        }
        setState('waiting');
        timer = setTimeout(run, Math.min(2000 * 2 ** (count - 1), 16000));
      }
    };
    run();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
    // A retry key deliberately starts a new matcher run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capture.id, retryKey, onMatched]);
  return {
    suggestion,
    state,
    attempt,
    retry: () => {
      setAttempt(0);
      setRetryKey((n) => n + 1);
    },
  };
}

function BillThumbnail({ capture }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!capture.thumbnailUrl) return undefined;
    const controller = new AbortController();
    let objectUrl;
    // The server supplies the first page URL. Its final component is the page index.
    const index = Number(capture.thumbnailUrl.split('/').pop());
    if (!Number.isInteger(index) || index < 0) {
      setFailed(true);
      return undefined;
    }
    billPhotoService
      .getBillPage(capture.id, index, { signal: controller.signal })
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [capture.id, capture.thumbnailUrl]);
  if (!capture.thumbnailUrl || failed)
    return <span className="text-[var(--rd-ink-3)]">Photo unavailable</span>;
  return url ? (
    <img src={url} alt="Bill thumbnail" className="h-20 w-20 rounded object-cover" />
  ) : (
    <span>Loading photo…</span>
  );
}

function PendingBill({ capture, vehicles, choice, onChoice, errors, onMatched }) {
  const { suggestion, state, attempt, retry } = useSuggestion(capture, onMatched);
  const candidates = candidateRows(suggestion),
    top = candidates[0];
  const chosen =
    choice ??
    capture.vehicleHint ??
    (suggestion?.decision === 'AUTO' ? top?.registrationNumber : '') ??
    '';
  const mismatch =
    suggestion?.decision === 'AUTO' &&
    top &&
    chosen &&
    normalise(chosen) !== normalise(top.registrationNumber);
  return (
    <article
      className="my-3 min-w-0 break-words rounded-lg border border-[var(--rd-line)] p-3"
      aria-label={`Bill ${capture.id}`}
    >
      <div className="flex items-start gap-3">
        <BillThumbnail capture={capture} />
        <div>
          <strong>Bill {capture.id}</strong>
          <p>
            Litres: {show(capture.ocr?.litres)} · Time: {formatTime(capture.ocr?.time)} · Pump:{' '}
            {show(capture.ocr?.pump)}
          </p>
          <p>Confidence: {top?.score == null ? 'Unknown' : `${Math.round(top.score * 100)}%`}</p>
        </div>
      </div>
      {(state === 'loading' || state === 'waiting') && (
        <p>Finding a suggestion{attempt ? ` (retry ${attempt})` : ''}…</p>
      )}
      {state === 'failed' && (
        <p role="alert">
          Suggestion unavailable. The photo may still be processing.{' '}
          <Button size="sm" variant="outline" onClick={retry}>
            Retry suggestion
          </Button>
        </p>
      )}
      {['AUTO', 'ASK'].includes(suggestion?.decision) && (
        <Button
          size="sm"
          variant="outline"
          onClick={retry}
          disabled={state === 'loading' || state === 'waiting'}
        >
          Refresh suggestion
        </Button>
      )}
      {['MARKET_TRUCK', 'NO_TRUCK_WITH_THESE_DIGITS'].includes(suggestion?.askReason) && (
        <p className="mt-2 text-sm">The truck on this bill is not one of your trucks.</p>
      )}
      {suggestion?.decision === 'ASK' && (
        <p className="mt-2 font-medium">Which truck is this bill for?</p>
      )}
      {suggestion?.decision === 'AUTO' && top && (
        <p className="mt-2 font-medium">Suggested truck: {top.registrationNumber}</p>
      )}
      {candidates.map((candidate, index) => (
        <label key={candidate.registrationNumber} className="block">
          <input
            type="radio"
            name={`bill-${capture.id}`}
            aria-label={candidate.registrationNumber}
            checked={chosen === candidate.registrationNumber}
            onChange={() => onChoice(candidate.registrationNumber)}
          />{' '}
          {candidate.registrationNumber} {index === 0 && '(Top prediction)'}{' '}
          {candidate.reasons.length > 0 && `— ${candidate.reasons.join(' · ')}`}
        </label>
      ))}
      <label>
        Truck{' '}
        <input
          className="bp-select"
          aria-label="Truck"
          list={`fleet-${capture.id}`}
          value={chosen}
          onChange={(e) => onChoice(e.target.value)}
          placeholder="Search trucks"
        />
      </label>
      <datalist id={`fleet-${capture.id}`}>
        {vehicles.map((v) => (
          <option key={v._id} value={v.registrationNumber} aria-label={v.registrationNumber} />
        ))}
      </datalist>
      {mismatch && (
        <p role="alert">
          This differs from the strong prediction {top.registrationNumber}:{' '}
          {top.reasons.join(' · ') || 'No evidence provided'}.
        </p>
      )}
      {errors?.map((message, i) => (
        <p role="alert" key={`${i}-${message}`}>
          {message}
        </p>
      ))}
    </article>
  );
}

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

export default function BillsToConfirm({ uploads = [], vehicles = [] }) {
  const [tab, setTab] = useState('pending');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [choices, setChoices] = useState({});
  const [review, setReview] = useState(false);
  const [error, setError] = useState('');
  const [linkErrors, setLinkErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState(null);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((n) => n + 1), []);
  const matched = useCallback(
    (id, suggestion) => {
      setData((current) =>
        current
          ? {
              ...current,
              captures: current.captures.map((row) =>
                row.id === id ? { ...row, suggestion } : row,
              ),
            }
          : current,
      );
      refresh();
    },
    [refresh],
  );
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
        if (!controller.signal.aborted) setError(`Could not load bills: ${errorText(e)}`);
      });
    return () => controller.abort();
  }, [tab, page, revision, sentCount]);
  const rows = data?.captures || [];
  const selection = (c) =>
    choices[c.id] ??
    c.vehicleHint ??
    (c.suggestion?.decision === 'AUTO' ? candidateRows(c.suggestion)[0]?.registrationNumber : '') ??
    '';
  const submit = async () => {
    setSaving(true);
    setError('');
    setLinkErrors({});
    try {
      await billPhotoService.saveBillLinks(
        rows.map((c) => ({ captureId: c.id, registrationNumber: selection(c), reason: null })),
      );
      setReview(false);
      setChoices({});
      refresh();
    } catch (e) {
      const details = e?.body?.errors ?? e?.response?.data?.errors;
      if (statusOf(e) === 422 && Array.isArray(details)) {
        const mapped = {};
        details.forEach((item) => {
          const id = item.captureId || rows[item.index]?.id;
          if (id) mapped[id] = item.errors || ['Invalid link'];
        });
        setLinkErrors(mapped);
        setError('No bills were submitted. Please correct the highlighted bills.');
      } else setError(`Could not submit bills: ${errorText(e)}`);
    } finally {
      setSaving(false);
    }
  };
  const selectTab = (next) => {
    if (saving || next === tab) return;
    setData(null);
    setTab(next);
    setPage(1);
    setReview(false);
    setLinkErrors({});
  };
  return (
    <section
      className="my-4 rounded border border-[var(--rd-line)] bg-[var(--rd-card)] p-4 text-[var(--rd-ink)]"
      aria-label="Bills to confirm"
    >
      <h2 className="text-base font-semibold">{review ? 'Review & submit' : 'Bills to confirm'}</h2>
      {review && <p>Reviewing the bills on this page. Submit saves them together.</p>}
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
      {rows.map((c) =>
        tab === 'pending' ? (
          <PendingBill
            key={c.id}
            capture={c}
            vehicles={vehicles}
            choice={choices[c.id]}
            onChoice={(value) => setChoices((old) => ({ ...old, [c.id]: value }))}
            errors={linkErrors[c.id]}
            onMatched={matched}
          />
        ) : (
          <SubmittedBill
            key={c.id}
            capture={c}
            vehicles={vehicles}
            onUpdated={refresh}
            onHistory={setHistory}
          />
        ),
      )}
      {data && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={saving || page === 1}
            onClick={() => {
              setData(null);
              setPage((n) => n - 1);
              setReview(false);
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
            disabled={saving || page * 50 >= data.total}
            onClick={() => {
              setData(null);
              setPage((n) => n + 1);
              setReview(false);
            }}
          >
            Next
          </Button>
        </div>
      )}
      {tab === 'pending' && review && rows.some((c) => !isFleetTruck(vehicles, selection(c))) && (
        <p className="mt-3 text-sm">Choose one of your trucks for every bill before submitting.</p>
      )}
      {tab === 'pending' &&
        rows.length > 0 &&
        (review ? (
          <div className="mt-3 flex gap-2">
            <Button
              onClick={submit}
              disabled={saving || rows.some((c) => !isFleetTruck(vehicles, selection(c)))}
            >
              Submit
            </Button>
            <Button variant="outline" onClick={() => setReview(false)}>
              Review later
            </Button>
          </div>
        ) : (
          <Button className="mt-3" onClick={() => setReview(true)}>
            Review now
          </Button>
        ))}
      <HistoryDrawer capture={history} onClose={() => setHistory(null)} />
    </section>
  );
}
