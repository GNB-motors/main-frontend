import { useEffect, useRef, useState } from 'react';
import { Camera, Check, FileText, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import billPhotoService from '../../services/billPhotoService';
import {
  BILL_TYPES,
  POLL_INTERVAL_MS,
  POLL_TIMEOUT_MS,
  buildBillFormData,
  candidateRows,
  isAutoMatch,
  matchSentence,
  needsChoice,
} from './billPhotoModel';

/**
 * AddBillPhotoDialog — photograph a diesel slip instead of typing it in.
 *
 * The flow is: choose the bill, take or choose the photo, upload it, and
 * wait. The product either says which truck it matched and why, or lists
 * the candidates with their reasons and lets the owner choose. Nothing is
 * saved without the owner saying so.
 */
export default function AddBillPhotoDialog({ open, onOpenChange, onConfirmed = null }) {
  const [kind, setKind] = useState('DIESEL_SLIP');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [stage, setStage] = useState('pick'); // pick | uploading | polling | ready | failed
  const [error, setError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [chosen, setChosen] = useState(null);

  const fileInputRef = useRef(null);
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);

  // Everything stops when the dialog closes: no timer left running.
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      setFile(null);
      setStage('pick');
      setError(null);
      setSuggestion(null);
      setChosen(null);
    }
  }, [open]);

  const poll = async (captureId) => {
    try {
      const answer = await billPhotoService.getBillSuggestion(captureId);
      setSuggestion(answer);
      if (answer?.decision === 'AUTO' || answer?.decision === 'ASK') {
        setStage('ready');
        return;
      }
      if (Date.now() - startedAtRef.current < POLL_TIMEOUT_MS) {
        timerRef.current = setTimeout(() => poll(captureId), POLL_INTERVAL_MS);
      } else {
        setStage('failed');
        setError('We could not work out which truck this bill belongs to.');
      }
    } catch (err) {
      setStage('failed');
      setError(err?.message || 'The photo was sent, but we could not read it back.');
    }
  };

  /** Hold the file the owner picked. Nothing is sent until they press Upload. */
  const pickFile = (picked) => {
    if (!picked) return;
    setFile(picked);
    setError(null);
    if (stage === 'failed') setStage('pick');
  };

  const upload = async (chosenFile) => {
    setFile(chosenFile);
    setStage('uploading');
    setError(null);
    try {
      const body = buildBillFormData(chosenFile, kind);
      const capture = await billPhotoService.uploadBillPhoto({ body });
      const captureId = capture?._id ?? capture?.id ?? null;
      if (!captureId) {
        setStage('failed');
        setError('The photo was sent, but the server did not give us its id.');
        return;
      }
      setStage('polling');
      startedAtRef.current = Date.now();
      poll(captureId);
    } catch (err) {
      setStage('failed');
      setError(err?.message || 'The photo could not be sent.');
    }
  };

  const rows = candidateRows(suggestion);
  const auto = isAutoMatch(suggestion) ? rows[0] : null;
  const answer = auto ?? (chosen ? rows.find((row) => row.registrationNumber === chosen) : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bp-dialog flex max-h-[calc(100vh-48px)] max-w-[460px] flex-col overflow-hidden border-[var(--rd-line)] bg-[var(--rd-card)] p-0">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold text-[var(--rd-ink)]">
            Add bill photo
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--rd-ink-2)]">
            Photograph the slip. We will work out which truck it belongs to, and you confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="bp-dialog-body flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
          {/* The kind of bill */}
          <div className="flex items-center gap-2">
            <label htmlFor="bill-photo-kind" className="text-[13px] text-[var(--rd-ink-2)]">
              Bill type
            </label>
            <select
              id="bill-photo-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className="bp-select"
            >
              {BILL_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* The photo */}
          {stage === 'pick' ? (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className={`bp-drop${isDragging ? ' bp-drop--active' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  const dropped = event.dataTransfer?.files?.[0];
                  if (dropped) pickFile(dropped);
                }}
              >
                <Camera size={24} aria-hidden="true" className="text-[var(--rd-ink-3)]" />
                <span className="text-[13px] font-medium text-[var(--rd-ink-2)]">
                  Drop a bill photo or click to choose
                </span>
                <span className="text-[12px] text-[var(--rd-ink-3)]">JPG, PNG or PDF</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                aria-label="Bill photo"
                onChange={(event) => {
                  const chosenFile = event.target.files?.[0];
                  if (chosenFile) pickFile(chosenFile);
                }}
                className="sr-only"
              />
              {file ? (
                <div className="bp-file">
                  <FileText size={15} aria-hidden="true" className="shrink-0 text-[var(--rd-ink-3)]" />
                  <span className="truncate text-[13px] text-[var(--rd-ink)]">{file.name}</span>
                  <button
                    type="button"
                    className="bp-file-remove"
                    aria-label={`Remove ${file.name}`}
                    title="Remove this file"
                    onClick={() => setFile(null)}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {stage === 'uploading' ? (
            <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">
              Sending {file?.name ? `${file.name}…` : 'the photo…'}
            </p>
          ) : null}

          {stage === 'polling' ? (
            <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">
              Reading the bill and looking for the truck…
            </p>
          ) : null}

          {stage === 'failed' ? (
            <p className="m-0 text-[13px] text-[var(--rd-act-ink)]">{error}</p>
          ) : null}

          {stage === 'ready' && auto ? (
            <div className="flex flex-col gap-2 rounded-[var(--rd-radius)] border border-[var(--rd-good)] bg-[var(--rd-good-tint)] p-3">
              <p className="m-0 flex items-center gap-2 text-[13px] font-semibold text-[var(--rd-good-ink)]">
                <Check size={15} aria-hidden="true" />
                {matchSentence(auto)}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    onConfirmed?.(auto);
                    onOpenChange(false);
                  }}
                >
                  Confirm
                </Button>
                <Button size="sm" variant="outline" onClick={() => setChosen('__change__')}>
                  Change
                </Button>
              </div>
            </div>
          ) : null}

          {stage === 'ready' && needsChoice(suggestion) ? (
            <fieldset className="flex flex-col gap-1.5">
              <legend className="m-0 text-[13px] font-semibold text-[var(--rd-ink)]">
                Which truck is this bill for?
              </legend>
              {rows.map((row) => (
                <label key={row.registrationNumber ?? row.label} className="flex items-start gap-2 text-[13px]">
                  <input
                    type="radio"
                    name="bill-candidate"
                    aria-label={row.label}
                    checked={chosen === row.registrationNumber}
                    onChange={() => setChosen(row.registrationNumber)}
                  />
                  <span>
                    {row.label}
                    {row.reasons.length ? (
                      <span className="block text-[12px] text-[var(--rd-ink-3)]">
                        {row.reasons.join(' · ')}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
              <Button
                size="sm"
                className="w-fit"
                disabled={!chosen}
                onClick={() => {
                  onConfirmed?.(answer);
                  onOpenChange(false);
                }}
              >
                Confirm
              </Button>
            </fieldset>
          ) : null}
        </div>

        <div className="bp-dialog-foot">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {stage === 'pick' ? (
            <Button size="sm" disabled={!file} onClick={() => file && upload(file)}>
              Upload
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
