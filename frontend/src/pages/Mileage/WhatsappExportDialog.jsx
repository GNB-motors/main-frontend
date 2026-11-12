import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, FileArchive, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import PhotoImportService from '../../services/PhotoImportService';
import { openChatExportStream, MAX_PHOTO_ROWS } from './chatExportStream';
import './AddBillPhotoDialog.css';
import './WhatsappExportDialog.css';

// The same cap the server keeps: a chat export bigger than this is refused
// before it is sent, so nobody waits for an upload that will not be read.
const MAX_BYTES = 500 * 1024 * 1024;

// The server may still be working when we never heard back: the owner is told
// that, not that nothing was imported.
const LOST_CONTACT_MESSAGE =
  'We lost contact with the server before the import finished. It may still be running. Wait a few minutes and check Mileage before uploading again.';

// How often the import is asked how far it has come.
const POLL_MS = 3000;

// The plain words of the server, so the dialog says the same thing as the
// server does when an import fails.
const READER_DOWN_MESSAGE =
  'The photo reader is not running, so nothing was imported. Start it and upload the chat again.';
const PARTWAY_MESSAGE =
  'The import stopped partway. Some photos may already be saved. Uploading the same chat again is safe: photos already saved are skipped.';
const JOB_GONE_MESSAGE =
  "We can't find that import any more. Upload the chat again if it didn't finish.";

// One row per count of the chat itself, in the words the owner reads.
const CHAT_ROWS = [
  ['messages', 'Messages'],
  ['captionOnly', 'Caption without photo'],
  ['skippedMedia', 'Other files skipped'],
];

// The mark of one photo in the live list.
const ROW_MARKS = {
  read: '✓',
  unreadable: '⚠',
  'already-saved': '↺',
};

/** The words of one photo of the live list. */
function rowText(row) {
  const file = row?.file || `Photo ${row?.i || ''}`.trim();
  if (row?.result === 'unreadable') {
    return row?.reason
      ? `${file} — could not be read: ${row.reason}`
      : `${file} — could not be read`;
  }
  if (row?.result === 'already-saved') return `${file} — already received`;
  return row?.kind ? `${file} — read (${row.kind})` : `${file} — read`;
}

/**
 * The buckets of the photos: every photo is in exactly one of them, and they
 * add up to the number of photos.
 */
function bucketsOf(result) {
  const empty = {
    saved: 0,
    waiting: 0,
    market: 0,
    alreadyReceived: 0,
    unreadable: 0,
    failed: 0,
    other: 0,
  };
  const sent = result?.photoBuckets;
  if (!sent || typeof sent !== 'object') return empty;
  const out = { ...empty };
  for (const name of Object.keys(empty)) out[name] = Number(sent[name] || 0);
  return out;
}

/** The fills of the chat: the groups of photos that make one fill. */
function fillsOf(result) {
  const empty = { saved: 0, waiting: 0, market: 0, alreadyReceived: 0, failed: 0 };
  const sent = result?.fills;
  if (!sent || typeof sent !== 'object') return empty;
  const out = { ...empty };
  for (const name of Object.keys(empty)) out[name] = Number(sent[name] || 0);
  return out;
}

/** How many photos there are: the buckets add up to them. */
function photosTotalOf(result, buckets) {
  const total = Object.values(buckets).reduce((sum, number) => sum + number, 0);
  if (total > 0) return total;
  return Number(result?.photos || 0);
}

// A count the server did not send is not zero: it is not known.
const countText = (value) =>
  value === null || value === undefined || value === '' ? '—' : String(value);

const isZip = (file) =>
  (file?.name || '').toLowerCase().endsWith('.zip') ||
  file?.type === 'application/zip' ||
  file?.type === 'application/x-zip-compressed';

const failureReason = (item) =>
  typeof item === 'string' ? item : item?.reason || 'Could not be read.';

/**
 * The failures of one import, grouped the way the owner reads them:
 * "12 photos: the photo could not be read". The server sends the groups; when
 * it does not, they are grouped here.
 */
