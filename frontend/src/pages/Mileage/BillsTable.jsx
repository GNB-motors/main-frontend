import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import billPhotoService from '../../services/billPhotoService';
import { candidateRows } from './billPhotoModel';
import './BillsTable.css';
const statusOf = (error) => error?.status ?? error?.response?.status;
// Each row owns its timer and request, so one slow matcher cannot block the rest.
function useSuggestion(capture, onMatched, skip, onUnavailable) {
  const [suggestion, setSuggestion] = useState(capture.suggestion);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState('idle');
  const [retryKey, setRetryKey] = useState(0);
  const savedDecision = capture.suggestion?.decision;
  useEffect(() => {
    if (savedDecision === 'AUTO' || savedDecision === 'ASK') setSuggestion(capture.suggestion);
  }, [capture.suggestion, savedDecision]);
  useEffect(() => {
    if (skip) return undefined;
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
        if (status === 404) onUnavailable?.();
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
  }, [capture.id, retryKey, onMatched, skip, onUnavailable]);
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

export function BillThumbnail({ capture, file, large = false }) {
  const [url, setUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (file && URL.createObjectURL) {
      const local = URL.createObjectURL(file);
      setUrl(local);
      return () => URL.revokeObjectURL(local);
    }
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
  }, [capture.id, capture.thumbnailUrl, file]);
  if ((!capture.thumbnailUrl && !file) || failed)
    return <span className="text-[var(--rd-ink-3)]">Photo unavailable</span>;
  return url ? (
    <img
      src={url}
      alt="Bill thumbnail"
      className={large ? 'max-h-[75vh] w-auto object-contain' : 'h-20 w-20 rounded object-cover'}
    />
  ) : (
    <span>Loading photo…</span>
  );
}

