import { useEffect, useRef, useState } from 'react';
import { Camera, Check, FileText, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import SearchableSelect from '../../components/SearchableDropdown/SearchableSelect';
import { getVehicleList } from '../../services/vehicleListService';
import billPhotoService from '../../services/billPhotoService';
import safeText from '../../utils/redactSensitive';
import './AddBillPhotoDialog.css';
import BillsTable from './BillsTable';

const normalise = (value) =>
  String(value || '')
    .replace(/[\s-]/g, '')
    .toUpperCase();
const REVIEW_REASONS = {
  VEHICLE_NO_MISMATCH: 'The registration read from the bill differs from the selected truck.',
  MISSING_LITRES: 'Litres could not be read.',
  MISSING_RATE: 'The fuel rate could not be read.',
  LOW_OCR_CONFIDENCE: 'The photo could not be read with enough confidence.',
  FUEL_OCR_LOW_STATUS: 'Some bill details need checking.',
  ODOMETER_UNRESOLVED: 'An odometer reading is still needed.',
};

/** Compact photo capture. The selected vehicle is explicit; OCR never silently changes it. */
function SingleBillDialog({
  open,
  onOpenChange,
  onConfirmed = null,
  vehicleId = '',
  registrationNumber = '',
}) {
  const [fuelType, setFuelType] = useState('DIESEL');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState('pick');
  const [fillingType, setFillingType] = useState('');
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(vehicleId);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [result, setResult] = useState(null);
  const [guidance, setGuidance] = useState(null);
  const fileInput = useRef(null);
  const busy = useRef(false);
  const request = useRef(null);
  const uploading = stage === 'uploading';

  useEffect(() => {
    if (!open) return undefined;
    setFile(null);
    setError(null);
    setStage('pick');
    setFillingType('');
    setResult(null);
    setGuidance(null);
    setSelectedVehicleId(vehicleId);
    setFuelType('DIESEL');
    if (vehicleId) return undefined;
    const controller = new AbortController();
    setLoadingVehicles(true);
    getVehicleList({ signal: controller.signal })
      .then((rows) => {
        if (controller.signal.aborted) return;
        setVehicles(rows || []);
        if (registrationNumber) {
          const match = rows.find(
            (row) => normalise(row.registrationNumber) === normalise(registrationNumber),
          );
          setSelectedVehicleId(match ? String(match._id || match.id) : '');
        }
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError('Could not load the vehicle list. Close and reopen to try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingVehicles(false);
      });
    return () => controller.abort();
  }, [open, vehicleId, registrationNumber]);
  useEffect(() => () => request.current?.abort(), []);

  const selected = vehicles.find(
    (vehicle) => String(vehicle._id || vehicle.id) === selectedVehicleId,
  );
  const plate = registrationNumber || selected?.registrationNumber || 'selected truck';
  const pick = (next) => {
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(next.type)) {
      setError('Choose a JPG, PNG, WEBP or PDF bill.');
      return;
    }
    if (next.size > 10 * 1024 * 1024) {
      setError('The bill must be smaller than 10 MB.');
      return;
    }
    setFile(next);
    setError(null);
  };
  const close = () => {
    if (!busy.current) onOpenChange(false);
  };
  const upload = async () => {
    if (busy.current || !file || !selectedVehicleId || !fillingType) return;
    busy.current = true;
    setStage('uploading');
    setError(null);
    const controller = new AbortController();
    request.current = controller;
    try {
      const body = new FormData();
      body.append('fuelPhoto', file);
      body.append('vehicleId', selectedVehicleId);
      body.append('fuelType', fuelType);
      body.append('fillingType', fillingType);
      const saved = await billPhotoService.uploadBillPhoto({ body, signal: controller.signal });
      if (controller.signal.aborted) return;
      // The server may file the photo somewhere else or ask for a retake. Its
      // wording is shown as it was written; nothing else about the read is.
      if (saved?.guidance) setGuidance(saved.guidance);
      if (!saved?.id && !saved?.fuelLog?._id)
        throw new Error('The server did not confirm that the bill was saved.');
      setResult(saved);
      setStage('saved');
      onConfirmed?.(saved);
    } catch (err) {
      if (!controller.signal.aborted) {
        if (err?.response?.data?.guidance) setGuidance(err.response.data.guidance);
        setError(err?.message || 'The bill could not be uploaded. Please try again.');
        setStage('confirm');
      }
    } finally {
      busy.current = false;
    }
  };
  const reviewReasons = result?.reviewReasons || result?.fuelLog?.reviewReasons || [];
  const needsReview = (result?.reviewStatus || result?.fuelLog?.reviewStatus) === 'NEEDS_REVIEW';

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!busy.current) onOpenChange(next);
      }}
    >
      <DialogContent className="bp-dialog" aria-busy={uploading}>
        <button
          type="button"
          className="bp-close"
          aria-label="Close"
          onClick={close}
          disabled={uploading}
        >
          <X size={18} aria-hidden="true" />
        </button>
        <DialogHeader className="bp-dialog-head">
          <DialogTitle>Add bill photo</DialogTitle>
          <DialogDescription>
            {registrationNumber
              ? `Upload a fuel bill for ${registrationNumber}. Review and confirm before saving.`
              : 'Photograph the slip. Choose its truck, then review and confirm before saving.'}
          </DialogDescription>
        </DialogHeader>
        <div className="bp-dialog-body">
          {stage === 'pick' ? (
            <>
              <div className="bp-field">
                <label htmlFor="bill-photo-kind">Bill type</label>
                <SearchableSelect id="bill-photo-kind" value={fuelType} onValueChange={setFuelType}>
                  <option value="DIESEL">Diesel slip</option>
                  <option value="ADBLUE">DEF (AdBlue) slip</option>
                </SearchableSelect>
              </div>
              {!vehicleId ? (
                <div className="bp-field">
                  <label htmlFor="bill-photo-vehicle">Vehicle</label>
                  <SearchableSelect
                    id="bill-photo-vehicle"
                    value={selectedVehicleId}
                    onValueChange={setSelectedVehicleId}
                    disabled={loadingVehicles || Boolean(registrationNumber)}
                    placeholder={loadingVehicles ? 'Loading vehicles…' : 'Choose a truck'}
                  >
                    <option value="" disabled>
                      Choose a truck
                    </option>
                    {vehicles.map((vehicle) => (
                      <option
                        key={vehicle._id || vehicle.id}
                        value={String(vehicle._id || vehicle.id)}
                      >
                        {vehicle.registrationNumber}
                      </option>
                    ))}
                  </SearchableSelect>
                </div>
              ) : null}
              <button
                type="button"
                className={`bp-drop${dragging ? ' bp-drop--active' : ''}`}
                onClick={() => fileInput.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  pick(event.dataTransfer?.files?.[0]);
                }}
              >
                <Camera size={26} aria-hidden="true" />
                <span>Drop a bill photo or click to choose</span>
                <small>JPG, PNG or PDF · up to 10 MB</small>
              </button>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                aria-label="Bill photo"
                className="sr-only"
                onChange={(event) => {
                  pick(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
              {file ? (
                <div className="bp-file">
                  <FileText size={18} aria-hidden="true" />
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
          ) : stage === 'confirm' ? (
            <>
              <div className="bp-confirm">
                <FileText size={22} aria-hidden="true" />
                <div>
                  <strong>{file?.name}</strong>
                  <span>
                    {plate} · {fuelType === 'DIESEL' ? 'Diesel' : 'DEF (AdBlue)'}
                  </span>
                </div>
              </div>
              <div className="bp-field">
                <label htmlFor="bill-photo-fill">Tank full?</label>
                <SearchableSelect
                  id="bill-photo-fill"
                  value={fillingType}
                  onValueChange={setFillingType}
                  placeholder="Choose full or partial"
                >
                  <option value="" disabled>
                    Choose full or partial
                  </option>
                  <option value="FULL_TANK">Yes — full tank</option>
                  <option value="PARTIAL">No — partial fill</option>
                </SearchableSelect>
              </div>
              <p className="bp-help">
                The bill will be saved to <strong>{plate}</strong>. Fuel figures and the receipt
                time are read from the photo. Uncertain or mismatched details are marked for review.
              </p>
            </>
          ) : uploading ? (
            <div className="bp-progress" role="status">
              <Loader2 size={26} className="animate-spin" aria-hidden="true" />
              <strong>Reading and saving your bill…</strong>
              <span>This may take a moment. Keep this window open.</span>
            </div>
          ) : (
            <div className="bp-success" role="status">
              <Check size={28} aria-hidden="true" />
              <strong>Bill saved for {plate}</strong>
              <span>
                {needsReview
                  ? 'Saved for review. Please check the extracted details in Diesel & Mileage.'
                  : 'The fuel entry is now recorded.'}
              </span>
              {reviewReasons.length ? (
                <ul>
                  {reviewReasons.map((reason) => (
                    <li key={reason}>
                      {REVIEW_REASONS[reason] || 'An extracted reading needs review.'}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}
          {error ? (
            <p role="alert" className="bp-error">
              {error}
            </p>
          ) : null}
          {guidance?.message ? (
            <p
              role="status"
              className={
                guidance.status === 'filed_elsewhere'
                  ? 'mt-2 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800'
                  : 'mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800'
              }
            >
              {safeText(guidance.message)}
            </p>
          ) : null}
        </div>
        <div className="bp-dialog-foot">
          {stage === 'saved' ? (
            <Button size="sm" onClick={close}>
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={
                  stage === 'confirm'
                    ? () => {
                        setError(null);
                        setStage('pick');
                      }
                    : close
                }
              >
                {stage === 'confirm' ? 'Back' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                disabled={
                  uploading || !file || !selectedVehicleId || (stage === 'confirm' && !fillingType)
                }
                onClick={
                  stage === 'pick'
                    ? () => {
                        setError(null);
                        setStage('confirm');
                      }
                    : upload
                }
              >
                {uploading ? 'Uploading…' : stage === 'confirm' ? 'Upload & save' : 'Upload'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Many bills at once. The bill type and the truck are optional: the server
 * reads the photo, suggests the truck and the owner confirms it later in
 * "Bills to confirm".
 */
function BillQueueDialog({ open, onOpenChange, rows = [], queue, vehicles = [], onUnavailable }) {
  const input = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [kind, setKind] = useState('');
  const [error, setError] = useState(null);

  const addFiles = (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    const bad = list.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
    if (bad) {
      setError('Choose JPG, PNG or WEBP bill photos.');
      return;
    }
    setError(null);
    queue?.add?.(list);
  };
  const changeKind = (next) => {
    setKind(next ?? '');
    queue?.setKind?.(next ?? '');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bp-dialog">
        <DialogHeader className="bp-dialog-head">
          <DialogTitle>Add bill photos</DialogTitle>
          <DialogDescription>
            1. Upload photos. 2. Check suggested trucks. 3. Confirm bills.
          </DialogDescription>
        </DialogHeader>
        <div className="bp-dialog-body">
          <div className="bp-field">
            <label htmlFor="bill-queue-kind">Bill type (optional)</label>
            <SearchableSelect id="bill-queue-kind" value={kind} onValueChange={changeKind}>
              <option value="">Not sure</option>
              <option value="DIESEL">Diesel slip</option>
              <option value="ADBLUE">DEF (AdBlue) slip</option>
            </SearchableSelect>
          </div>
          <button
            type="button"
            className={`bp-drop${dragging ? ' bp-drop--active' : ''}`}
            onClick={() => input.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer?.files);
            }}
          >
            <Camera size={26} aria-hidden="true" />
            <span>Drop bill photos or tap to choose</span>
            <small>JPG, PNG or WEBP · many at a time</small>
          </button>
          <input
            ref={input}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            aria-label="Bill photo"
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = '';
            }}
          />
          {error ? (
            <p role="alert" className="bp-error">
              {error}
            </p>
          ) : null}
          <BillsTable
            rows={rows}
            vehicles={vehicles}
            queue={queue}
            onUnavailable={onUnavailable}
            onSaved={(ids) => queue?.removeSaved?.(ids)}
          />
        </div>
        <div className="bp-dialog-foot flex-wrap">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * One dialog, two ways in. A single bill with an explicit truck (vehicle
 * screens) or a queue of many bills whose truck is suggested and confirmed
 * later (Diesel & Mileage).
 */
export default function AddBillPhotoDialog(props) {
  return props.queue ? <BillQueueDialog {...props} /> : <SingleBillDialog {...props} />;
}
