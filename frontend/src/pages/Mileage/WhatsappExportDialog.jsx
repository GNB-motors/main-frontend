import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, FileArchive, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import DriverSheetReview from './DriverSheetReview';
import {
  cancelUpload,
  clearUrlFlag,
  closeDialog,
  onImported as listenForImport,
  openDialog,
  readingProgressPercent,
  readingProgressText,
  setFile,
  startUpload,
  summarise,
  uploadProgressText,
  useChatUpload,
  urlWantsOpen,
} from './chatUploadStore';
import './AddBillPhotoDialog.css';
import './WhatsappExportDialog.css';

// The same cap the server keeps: a chat export bigger than this is refused
// before it is sent, so nobody waits for an upload that will not be read.
const MAX_BYTES = 1536 * 1024 * 1024;

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

// The words of one photo of the live list.
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

// A count the server did not send is not zero: it is not known.
const countText = (value) =>
  value === null || value === undefined || value === '' ? '—' : String(value);

const isZip = (file) =>
  (file?.name || '').toLowerCase().endsWith('.zip') ||
  file?.type === 'application/zip' ||
  file?.type === 'application/x-zip-compressed';

/**
 * One WhatsApp chat export, uploaded as a .zip.
 *
 * The dialog is only a window on the upload: the upload itself belongs to the
 * session (see chatUploadStore), so the dialog can be closed at any moment
 * and the import keeps running. Opening it again shows the import as it is.
 */
