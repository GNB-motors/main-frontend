/* eslint-disable react-refresh/only-export-components -- the bill row and the two helpers it shares with the table live together in this file */
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import billPhotoService from '../../services/billPhotoService';
import SearchableSelect from '../../components/SearchableDropdown/SearchableSelect';
import { candidateRows } from './billPhotoModel';
import { billDateInfo } from './billDates';

export const statusOf = (error) => error?.status ?? error?.response?.status;

// The reason a slip has no truck to offer, in plain words. The backend says it
// for every other case; these two are the ones the person reads most.
const REASON_WORDS = {
  NO_PRINTED_TIME:
    "No time on the photo, so we can't tell which truck was at the pump. Pick the truck.",
  NO_GPS_NEAR_PUMP: "No truck's GPS was near this pump at that time.",
};
const reasonOf = (suggestion) => {
  if (!suggestion) return '';
  const code = suggestion?.why?.code || suggestion?.askReason || '';
  if (REASON_WORDS[code]) return REASON_WORDS[code];
  return suggestion?.why?.text || '';
};

const show = (value) => (value == null || value === '' ? '\u2014' : String(value));
const money = (n) => {
  if (n == null || n === '') return '\u2014';
  const value = Number(n);
  return Number.isFinite(value) ? '\u20b9' + value.toLocaleString('en-IN') : '\u2014';
};

// Each row owns its timer and request, so one slow matcher cannot block the rest.
export function useSuggestion(capture, onMatched, skip, onUnavailable) {
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
      className={
        large
          ? 'max-h-[75vh] w-auto object-contain'
          : 'h-24 w-24 rounded-lg border border-[var(--rd-line)] object-cover'
      }
    />
  ) : (
    <span>Loading photo…</span>
  );
}

// A group of related details under the headline: a heading and its pairs.
function MetaGroup({ label, items }) {
  return (
    <div className="bp-bill__group">
      <dt className="bp-bill__group-label">{label}</dt>
      <div className="bp-bill__group-grid">
        {items.map((item) => (
          <div className="bp-bill__pair" key={item.label}>
            <dt>{item.label}</dt>
            <dd className={item.value == null || item.value === '' ? 'is-empty' : ''}>
              {show(item.value)}
              {item.note ? (
                <span className={item.noteClass || 'bp-stamp-note'}> {item.note}</span>
              ) : null}
            </dd>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BillRow({
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
  // The date and the time of the photo: the paper's own when it prints them,
  // the camera's own stamp when it does not.
  const photo = suggestion?.photo || null;
  const photoDate = photo?.date ?? ocr.printedDate ?? ocr.date ?? null;
  const photoTime = photo?.time ?? ocr.printedTime ?? null;
  const fromStamp = photo?.timeSource === 'stamp';
  // The headline is what was bought; the money sits under it. A date without a
  // year says so rather than guessing one.
  const dateInfo = billDateInfo(photoDate);
  const litresText = ocr.litres == null || ocr.litres === '' ? '\u2014' : `${ocr.litres} L`;
  const rateText = ocr.rate == null || ocr.rate === '' ? '\u2014' : `₹${ocr.rate}/L`;
  const billFields = [
    {
      label: 'Date',
      value: dateInfo.text,
      note: dateInfo.yearWarning,
      noteClass: 'bp-bill__warning',
    },
    {
      label: 'Time',
      value: photoTime,
      note: fromStamp ? 'from the photo stamp' : null,
      noteClass: 'bp-stamp-note',
    },
    { label: 'Receipt no.', value: ocr.receiptNo },
  ];
  const pumpFields = [
    { label: 'Pump / station', value: ocr.pump ?? ocr.station },
    {
      label: 'Truck on bill',
      value: ocr.vehicleNo ?? ocr.vehicleNumber ?? ocr.registrationNumber,
    },
    {
      label: 'Odometer',
      value: ocr.odometer == null || ocr.odometer === '' ? null : `${ocr.odometer} km`,
    },
  ];
  return (
    <tr aria-label={`Bill ${capture.id}`}>
      <td data-label="#">{index + 1}</td>
      <td data-label="Details">
        <div className="bp-bill">
          <div className="bp-bill__head">
            <span className="bp-bill__amount">{litresText}</span>
            <span className="bp-bill__rate">{rateText}</span>
            {ocr.fuelType ? <span className="bp-badge">{ocr.fuelType}</span> : null}
          </div>
          <div className="bp-bill__sub">{money(ocr.amount)}</div>
          <dl className="bp-bill__meta">
            <MetaGroup label="Bill" items={billFields} />
            <MetaGroup label="Pump &amp; truck" items={pumpFields} />
          </dl>
          {/* The date and time as one phrase, for assistive tech and the
              compact rows that cannot render the labelled grid. */}
          <span className="bp-visually-hidden">
            Date: {show(dateInfo.text)} · Time: {show(photoTime)}
          </span>
        </div>
      </td>
      <td data-label="Photo">
        <button
          type="button"
          className="bp-photo-btn"
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
                {candidates.length > 0 ? (
                  <>
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
                  </>
                ) : (
                  <p className="bp-reason">{reasonOf(suggestion)}</p>
                )}
                <label className="bp-truck-pick">
                  <span className="bp-truck-pick__label">Truck</span>
                  <SearchableSelect
                    className="bp-truck-select"
                    aria-label="Truck"
                    value={chosen}
                    onChange={(event) => onChoice(event.target.value)}
                  >
                    <option value="">Search all trucks…</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id || vehicle.id} value={vehicle.registrationNumber}>
                        {vehicle.registrationNumber}
                      </option>
                    ))}
                  </SearchableSelect>
                </label>
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

export default BillRow;