function failureGroups(result) {
  const sent = Array.isArray(result?.failedGroups) ? result.failedGroups : null;
  if (sent && sent.length) {
    return sent.map((group) => ({
      reason: group?.reason || 'Could not be read.',
      count: Number(group?.count || 0),
    }));
  }
  const failed = Array.isArray(result?.failed) ? result.failed : [];
  const groups = new Map();
  for (const item of failed) {
    const reason = failureReason(item);
    const key = reason.toLowerCase();
    const group = groups.get(key);
    if (group) group.count += 1;
    else groups.set(key, { reason, count: 1 });
  }
  return Array.from(groups.values());
}

/**
 * The words of a failed import.
 *
 * A reader that is not running keeps its own sentence: nothing was imported,
 * and the chat can be sent again. Any other failure may have saved some
 * photos already, so it says so instead of promising that nothing happened.
 */
function failureText(view) {
  const serverMessage = typeof view?.error === 'string' ? view.error.trim() : '';
  const readerDown =
    view?.errorCode === 'READER_DOWN' || /photo reader is not running/i.test(serverMessage);
  if (readerDown) {
    return {
      heading: 'Nothing was imported',
      message: serverMessage || READER_DOWN_MESSAGE,
      detail: '',
    };
  }
  return {
    heading: 'The import stopped partway',
    message: PARTWAY_MESSAGE,
    detail: serverMessage && serverMessage !== PARTWAY_MESSAGE ? serverMessage : '',
  };
}

/**
 * One WhatsApp chat export, uploaded as a .zip. The server reads every photo
 * in it before it answers, so the wait is long and the words on screen say so.
 */