export default function WhatsappExportDialog({ open, onOpenChange, onImported, onReview }) {
  const state = useChatUpload();
  // The file that was picked but is not a chat export: said here, not in the
  // session, because nothing was sent yet.
  const [pickError, setPickError] = useState('');
  // The driver names found in the chat are reviewed in their own small dialog.
  const [reviewOpen, setReviewOpen] = useState(false);
  // The address may ask for the dialog to be shown (the little pill).
  const [askedByUrl, setAskedByUrl] = useState(urlWantsOpen);
  const input = useRef(null);
  // The words of the refresh: the latest one wins, so a new list every time
  // the page is drawn does not start the reading again and again.
  const onImportedRef = useRef(onImported);
  useEffect(() => {
    onImportedRef.current = onImported;
  }, [onImported]);

  const visible = Boolean(open) || state.dialogOpen || askedByUrl;

  // The list is read again once the chat has come in.
  useEffect(
    () => listenForImport((answer) => onImportedRef.current?.(answer)),
    [],
  );

  const close = () => {
    // Closing only hides the dialog: the upload and the import keep running.
    closeDialog();
    setAskedByUrl(false);
    clearUrlFlag();
    onOpenChange?.(false);
  };

  const pick = (next) => {
    if (!next) return;
    if (!isZip(next)) {
      setFile(null);
      setPickError('Choose a WhatsApp chat export (.zip).');
      return;
    }
    if (next.size > MAX_BYTES) {
      setFile(null);
      setPickError('That chat export is bigger than 1.5 GB. Please export a smaller chat.');
      return;
    }
    setFile(next);
    setPickError('');
  };

  const upload = () => {
    if (!state.file) return;
    setPickError('');
    startUpload(state.file);
  };

  // The fills that are waiting for a person: the owner goes and checks them.
  const review = () => {
    onReview?.();
    close();
  };

  const summary = summarise(state.result);
  const failedCount = countText(summary.failedTotal);
  const photosMissingRaw = state.result?.photosMissing;
  const photosMissingNumber =
    photosMissingRaw === null || photosMissingRaw === undefined || photosMissingRaw === ''
      ? null
      : Number(photosMissingRaw);
  const photosMissing = Number.isFinite(photosMissingNumber) ? photosMissingNumber : null;
  const running = state.stage === 'uploading' || state.stage === 'queued' || state.stage === 'reading';
  // Some of the photos made it and some did not, or the server did not report
  // all of the counts: the owner is told to look at the results below.
  const partial = summary.unknown || summary.hasProblems;
  const readingPercent = readingProgressPercent(state.progress);
  const driverSheet = state.result?.driverSheet;
  // A count the server did not send is not zero: it is left out, not guessed.
  const driverCount = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const driverMissing = driverCount(driverSheet?.missing);
  const driverConflicts = driverCount(driverSheet?.conflicts);
  const driverParts = [];
  if (driverMissing) {
    driverParts.push(
      `${driverMissing} ${driverMissing === 1 ? 'truck has' : 'trucks have'} no driver`,
    );
  }
  if (driverConflicts) {
    driverParts.push(
      `${driverConflicts} ${driverConflicts === 1 ? 'differs' : 'differ'} from the app`,
    );
  }
  const showDriverCard = driverParts.length > 0;
  const driverCardText = `Driver list in the chat: ${driverParts.join(', ')} — Review`;

  return (
    <>
      <Dialog
      open={visible}
      onOpenChange={(next) => {
        if (next) {
          openDialog();
          return;
        }
        close();
      }}
    >
      <DialogContent className="bp-dialog" aria-busy={running}>
        <button type="button" className="bp-close" aria-label="Close" onClick={close}>
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
          {state.stage === 'checking' ? (
            <div className="bp-progress" role="status">
              <Loader2 size={26} className="animate-spin" aria-hidden="true" />
              <strong>Checking upload…</strong>
              <span>Looking for an import that may still be running.</span>
            </div>
          ) : state.stage === 'idle' ? (
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
                <small>.zip only · up to 1.5 GB</small>
              </button>
              {!state.file ? (
                <p className="wxp-note">Choose a .zip file to upload.</p>
              ) : null}
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
              {state.file ? (
                <div className="bp-file">
                  <FileArchive size={18} aria-hidden="true" />
                  <span>{state.file.name}</span>
                  <button
                    type="button"
                    className="bp-file-remove"
                    aria-label={`Remove ${state.file.name}`}
                    onClick={() => setFile(null)}
                  >
                    <X size={15} />
                  </button>
                </div>
              ) : null}
            </>
          ) : state.stage === 'uploading' ? (
            <div className="bp-progress" role="status">
              <Loader2 size={26} className="animate-spin" aria-hidden="true" />
              <strong>{uploadProgressText(state.percent)}</strong>
              {state.percent !== null && state.percent !== undefined ? (
                <div className="wxp-bar">
                  <div
                    className="wxp-bar-fill"
                    style={{ width: `${Math.min(100, Math.max(0, Number(state.percent)))}%` }}
                  />
                </div>
              ) : null}
              <span>You can close this and keep working. We&apos;ll tell you when it&apos;s done.</span>
            </div>
          ) : state.stage === 'queued' ? (
            <div className="bp-progress" role="status">
              <Loader2 size={26} className="animate-spin" aria-hidden="true" />
              <strong>Waiting to start…</strong>
              <span>You can close this and keep working. We&apos;ll tell you when it&apos;s done.</span>
            </div>
          ) : state.stage === 'reading' ? (
            <div className="bp-progress" role="status">
              {state.photoRows.rows.length ? (
                <div className="wxp-live">
                  <ul className="wxp-live-list" aria-label="The photos as they are read">
                    {state.photoRows.rows.map((row) => (
                      <li key={`${row.seq}-${row.i}`} className="wxp-live-row">
                        <span className="wxp-live-mark" aria-hidden="true">
                          {ROW_MARKS[row.result] || '•'}
                        </span>
                        <span className="wxp-live-text">{rowText(row)}</span>
                      </li>
                    ))}
                  </ul>
                  {state.photoRows.more > 0 ? (
                    <p className="wxp-note">{`and ${state.photoRows.more} more`}</p>
                  ) : null}
                </div>
              ) : null}
              <Loader2 size={26} className="animate-spin" aria-hidden="true" />
              <strong>{readingProgressText(state.progress)}</strong>
              <div className={`wxp-bar${readingPercent === null ? ' wxp-bar--indeterminate' : ''}`}>
                <div
                  className="wxp-bar-fill"
                  style={readingPercent === null ? undefined : { width: `${readingPercent}%` }}
                />
              </div>
              <span>You can close this and keep working. We&apos;ll tell you when it&apos;s done.</span>
            </div>
          ) : state.stage === 'failed' ? (
            <div className="bp-failed" role="alert">
              <X size={28} aria-hidden="true" />
              <strong>{state.failureHeading}</strong>
              <span>{state.error}</span>
              {state.failureDetail ? <span>{state.failureDetail}</span> : null}
            </div>
          ) : state.stage === 'unreachable' ? (
            <div className="bp-warning" role="alert">
              <AlertTriangle size={28} aria-hidden="true" />
              <strong>{state.error}</strong>
            </div>
          ) : (
            <div className={summary.tone} role="status">
              {summary.tone === 'bp-success' ? (
                <Check size={28} aria-hidden="true" />
              ) : summary.tone === 'bp-warning' ? (
                <AlertTriangle size={28} aria-hidden="true" />
              ) : null}
              <strong>{summary.title}</strong>
              <span>{summary.line}</span>
              <table className="wxp-table">
                <caption className="sr-only">What happened to the photos</caption>
                <tbody>
                  <tr>
                    <th scope="row">Saved to the mileage list</th>
                    <td>{countText(summary.buckets.saved)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Waiting for a person</th>
                    <td>{countText(summary.buckets.waiting)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Market truck</th>
                    <td>{countText(summary.buckets.market)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Already received</th>
                    <td>{countText(summary.buckets.alreadyReceived)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Unreadable</th>
                    <td>{countText(summary.buckets.unreadable)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Failed</th>
                    <td>{countText(summary.buckets.failed)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Other</th>
                    <td>{countText(summary.buckets.other)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Photos</th>
                    <td>{countText(summary.photosTotal)}</td>
                  </tr>
                </tbody>
              </table>
              <table className="wxp-table">
                <caption className="sr-only">The fills of the chat</caption>
                <tbody>
                  <tr>
                    <th scope="row">Saved</th>
                    <td>{countText(summary.fills.saved)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Waiting for a person</th>
                    <td>{countText(summary.fills.waiting)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Market truck</th>
                    <td>{countText(summary.fills.market)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Already received</th>
                    <td>{countText(summary.fills.alreadyReceived)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Failed</th>
                    <td>{countText(summary.fills.failed)}</td>
                  </tr>
                </tbody>
              </table>
              <table className="wxp-table">
                <caption className="sr-only">The chat itself</caption>
                <tbody>
                  {CHAT_ROWS.map(([key, label]) => (
                    <tr key={key}>
                      <th scope="row">{label}</th>
                      <td>{countText(state.result?.[key])}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Failed</th>
                    <td>{failedCount}</td>
                  </tr>
                  <tr>
                    <th scope="row">Photos missing</th>
                    <td>{countText(photosMissing)}</td>
                  </tr>
                </tbody>
              </table>
              {photosMissing !== null && photosMissing > 0 ? (
                <p className="wxp-note">
                  {`${photosMissing} photos missing: export the chat again with Include media.`}
                </p>
              ) : null}
              {showDriverCard ? (
                <button type="button" className="wxp-driver-card" onClick={() => setReviewOpen(true)}>
                  {driverCardText}
                </button>
              ) : null}
              {partial ? (
                <p className="wxp-note">
                  Some photos could not be read. Review the results below.
                </p>
              ) : null}
              {summary.groups.length ? (
                <>
                  <p className="wxp-note">These could not be read:</p>
                  <ul>
                    {summary.groups.map((group) => (
                      <li key={group.reason}>
                        {`${countText(group.count)} ${
                          group.count === 1 ? 'photo' : 'photos'
                        }: ${group.reason}`}
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          )}
          {pickError ? (
            <p role="alert" className="bp-error">
              {pickError}
            </p>
          ) : null}
        </div>
        <div className="bp-dialog-foot">
          {state.stage === 'done' ? (
            <>
              {onReview && summary.fills.waiting > 0 ? (
                <Button size="sm" onClick={review}>
                  Review them
                </Button>
              ) : null}
              <Button size="sm" onClick={close}>
                Done
              </Button>
            </>
          ) : state.stage === 'unreachable' ? (
            <Button variant="outline" size="sm" onClick={close}>
              Close
            </Button>
          ) : state.stage === 'failed' ? (
            <>
              <Button variant="outline" size="sm" onClick={close}>
                Close
              </Button>
              <Button size="sm" disabled={!state.file} onClick={upload}>
                Try again
              </Button>
            </>
          ) : state.stage === 'uploading' ? (
            <>
              <Button variant="outline" size="sm" onClick={close}>
                Close
              </Button>
              <Button variant="outline" size="sm" onClick={cancelUpload}>
                Cancel upload
              </Button>
            </>
          ) : state.stage === 'reading' || state.stage === 'queued' ? (
            <Button variant="outline" size="sm" onClick={close}>
              Close
            </Button>
          ) : state.stage === 'checking' ? (
            <Button variant="outline" size="sm" onClick={close}>
              Close
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={close}>
                Cancel
              </Button>
              <Button size="sm" disabled={!state.file} onClick={upload}>
                Upload
              </Button>
            </>
          )}
        </div>
      </DialogContent>
      </Dialog>
      <DriverSheetReview open={reviewOpen} onOpenChange={setReviewOpen} />
    </>
  );
}
