import React, { useRef, useState } from 'react';
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
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [batchId, setBatchId] = useState('');
  const [views, setViews] = useState([]);
  const [decisions, setDecisions] = useState({});
  const [chartOpen, setChartOpen] = useState(false);
  const [files, setFiles] = useState([]);

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
      setError(err?.response?.data?.message || err?.message || 'The photos could not be read.');
    } finally {
      setBusy(false);
    }
  };

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
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              Drop photos here or tap to choose
            </Button>

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
              <div className="space-y-3">
                {views.map((view) => {
                  const decision = decisions[view.key] || defaultDecision(view);
                  return (
                    <div
                      key={view.key}
                      className="rounded border border-[var(--ds-line)] p-3 text-sm"
                      data-testid={`driver-row-${view.key}`}
                    >
                      <p className="font-medium">{safeText(view.name) || 'Unnamed driver'}</p>
                      <p className="text-xs text-[var(--ds-ink3)]">
                        {view.phone ? `${view.phone} · ` : ''}
                        {view.licenceNumber ? `${view.licenceNumber} · ` : ''}
                        {view.photoCount} photo{view.photoCount === 1 ? '' : 's'}
                      </p>

                      {view.status === 'existing' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant={decision.action === 'use' ? 'default' : 'outline'}
                          onClick={() =>
                            decide(view.key, {
                              action: 'use',
                              userId: view.userId,
                              name: view.name,
                            })
                          }
                        >
                          Already in your list: {view.name}
                        </Button>
                      ) : null}

                      {view.status === 'likely' ? (
                        <CandidateCards
                          candidates={view.candidates}
                          name={`driver-${view.key}`}
                          value={decision.action === 'use' ? decision.userId : 'none'}
                          disabled={busy}
                          onChange={(id) => {
                            const candidate = view.candidates.find((item) => item.userId === id);
                            decide(
                              view.key,
                              candidate
                                ? { action: 'use', userId: id, name: candidate.name }
                                : { action: 'create', userId: '', name: view.name },
                            );
                          }}
                        />
                      ) : null}

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
                    </div>
                  );
                })}
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
