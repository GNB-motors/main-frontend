import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PhotoImportService from '@/services/PhotoImportService';
import safeText from '@/utils/redactSensitive';
import { PHOTO_KINDS, filedElsewhereNote, retakeReason } from './photoImportText';

const POLL_MS = 1500;
const TERMINAL = ['done', 'complete', 'completed', 'finished', 'partial', 'failed', 'error'];
const MAX_FILES = 80;
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Upload a pile of photos and find out what the reader made of them.
 *
 * The dialog never shows the reader's working — no confidences, no checksums,
 * no line of text it scraped off a page. It says how many photos it read, which
 * ones to retake (with a plain reason), and where a photo that turned out to
 * be something else was filed.
 */
export default function UploadPhotosDialog({ open, onOpenChange, onBatchReady, onOpenChart }) {
  const [files, setFiles] = useState([]);
  const [stage, setStage] = useState('pick');
  const [batch, setBatch] = useState(null);
  const [batchId, setBatchId] = useState('');
  const [error, setError] = useState('');
  const [busyRow, setBusyRow] = useState('');
  const picker = useRef(null);
  const reuploadPicker = useRef(null);
  const reuploadTarget = useRef(null);
  const abort = useRef(null);
  const counter = useRef(0);

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setStage('pick');
    setBatch(null);
    setBatchId('');
    setError('');
    setBusyRow('');
  }, [open]);

  useEffect(() => () => abort.current?.abort(), []);

  // The reader works in the background; the dialog watches the batch until it
  // settles and then shows what happened.
  useEffect(() => {
    if (stage !== 'uploading' || !batchId) return undefined;
    let alive = true;
    const controller = new AbortController();
    const tick = async () => {
      try {
        const next = await PhotoImportService.getBatch(batchId, { signal: controller.signal });
        if (!alive) return;
        setBatch(next);
        if (TERMINAL.includes(String(next?.status || '').toLowerCase())) setStage('result');
      } catch {
        // A poll can fail while the reader is busy; the next tick tries again.
      }
    };
    tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      controller.abort();
      clearInterval(timer);
    };
  }, [stage, batchId]);

  const addFiles = (incoming) => {
    const picked = Array.from(incoming || []);
    if (!picked.length) return;
    const accepted = picked.filter(
      (file) => file.type.startsWith('image/') || file.type === 'application/pdf',
    );
    if (accepted.length !== picked.length) setError('Only JPG, PNG, WEBP or PDF photos are read.');
    const tooBig = accepted.find((file) => file.size > MAX_BYTES);
    if (tooBig) setError(`${safeText(tooBig.name)} is larger than 10 MB.`);
    const room = Math.max(0, MAX_FILES - files.length);
    const next = accepted
      .filter((file) => file.size <= MAX_BYTES)
      .slice(0, room)
      .map((file) => ({
        id: `photo-${counter.current++}`,
        file,
        kind: '',
      }));
    if (!next.length) return;
    setFiles((prev) => [...prev, ...next]);
  };

  const setKind = (id, kind) =>
    setFiles((prev) => prev.map((entry) => (entry.id === id ? { ...entry, kind } : entry)));

  const startUpload = async () => {
    if (!files.length) return;
    setStage('uploading');
    setError('');
    const controller = new AbortController();
    abort.current = controller;
    const uploadedAs = {};
    files.forEach((entry) => {
      if (entry.kind) uploadedAs[entry.file.name] = entry.kind;
    });
    try {
      const res = await PhotoImportService.start(
        { files: files.map((entry) => entry.file), uploadedAs },
        { signal: controller.signal },
      );
      const id = res?.batchId;
      if (!id) throw new Error('The server did not start the import.');
      setBatchId(id);
      setBatch({ status: 'processing', counts: { total: files.length, done: 0 }, rows: [] });
      onBatchReady?.(id);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err?.message || 'The photos could not be uploaded.');
        setStage('pick');
      }
    }
  };

  const startReupload = (row) => {
    reuploadTarget.current = row;
    reuploadPicker.current?.click();
  };

  const onReuploadPicked = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    const row = reuploadTarget.current;
    if (!file || !row) return;
    setBusyRow(row.rowId);
    setError('');
    try {
      await PhotoImportService.reupload({ batchId, file }, {});
      const next = await PhotoImportService.getBatch(batchId, {});
      setBatch(next);
    } catch (err) {
      setError(err?.message || 'That photo could not be uploaded again.');
    } finally {
      setBusyRow('');
    }
  };

  const rows = Array.isArray(batch?.rows) ? batch.rows : [];
  const retakeRows = rows.filter((row) => row.status === 'reupload');
  const filedRows = rows.filter((row) => row.status === 'filed_elsewhere');
  const readCount = rows.length ? rows.length - retakeRows.length : (batch?.counts?.done ?? 0);
  const total = batch?.counts?.total || rows.length || files.length;
  const done = batch?.counts?.done ?? readCount;
  const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <Dialog open={open} onOpenChange={(next) => onOpenChange?.(next)}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload photos</DialogTitle>
          <DialogDescription>
            Register pages, fuel slips, pump displays, bills, odometer photos and driver documents.
            Drop them all in — we will tell you which ones to retake.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto px-6 py-4">
          {stage === 'pick' ? (
            <div className="space-y-4">
              <button
                type="button"
                className="flex w-full flex-col items-center gap-2 rounded border border-dashed p-6 text-sm"
                onClick={() => picker.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  addFiles(event.dataTransfer?.files);
                }}
              >
                <Camera size={26} aria-hidden="true" />
                <span>Drop photos here or click to choose</span>
                <small className="text-muted-foreground">
                  JPG, PNG, WEBP or PDF · up to {MAX_FILES} photos · 10 MB each
                </small>
              </button>
              <input
                ref={picker}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                aria-label="Photos"
                className="sr-only"
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = '';
                }}
              />

              {files.length ? (
                <ul className="space-y-2">
                  {files.map((entry) => (
                    <li key={entry.id} className="flex flex-wrap items-center gap-2 border-b pb-2">
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {safeText(entry.file.name)}
                      </span>
                      <select
                        aria-label={`Photo kind for ${safeText(entry.file.name)}`}
                        value={entry.kind}
                        onChange={(event) => setKind(entry.id, event.target.value)}
                        className="rounded border px-2 py-1 text-xs"
                      >
                        {PHOTO_KINDS.map((kind) => (
                          <option key={kind.value} value={kind.value}>
                            {kind.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="rounded p-1"
                        aria-label={`Remove ${safeText(entry.file.name)}`}
                        onClick={() =>
                          setFiles((prev) => prev.filter((item) => item.id !== entry.id))
                        }
                      >
                        <X size={15} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No photos chosen yet.</p>
              )}
            </div>
          ) : stage === 'uploading' ? (
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-sm" role="status">
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                Reading your photos…
              </p>
              <div
                role="progressbar"
                aria-label="Reading photos"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 w-full overflow-hidden rounded bg-[var(--ds-line)]"
              >
                <div
                  className="h-full bg-[var(--ds-accent,#2563eb)]"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {done} of {total} photo(s) read. Keep this window open.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium">
                {readCount} photo{readCount === 1 ? '' : 's'} read
              </p>

              {retakeRows.length > 0 ? (
                <div className="rounded border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-amber-900">
                    Please retake these photos
                  </p>
                  <ul className="space-y-3">
                    {retakeRows.map((row) => (
                      <li key={row.rowId} className="text-sm text-amber-900">
                        <p className="font-medium">{safeText(row.fileName)}</p>
                        <p>{safeText(retakeReason(row.reason))}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2"
                          disabled={busyRow === row.rowId}
                          onClick={() => startReupload(row)}
                        >
                          <RefreshCw size={14} aria-hidden="true" />
                          {busyRow === row.rowId
                            ? 'Uploading…'
                            : `Re-upload ${safeText(row.fileName)}`}
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <input
                    ref={reuploadPicker}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    aria-label="Retaken photo"
                    className="sr-only"
                    onChange={onReuploadPicked}
                  />
                </div>
              ) : null}

              {filedRows.length > 0 ? (
                <div className="rounded border border-blue-200 bg-blue-50 p-3">
                  <p className="mb-2 text-sm font-semibold text-blue-900">Saved somewhere else</p>
                  <ul className="space-y-2 text-sm text-blue-900">
                    {filedRows.map((row) => (
                      <li key={row.rowId}>
                        <span className="font-medium">{safeText(row.fileName)}</span>{' '}
                        <span>{filedElsewhereNote(row.notice)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!retakeRows.length && !filedRows.length ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={16} aria-hidden="true" /> Nothing needs retaking.
                </p>
              ) : null}
            </div>
          )}

          {error ? (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {safeText(error)}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          {stage === 'result' ? (
            <>
              {batchId ? (
                <Button variant="outline" size="sm" onClick={() => onOpenChart?.(batchId)}>
                  Open driver chart
                </Button>
              ) : null}
              <Button size="sm" onClick={() => onOpenChange?.(false)}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={stage === 'uploading'}
                onClick={() => onOpenChange?.(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={stage === 'uploading' || !files.length}
                onClick={startUpload}
              >
                {stage === 'uploading' ? 'Reading…' : 'Upload photos'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