export default function WhatsappExportDialog({ open, onOpenChange, onImported, onReview }) {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState('pick');
  const [error, setError] = useState(null);
  const [percent, setPercent] = useState(0);
  const [result, setResult] = useState(null);
  // The job of the import. It stays here while the dialog is closed, so
  // opening the dialog again shows the import that is still running.
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState({ read: 0, total: 0 });
  // The photos as they are read, newest first. Only the last ones are kept:
  // a chat of six hundred photos does not have to be on the screen at once.
  const [photoRows, setPhotoRows] = useState({ rows: [], more: 0 });
  // The words of a failure: the heading says how much was lost, the message
  // says what the owner can do.
  const [failureHeading, setFailureHeading] = useState('Nothing was imported');
  const [failureDetail, setFailureDetail] = useState('');
  const input = useRef(null);
  const busy = useRef(false);
  const request = useRef(null);
  const imported = useRef(false);
  // The job that is being followed right now. A late answer about an older
  // import is not the answer about this one.
  const jobIdRef = useRef(null);
  // The live line of the import, and the last event it gave: a browser that
  // comes back asks for what it missed.
  const stream = useRef(null);
  const lastEventId = useRef(0);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFailureHeading('Nothing was imported');
    setFailureDetail('');
    setPercent(0);
    imported.current = false;
    if (jobIdRef.current) {
      // The import is on the server: show it again and keep asking about it.
      setStage('reading');
      return;
    }
    setFile(null);
    setStage('pick');
    setResult(null);
    setPhotoRows({ rows: [], more: 0 });
    lastEventId.current = 0;
  }, [open]);

  useEffect(() => () => request.current?.abort(), []);

  const pick = (next) => {
    if (!next) return;
    if (!isZip(next)) {
      setFile(null);
      setError('Choose a WhatsApp chat export (.zip).');
      return;
    }
    if (next.size > MAX_BYTES) {
      setFile(null);
      setError('That chat export is bigger than 500 MB. Please export a smaller chat.');
      return;
    }
    setFile(next);
    setError(null);
  };

  // The list refreshes once per import: when the chat comes in, and again if
  // the dialog is closed afterwards.
  const onImportedRef = useRef(onImported);
  useEffect(() => {
    onImportedRef.current = onImported;
  }, [onImported]);
  const markImported = useCallback((answer) => {
    if (imported.current) return;
    imported.current = true;
    onImportedRef.current?.(answer);
  }, []);

  // The import runs on the server: the dialog asks the job how far it has
  // come. Closing the dialog stops the asking, not the import.
  useEffect(() => {
    if (!open || !jobId) return undefined;
    const current = jobId;
    let stopped = false;
    let timer = null;
    // The asking stops as soon as the import is over.
    const finish = () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
    const ask = async () => {
      let view = null;
      try {
        view = await PhotoImportService.getChatExportJob(current);
      } catch (err) {
        if (stopped) return;
        if (err?.response?.status === 404) {
          // The import is not on the server any more.
          finish();
          jobIdRef.current = null;
          setJobId(null);
          setFailureHeading('The import could not be found');
          setError(JOB_GONE_MESSAGE);
          setStage('failed');
          return;
        }
        // The connection dropped: the import keeps running, so keep asking.
        return;
      }
      if (stopped || !view) return;
      // A late answer about an older import is not the answer about this one.
      if (jobIdRef.current !== current) return;
      setProgress({
        read: Number(view.progress?.read || 0),
        total: Number(view.progress?.total || 0),
      });
      if (view.state === 'done') {
        finish();
        const made = view.result || {};
        setResult(made);
        setStage('done');
        markImported(made);
        // The import is over: its job is not needed any more.
        jobIdRef.current = null;
        setJobId(null);
        return;
      }
      if (view.state === 'failed') {
        finish();
        const words = failureText(view);
        setFailureHeading(words.heading);
        setError(words.message);
        setFailureDetail(words.detail);
        setStage('failed');
        jobIdRef.current = null;
        setJobId(null);
        return;
      }
      setStage('reading');
    };
    timer = setInterval(ask, POLL_MS);
    ask();
    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [open, jobId, markImported]);

  // Close the live line of the import. The import itself keeps running.
  const closeStream = useCallback(() => {
    if (stream.current) {
      stream.current.close();
      stream.current = null;
    }
  }, []);

  /**
   * The live line: one row per photo, as soon as the photo is read.
   *
   * When the line is not there (no stream, a dropped connection), the asking
   * above keeps the import going and nothing is said to the owner.
   */
  useEffect(() => {
    if (!open || !jobId) return undefined;
    const current = jobId;
    const line = openChatExportStream(current, {
      lastEventId: lastEventId.current || undefined,
      onEvent: (event) => {
        if (jobIdRef.current !== current) return;
        const payload = event?.data || {};
        if (payload.seq) lastEventId.current = Number(payload.seq);
        if (event.type === 'photo') {
          setPhotoRows((state) => {
            const rows = [payload, ...state.rows];
            if (rows.length <= MAX_PHOTO_ROWS) return { rows, more: state.more };
            return {
              rows: rows.slice(0, MAX_PHOTO_ROWS),
              more: state.more + rows.length - MAX_PHOTO_ROWS,
            };
          });
          setProgress((state) => ({
            read: Math.max(Number(state.read || 0), Number(payload.i || 0)),
            total: Number(payload.total || state.total || 0),
          }));
          return;
        }
        if (event.type === 'done') {
          closeStream();
          const made = payload.summary || {};
          setResult(made);
          setStage('done');
          markImported(made);
          jobIdRef.current = null;
          setJobId(null);
          return;
        }
        if (event.type === 'failed') {
          closeStream();
          const words = failureText({ error: payload.message, errorCode: payload.errorCode });
          setFailureHeading(words.heading);
          setError(words.message);
          setFailureDetail(words.detail);
          setStage('failed');
          jobIdRef.current = null;
          setJobId(null);
        }
      },
      onError: () => {
        // The live line is not there: the asking above keeps the import going.
      },
    });
    stream.current = line;
    return () => {
      line.close();
      if (stream.current === line) stream.current = null;
    };
  }, [open, jobId, markImported, closeStream]);

  const close = () => {
    if (busy.current) return;
    onOpenChange(false);
    // The list is only worth reading again once a chat has actually come in.
    if (result) markImported(result);
  };

  // The fills that are waiting for a person: the owner goes and checks them.
  const review = () => {
    onReview?.();
    close();
  };

  const upload = async () => {
    if (busy.current || !file) return;
    busy.current = true;
    setStage('uploading');
    setError(null);
    setFailureHeading('Nothing was imported');
    setFailureDetail('');
    setPercent(0);
    setProgress({ read: 0, total: 0 });
    setPhotoRows({ rows: [], more: 0 });
    lastEventId.current = 0;
    // A new chat: the job of the old one is forgotten.
    jobIdRef.current = null;
    setJobId(null);
    const controller = new AbortController();
    request.current = controller;
    try {
      const answer = await PhotoImportService.uploadWhatsappExport(file, {
        signal: controller.signal,
        onUploadProgress: (event) => {
          const total = Number(event?.total || 0);
          const loaded = Number(event?.loaded || 0);
          if (!total) return;
          const next = Math.min(100, Math.round((loaded / total) * 100));
          setPercent(next);
        },
      });
      if (controller.signal.aborted) return;
      const id = answer?.jobId;
      if (!id) throw new Error('The chat could not be uploaded. Please try again.');
      // The import is on the server now: the dialog follows it from here.
      jobIdRef.current = id;
      setJobId(id);
      setStage('reading');
    } catch (err) {
      if (controller.signal.aborted) return;
      const serverMessage = serverErrorMessage(err);
      if (serverMessage) {
        // The server answered: it knows what happened.
        setError(serverMessage);
        setFailureHeading('Nothing was imported');
        setStage('failed');
      } else if (isLostContact(err)) {
        // We never heard back: the import may still be running.
        setError(LOST_CONTACT_MESSAGE);
        setStage('unreachable');
      } else {
        // Nothing was imported, and the technical reason stays off the screen.
        setError('The chat could not be uploaded. Please try again.');
        setFailureHeading('Nothing was imported');
        setStage('failed');
      }
    } finally {
      busy.current = false;
    }
  };

  const failed = Array.isArray(result?.failed) ? result.failed : [];
  const failedCount = Array.isArray(result?.failed)
    ? failed.length
    : countText(result?.failed);
  const groups = failureGroups(result);
  const failedTotal = Array.isArray(result?.failed)
    ? failed.length
    : groups.reduce((sum, group) => sum + group.count, 0);
  const hasProblems = failedTotal > 0;
  const photosMissing = Number(result?.photosMissing || 0);
  const buckets = bucketsOf(result);
  const fills = fillsOf(result);
  const photosTotal = photosTotalOf(result, buckets);
  // Nothing new means nothing to be happy about: the end state is neutral.
  const nothingNew = fills.saved === 0 && fills.waiting === 0;
  const summaryTone = nothingNew ? 'bp-neutral' : hasProblems ? 'bp-warning' : 'bp-success';
  const summaryTitle = nothingNew
    ? 'Nothing new in this chat'
    : hasProblems
      ? `Imported, with ${failedTotal} ${failedTotal === 1 ? 'problem' : 'problems'}`
      : 'Chat imported';
  const summaryParts = [];
  if (fills.saved > 0) {
    summaryParts.push(
      `${fills.saved} ${fills.saved === 1 ? 'fill' : 'fills'} saved to the mileage list`,
    );
  }
  if (fills.waiting > 0) {
    summaryParts.push(
      `${fills.waiting} ${fills.waiting === 1 ? 'fill is' : 'fills are'} waiting for you to check`,
    );
  }
  if (buckets.alreadyReceived > 0) {
    summaryParts.push(
      `${buckets.alreadyReceived} ${
        buckets.alreadyReceived === 1 ? 'photo was' : 'photos were'
      } already imported`,
    );
  }
  const summaryLine = nothingNew
    ? `Nothing new in this chat. All ${photosTotal} photos were already imported.`
    : summaryParts.length
      ? `${summaryParts.join('. ')}.`
      : 'Nothing was added to the mileage list.';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <DialogContent className="bp-dialog" aria-busy={stage === 'uploading' || stage === 'reading'}>
        <button
          type="button"
          className="bp-close"
          aria-label="Close"
          onClick={close}
          disabled={stage === 'uploading'}
        >
          <X size={18} aria-hidden="true" />
        </button>
        <DialogHeader className="bp-dialog-head">
          <DialogTitle>Upload WhatsApp chat</DialogTitle>
          <DialogDescription>
            Upload the chat export (.zip) from your phone. The photos in it are read and added to
            the mileage list.
          </DialogDescription>
        </DialogHeader>
        <div className="bp-dialog-body">
          {stage === 'pick' ? (
            <>
              <button
                type="button"
                className="bp-drop"
                onClick={() => input.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  pick(event.dataTransfer?.files?.[0]);
                }}
              >
                <FileArchive size={26} aria-hidden="true" />
                <span>Choose a WhatsApp chat export</span>
                <small>.zip only · up to 500 MB</small>
              </button>
              <input
                ref={input}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                aria-label="WhatsApp chat export"
                className="sr-only"
                onChange={(event) => {
                  pick(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              {file ? (
                <div className="bp-file">
                  <FileArchive size={18} aria-hidden="true" />
                  <span>{file.name}</span>
                  <button
                    type="button"
                    className="bp-file-remove"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFile(null)}
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : null}
            </>
          ) : stage === 'uploading' ? (
            <div className="bp-progress" role="status">
              <Loader2 size={26} className="animate-spin" aria-hidden="true" />
              <strong>Sending the chat… {percent}%</strong>
              <div className="wxp-bar">
                <div className="wxp-bar-fill" style={{ width: `${percent}%` }} />
              </div>
              <span>Keep this page open.</span>
            </div>
          ) : stage === 'reading' ? (
            <div className="bp-progress" role="status">
              {photoRows.rows.length ? (
                <div className="wxp-live">
                  <ul className="wxp-live-list" aria-label="The photos as they are read">
                    {photoRows.rows.map((row) => (
                      <li key={`${row.seq}-${row.i}`} className="wxp-live-row">
                        <span className="wxp-live-mark" aria-hidden="true">
                          {ROW_MARKS[row.result] || '•'}
                        </span>
                        <span className="wxp-live-text">{rowText(row)}</span>
                      </li>
                    ))}
                  </ul>
                  {photoRows.more > 0 ? (
                    <p className="wxp-note">{`and ${photoRows.more} more`}</p>
                  ) : null}
                </div>
              ) : null}
              <Loader2 size={26} className="animate-spin" aria-hidden="true" />
              <strong>
                {progress.total > 0
                  ? `Reading photos ${progress.read} / ${progress.total}`
                  : 'Reading the photos… this can take up to 15 minutes.'}
              </strong>
              {progress.total > 0 ? (
                <div className="wxp-bar">
                  <div
                    className="wxp-bar-fill"
                    style={{
                      width: `${Math.round((progress.read / progress.total) * 100)}%`,
                    }}
                  />
                </div>
              ) : null}
              <span>You can close this: the import keeps running.</span>
            </div>
          ) : stage === 'failed' ? (
            <div className="bp-failed" role="alert">
              <X size={28} aria-hidden="true" />
              <strong>{failureHeading}</strong>
              <span>{error}</span>
              {failureDetail ? <span>{failureDetail}</span> : null}
            </div>
          ) : stage === 'unreachable' ? (
            <div className="bp-warning" role="alert">
              <AlertTriangle size={28} aria-hidden="true" />
              <strong>{LOST_CONTACT_MESSAGE}</strong>
            </div>
          ) : (
            <div className={summaryTone} role="status">
              {summaryTone === 'bp-success' ? (
                <Check size={28} aria-hidden="true" />
              ) : summaryTone === 'bp-warning' ? (
                <AlertTriangle size={28} aria-hidden="true" />
              ) : null}
              <strong>{summaryTitle}</strong>
              <span>{summaryLine}</span>
              <table className="wxp-table">
                <caption className="sr-only">What happened to the photos</caption>
                <tbody>
                  <tr>
                    <th scope="row">Saved to the mileage list</th>
                    <td>{buckets.saved}</td>
                  </tr>
                  <tr>
                    <th scope="row">Waiting for a person</th>
                    <td>{buckets.waiting}</td>
                  </tr>
                  <tr>
                    <th scope="row">Market truck</th>
                    <td>{buckets.market}</td>
                  </tr>
                  <tr>
                    <th scope="row">Already received</th>
                    <td>{buckets.alreadyReceived}</td>
                  </tr>
                  <tr>
                    <th scope="row">Unreadable</th>
                    <td>{buckets.unreadable}</td>
                  </tr>
                  <tr>
                    <th scope="row">Failed</th>
                    <td>{buckets.failed}</td>
                  </tr>
                  <tr>
                    <th scope="row">Other</th>
                    <td>{buckets.other}</td>
                  </tr>
                  <tr>
                    <th scope="row">Photos</th>
                    <td>{photosTotal}</td>
                  </tr>
                </tbody>
              </table>
              <table className="wxp-table">
                <caption className="sr-only">The fills of the chat</caption>
                <tbody>
                  <tr>
                    <th scope="row">Saved</th>
                    <td>{fills.saved}</td>
                  </tr>
                  <tr>
                    <th scope="row">Waiting for a person</th>
                    <td>{fills.waiting}</td>
                  </tr>
                  <tr>
                    <th scope="row">Market truck</th>
                    <td>{fills.market}</td>
                  </tr>
                  <tr>
                    <th scope="row">Already received</th>
                    <td>{fills.alreadyReceived}</td>
                  </tr>
                  <tr>
                    <th scope="row">Failed</th>
                    <td>{fills.failed}</td>
                  </tr>
                </tbody>
              </table>
              <table className="wxp-table">
                <caption className="sr-only">The chat itself</caption>
                <tbody>
                  {CHAT_ROWS.map(([key, label]) => (
                    <tr key={key}>
                      <th scope="row">{label}</th>
                      <td>{countText(result?.[key])}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Failed</th>
                    <td>{failedCount}</td>
                  </tr>
                </tbody>
              </table>
              {photosMissing > 0 ? (
                <p className="wxp-note">
                  {`${photosMissing} photos missing: export the chat again with Include media.`}
                </p>
              ) : null}
              {groups.length ? (
                <>
                  <p className="wxp-note">These could not be read:</p>
                  <ul>
                    {groups.map((group) => (
                      <li key={group.reason}>
                        {`${group.count} ${group.count === 1 ? 'photo' : 'photos'}: ${group.reason}`}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          )}
          {error && stage !== 'failed' && stage !== 'unreachable' ? (
            <p role="alert" className="bp-error">
              {error}
            </p>
          ) : null}
        </div>
        <div className="bp-dialog-foot">
          {stage === 'done' ? (
            <>
              {onReview && fills.waiting > 0 ? (
                <Button size="sm" onClick={review}>
                  Review them
                </Button>
              ) : null}
              <Button size="sm" onClick={close}>
                Done
              </Button>
            </>
          ) : stage === 'unreachable' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={close}
            >
              Close
            </Button>
          ) : stage === 'failed' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={close}
              >
                Close
              </Button>
              <Button size="sm" disabled={!file} onClick={upload}>
                Try again
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={stage === 'uploading'}
                onClick={close}
              >
                {stage === 'reading' ? 'Close' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                disabled={stage === 'uploading' || stage === 'reading' || !file}
                onClick={upload}
              >
                {stage === 'uploading' || stage === 'reading' ? 'Working…' : 'Upload'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** The server's own words when it has them. */
function serverErrorMessage(err) {
  const message =
    err?.response?.data?.message || err?.response?.data?.data?.message || err?.response?.data?.error;
  return message ? String(message) : null;
}

/**
 * True when we never heard back: the connection timed out or broke. The
 * server may still be working, so the owner is told that and not that
 * nothing was imported.
 */
function isLostContact(err) {
  const code = err?.code || '';
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || code === 'ERR_NETWORK') return true;
  return /timeout|timed out|network error/i.test(String(err?.message || ''));
}
