import { useEffect, useRef, useState } from 'react';
import { Camera, Check } from 'lucide-react';
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
      <DialogContent className="max-w-[460px] border-[var(--rd-line)] bg-[var(--rd-card)]">
        <DialogHeader>
          <DialogTitle className="text-[16px] font-semibold text-[var(--rd-ink)]">
            Add bill photo
          </DialogTitle>
          <DialogDescription className="text-[13px] text-[var(--rd-ink-2)]">
            Photograph the slip. We will work out which truck it belongs to, and you confirm.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {/* The kind of bill */}
          <div className="flex items-center gap-2">
            <label htmlFor="bill-photo-kind" className="text-[13px] text-[var(--rd-ink-2)]">
              Bill type
            </label>
            <select
              id="bill-photo-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value)}
              className="rounded-[var(--rd-radius-sm)] border border-[var(--rd-line)] bg-[var(--rd-card)] px-2 py-1 text-[13px] text-[var(--rd-ink)]"
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
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
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
                  if (dropped) upload(dropped);
                }}
                className={`flex w-full flex-col items-center gap-2 rounded-[var(--rd-radius)] border border-dashed p-5 text-center ${
                  isDragging
                    ? 'border-[var(--rd-brand-2)] bg-[var(--rd-brand-tint)]'
                    : 'border-[var(--rd-line-strong)]'
                }`}
              >
                <Camera size={22} aria-hidden="true" className="text-[var(--rd-ink-3)]" />
                <span className="text-[13px] text-[var(--rd-ink-2)]">
                  Drop the photo here, or choose one.
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                aria-label="Bill photo"
                onChange={(event) => {
                  const chosenFile = event.target.files?.[0];
                  if (chosenFile) upload(chosenFile);
                }}
                className="text-[12px] text-[var(--rd-ink-2)]"
              />
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
      </DialogContent>
    </Dialog>
  );
}
