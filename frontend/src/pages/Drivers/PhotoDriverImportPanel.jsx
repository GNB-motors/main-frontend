import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import PhotoImportService from '../../services/PhotoImportService';
import { toast } from 'react-toastify';
import DriverChartDialog from '../DataImports/DriverChartDialog';
import CandidateCards from './CandidateCards';
import PhotoBatchStatus from './PhotoBatchStatus';
import safeText from '@/utils/redactSensitive';
import { defaultDecision, driverRowView, resolveItems } from './photoDriverImport';

/**
 * Driver photos, in the place where drivers are already added.
 *
 * The register page, the driving licence and the identity document of every
 * driver can be dropped in beside a spreadsheet. The reader says who it already
 * knows; the owner picks. Nothing the reader measured is ever shown, and no
 * digits are read off an identity document.
 *
 * With `context="assignments"` the photos are about who was driving: the batch
 * goes straight to the driver chart, where the periods are confirmed.
 */
export default function PhotoDriverImportPanel({
  open,
  onOpenChange,
  context = 'drivers',
  onSaved,
  initialFiles,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [batchId, setBatchId] = useState('');
  const [views, setViews] = useState([]);
  const [decisions, setDecisions] = useState({});
  const [chartOpen, setChartOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [editing, setEditing] = useState({});

  const reset = () => {
    setFiles([]);
    setViews([]);
    setDecisions({});
    setBatchId('');
    setError('');
  };

  const close = () => {
    reset();
    onOpenChange?.(false);
  };

  const upload = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setFiles(list);
    setBusy(true);
    setError('');
    try {
      const res = await PhotoImportService.start({ files: list, context });
      const id = res?.batchId || res?.batch?.batchId || res?.id || '';
      if (!id) throw new Error('The photos could not be read. Please try again.');
      if (context === 'assignments') {
        // Who was driving is confirmed in the chart, not here.
        setBatchId(id);
        setChartOpen(true);
        return;
      }
      const rows = await PhotoImportService.getDriverRows(id);
      const next = rows.map(driverRowView);
      setViews(next);
      setDecisions(Object.fromEntries(next.map((view) => [view.key, defaultDecision(view)])));
      setBatchId(id);
    } catch (err) {
      if ((err?.status ?? err?.response?.status) === 404) {
        toast.info('Photo import is not switched on yet');
        close();
      } else
        setError(err?.response?.data?.message || err?.message || 'The photos could not be read.');
    } finally {
      setBusy(false);
    }
  };

  const initialRef = useRef(null);
  useEffect(() => {
    if (!open) {
      initialRef.current = null;
      return;
    }
    if (initialFiles?.length && initialRef.current !== initialFiles) {
      initialRef.current = initialFiles;
      upload(initialFiles);
    }
    // Upload once for each selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialFiles]);

  const decide = (key, decision) => {
    setDecisions((prev) => ({ ...prev, [key]: { ...prev[key], ...decision } }));
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const items = resolveItems(views, decisions);
      await PhotoImportService.resolveDrivers(batchId, items);
      close();
      onSaved?.();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'The drivers were not saved.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => (next ? null : close())}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add drivers from photos</DialogTitle>
            <DialogDescription>
              Add the register page, driving licence or identity document of each driver. We read
              them and tell you who we already know — you decide what to save.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            <p className="text-xs font-medium text-muted-foreground">
              1. Upload photos / 2. Check drivers / 3. Confirm
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              aria-label="Driver photos"
              className="sr-only"
              onChange={(event) => {
                upload(event.target.files);
                event.target.value = '';
              }}
            />
            {!initialFiles?.length && (
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full flex-col border-dashed py-6"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (!busy) upload(event.dataTransfer.files);
                }}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                Drop photos here or tap to choose
              </Button>
            )}

            {files.map((file) => (
              <PhotoBatchStatus
                key={`${file.name}-${file.lastModified}`}
                file={file}
                busy={busy}
                error={error}
              />
            ))}
            {error ? (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            ) : null}

            {views.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>What was read</th>
                      <th>Photo</th>
                      <th>Match</th>
                    </tr>
                  </thead>
                  <tbody>
                    {views.map((view, index) => {
                      const decision = decisions[view.key] || defaultDecision(view);
                      return (
                        <tr
                          key={view.key}
                          data-testid={`driver-row-${view.key}`}
                          className="align-top border-t"
                        >
                          <td className="p-2">{index + 1}</td>
                          <td className="p-2">
                            <p>{safeText(view.name) || '\u2014'}</p>
                            <p>Mobile: {view.phone || '\u2014'}</p>
                            <p>DL: {view.licenceNumber || '\u2014'}</p>
                            <p>Aadhaar: {view.aadhaar ? `XXXX${view.aadhaar}` : '\u2014'}</p>
                          </td>
                          <td className="p-2">
                            <span>Photos in batch</span>
                            {files.map((file) => (
                              <PhotoBatchStatus
                                key={`${file.name}-${file.lastModified}`}
                                file={file}
                                busy={false}
                              />
                            ))}
                          </td>
                          <td className="p-2">
                            {view.status === 'existing' && !editing[view.key] ? (
                              <p>
                                Already in your list: {safeText(decision.name)}{' '}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    setEditing((old) => ({ ...old, [view.key]: true }))
                                  }
                                >
                                  Edit
                                </Button>
                              </p>
                            ) : (
                              <>
                                {(view.status === 'likely' || view.status === 'existing') && (
                                  <CandidateCards
                                    asButtons
                                    candidates={view.candidates}
                                    name={`driver-${view.key}`}
                                    value={decision.action === 'use' ? decision.userId : 'none'}
                                    disabled={busy}
                                    onChange={(id) => {
                                      const candidate = view.candidates.find(
                                        (item) => item.userId === id,
                                      );
                                      decide(
                                        view.key,
                                        candidate
                                          ? { action: 'use', userId: id, name: candidate.name }
                                          : { action: 'create', userId: '', name: view.name },
                                      );
                                    }}
                                  />
                                )}
                                <label className="mt-2 block text-xs">
                                  New driver
                                  <input
                                    className="ml-2 rounded border border-[var(--ds-line)] px-2 py-1"
                                    aria-label={`New driver name${view.name ? ` for ${view.name}` : ''}`}
                                    value={decision.name || ''}
                                    onChange={(event) =>
                                      decide(view.key, {
                                        action: 'create',
                                        userId: '',
                                        name: event.target.value,
                                      })
                                    }
                                  />
                                </label>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2 px-6 pb-4">
            {!views.length && !busy && (
              <p className="w-full text-sm text-muted-foreground">
                Upload photos to check drivers before saving.
              </p>
            )}
            <Button type="button" variant="outline" onClick={close} disabled={busy}>
              Close
            </Button>
            <Button type="button" onClick={save} disabled={busy || !views.length}>
              Save all
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DriverChartDialog
        open={chartOpen}
        batchId={batchId}
        onOpenChange={(next) => {
          setChartOpen(next);
          if (!next) close();
        }}
      />
    </>
  );
}