function BillRow({
  row,
  index,
  vehicles,
  choice,
  onChoice,
  errors,
  onMatched,
  queue,
  onUnavailable,
}) {
  const capture = row.capture || row;
  const confirmed = row.status === 'confirmed';
  const pending = Boolean(row.status && row.status !== 'sent' && !confirmed);
  const { suggestion, state, retry } = useSuggestion(
    capture,
    onMatched,
    pending || confirmed,
    onUnavailable,
  );
  const [editing, setEditing] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const candidates = candidateRows(suggestion);
  const chosen =
    choice ??
    (capture.vehicleHint ||
      (suggestion?.decision === 'AUTO' ? candidates[0]?.registrationNumber : '') ||
      '');
  const ocr = capture.ocr || {};
  const show = (value) => (value == null || value === '' ? '\u2014' : String(value));
  const details = [
    ['Date', ocr.printedDate ?? ocr.date],
    ['Time', ocr.printedTime],
    ['Amount', ocr.amount == null ? null : '\u20b9' + ocr.amount],
    ['Litres', ocr.litres],
    ['Rate', ocr.rate == null ? null : '\u20b9' + ocr.rate + '/L'],
    ['Pump / station', ocr.pump ?? ocr.station],
    ['Truck on bill', ocr.vehicleNo ?? ocr.vehicleNumber ?? ocr.registrationNumber],
    ['Odometer', ocr.odometer == null ? null : ocr.odometer + ' km'],
    ['Fuel', ocr.fuelType],
    ['Receipt no.', ocr.receiptNo],
  ];
  return (
    <tr aria-label={`Bill ${capture.id}`}>
      <td data-label="#">{index + 1}</td>
      <td data-label="Details">
        {details.map(([label, value]) => (
          <div key={label}>
            {label}: {show(value)}
          </div>
        ))}
      </td>
      <td data-label="Photo">
        <button
          type="button"
          onClick={() => setPhotoOpen(true)}
          aria-label={`Open bill photo ${index + 1}`}
        >
          <BillThumbnail capture={capture} file={row.file} />
        </button>
        <Dialog open={photoOpen} onOpenChange={setPhotoOpen}>
          <DialogContent>
            <DialogTitle>Bill photo</DialogTitle>
            <BillThumbnail capture={capture} file={row.file} large />
          </DialogContent>
        </Dialog>
      </td>
      <td data-label="Truck">
        {confirmed ? (
          <p>Confirmed &#10003;</p>
        ) : pending ? (
          row.status === 'failed' ? (
            <>
              <p>Upload failed</p>
              <Button size="sm" onClick={() => queue?.retry(row.id)}>
                Try again
              </Button>
            </>
          ) : row.status === 'duplicate' ? (
            'This photo was already added'
          ) : (
            <p>
              <Loader2 size={16} className="inline animate-spin" /> Reading the bill...
            </p>
          )
        ) : (
          <>
            {(state === 'loading' || state === 'waiting') && (
              <p>
                <Loader2 size={16} className="inline animate-spin" /> Reading the bill...
              </p>
            )}
            {state === 'failed' && (
              <Button size="sm" onClick={retry}>
                Try again
              </Button>
            )}
            {suggestion?.decision === 'AUTO' && !editing && (
              <p>
                {chosen || '\u2014'}{' '}
                <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              </p>
            )}
            {(suggestion?.decision === 'ASK' || (suggestion?.decision === 'AUTO' && editing)) && (
              <>
                {['MARKET_TRUCK', 'NO_TRUCK_WITH_THESE_DIGITS'].includes(suggestion?.askReason) && (
                  <p>Not one of your trucks (market truck?)</p>
                )}
                <p>These might be the truck:</p>
                {candidates.map((candidate) => (
                  <Button
                    key={candidate.registrationNumber}
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-pressed={chosen === candidate.registrationNumber}
                    onClick={() => onChoice(candidate.registrationNumber)}
                  >
                    {candidate.registrationNumber}
                    {candidate.reasons.length ? ' - ' + candidate.reasons.join(' · ') : ''}
                  </Button>
                ))}
                <label>
                  Truck{' '}
                  <input
                    className="bp-select"
                    aria-label="Truck"
                    list={`fleet-${capture.id}`}
                    value={chosen}
                    onChange={(event) => onChoice(event.target.value)}
                    placeholder="Search trucks"
                  />
                </label>
                <datalist id={`fleet-${capture.id}`}>
                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle._id || vehicle.id}
                      value={vehicle.registrationNumber}
                      aria-label={vehicle.registrationNumber}
                    />
                  ))}
                </datalist>
              </>
            )}
            {errors?.map((message, i) => (
              <p role="alert" key={`${i}-${message}`}>
                {message}
              </p>
            ))}
          </>
        )}
      </td>
    </tr>
  );
}
export default function BillsTable({
  rows = [],
  vehicles = [],
  queue,
  onSaved,
  onUnavailable,
  via,
}) {
  const [choices, setChoices] = useState({});
  const [suggestions, setSuggestions] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const matched = useCallback(
    (id, suggestion) => setSuggestions((old) => ({ ...old, [id]: suggestion })),
    [],
  );
  const captures = rows
    .filter((row) => !row.status || row.status === 'sent')
    .map((row) => row.capture || row);
  const selection = (capture) =>
    choices[capture.id] ??
    (capture.vehicleHint ||
      ((suggestions[capture.id] || capture.suggestion)?.decision === 'AUTO'
        ? candidateRows(suggestions[capture.id] || capture.suggestion)[0]?.registrationNumber
        : '') ||
      '');
  const selected = captures.filter((capture) => selection(capture).trim());
  const save = async () => {
    setSaving(true);
    setError('');
    setErrors({});
    try {
      await billPhotoService.saveBillLinks(
        selected.map((capture) => ({
          captureId: capture.id,
          registrationNumber: selection(capture),
          reason: null,
          via,
        })),
      );
      setChoices({});
      onSaved?.(selected.map((capture) => capture.id));
    } catch (err) {
      if (statusOf(err) === 404) {
        onUnavailable?.();
        return;
      }
      const details = err?.body?.errors ?? err?.response?.data?.errors;
      if (statusOf(err) === 422 && Array.isArray(details)) {
        const mapped = {};
        details.forEach((item) => {
          const id = item.captureId || selected[item.index]?.id;
          if (id) mapped[id] = item.errors || ['Please check this bill'];
        });
        setErrors(mapped);
        setError('No bills were saved. Please check the highlighted bills.');
      } else setError('Could not save bills. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      {rows.length > 0 && (
        <div className="bills-table-wrap">
          <table className="bills-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Details</th>
                <th>Photo</th>
                <th>Truck</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const capture = row.capture || row;
                return (
                  <BillRow
                    key={row.id}
                    row={row}
                    index={index}
                    vehicles={vehicles}
                    choice={choices[capture.id]}
                    onChoice={(value) => setChoices((old) => ({ ...old, [capture.id]: value }))}
                    errors={errors[capture.id]}
                    onMatched={matched}
                    onUnavailable={onUnavailable}
                    queue={queue}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
      {rows.length > 0 && (
        <Button disabled={saving || !selected.length} onClick={save}>
          Confirm {selected.length} bills
        </Button>
      )}
    </>
  );
}

