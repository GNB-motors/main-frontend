import { useEffect, useRef, useState } from 'react';
import { Check, FileArchive, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import PhotoImportService from '../../services/PhotoImportService';
import './AddBillPhotoDialog.css';
import './WhatsappExportDialog.css';

// The same cap the server keeps: a chat export bigger than this is refused
// before it is sent, so nobody waits for an upload that will not be read.
const MAX_BYTES = 500 * 1024 * 1024;

// One row per count, in the words the owner reads.
const COUNT_ROWS = [
  ['messages', 'Messages'],
  ['photos', 'Photos'],
  ['fillsConfirmed', 'Fills saved'],
  ['drafts', 'Waiting for a person'],
  ['market', 'Market trucks'],
  ['dutyRecords', 'Duty records'],
  ['skippedAsAlreadyReceived', 'Already received (skipped)'],
  ['captionOnly', 'Caption without photo'],
  ['skippedMedia', 'Other files skipped'],
];

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
 * One WhatsApp chat export, uploaded as a .zip. The server reads every photo
 * in it before it answers, so the wait is long and the words on screen say so.
 */
export default function WhatsappExportDialog({ open, onOpenChange, onImported }) {
  const [file, setFile] = useState(null);
  const [stage, setStage] = useState('pick');
  const [error, setError] = useState(null);
  const [percent, setPercent] = useState(0);
  const [result, setResult] = useState(null);
  const input = useRef(null);
  const busy = useRef(false);
  const request = useRef(null);
  const imported = useRef(false);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setError(null);
    setStage('pick');
    setPercent(0);
    setResult(null);
    imported.current = false;
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
  const markImported = (answer) => {
    if (imported.current) return;
    imported.current = true;
    onImported?.(answer);
  };

  const close = () => {
    if (busy.current) return;
    onOpenChange(false);
    // The list is only worth reading again once a chat has actually come in.
    if (result) markImported(result);
  };

  const upload = async () => {
    if (busy.current || !file) return;
    busy.current = true;
    setStage('uploading');
    setError(null);
    setPercent(0);
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
          // The file is on its way; the server now reads the photos.
          if (next >= 100) setStage('reading');
        },
      });
      if (controller.signal.aborted) return;
      setResult(answer || {});
      setStage('done');
      markImported(answer || {});
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(errorText(err));
      setStage('pick');
    } finally {
      busy.current = false;
    }
  };

  const failed = Array.isArray(result?.failed) ? result.failed : [];
  const failedCount = Array.isArray(result?.failed)
    ? failed.length
    : countText(result?.failed);
  const photosMissing = Number(result?.photosMissing || 0);

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
          disabled={stage === 'uploading' || stage === 'reading'}
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
              <Loader2 size={26} className="animate-spin" aria-hidden="true" />
              <strong>Reading the photos… this can take up to 15 minutes. Keep this page open.</strong>
            </div>
          ) : (
            <div className="bp-success" role="status">
              <Check size={28} aria-hidden="true" />
              <strong>Chat imported</strong>
              <span>The fills are now in the mileage list.</span>
              <table className="wxp-table">
                <caption className="sr-only">What came out of the chat export</caption>
                <tbody>
                  {COUNT_ROWS.map(([key, label]) => (
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
              {failed.length ? (
                <>
                  <p className="wxp-note">These messages could not be read:</p>
                  <ul>
                    {failed.map((item, index) => (
                      <li key={`${failureReason(item)}-${index}`}>{failureReason(item)}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          )}
          {error ? (
            <p role="alert" className="bp-error">
              {error}
            </p>
          ) : null}
        </div>
        <div className="bp-dialog-foot">
          {stage === 'done' ? (
            <Button size="sm" onClick={close}>
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={stage === 'uploading' || stage === 'reading'}
                onClick={close}
              >
                Cancel
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

/** The server's own words when it has them; otherwise plain words of our own. */
function errorText(err) {
  const serverMessage =
    err?.response?.data?.message || err?.response?.data?.data?.message || err?.response?.data?.error;
  if (serverMessage) return String(serverMessage);
  const code = err?.code || '';
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || /timeout/i.test(err?.message || '')) {
    return 'The import took too long and the connection dropped. It may still be running — check the mileage list later to see what came through.';
  }
  return err?.message || 'The chat could not be uploaded. Please try again.';
}
