import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, History, Receipt, Truck, X } from 'lucide-react';
import DrawerViewerPane from '../../Superadmin/components/receipts/DrawerViewerPane';
import billPhotoService from '../../../services/billPhotoService';
import {
  DASH,
  officeRow,
  photoIndex,
  topCandidate,
  useTruckConfirmation,
  hasUnsavedOfficeChanges,
} from './officeBill';
import OfficeChangeTruckCard from './OfficeChangeTruckCard';
import OfficeTruckSuggestions from './OfficeTruckSuggestions';
/**
 * The owner & manager bill drawer: the same shell as the WhatsApp receipt
 * drawer, with the photo on the left, the facts and the truck choices on the
 * right.
 */
const OfficeBillDrawer = ({ capture, open = true, onClose, vehicles = [], onSaved, onHistory }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [photo, setPhoto] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [reason, setReason] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [closeNotice, setCloseNotice] = useState('');
  const {
    chosen,
    touched,
    confirmBlocked,
    shakeCount,
    confirmButtonRef,
    choose,
    resetChoice,
    blockConfirm,
    clearBlocked,
  } = useTruckConfirmation(capture?.id);
  const row = useMemo(() => officeRow(capture), [capture]);
  const confirmed = Boolean(row.confirmed);
  const top = topCandidate(suggestion || capture?.suggestion);
  const plate = touched ? chosen : row.plate || top?.registrationNumber || '';
  const truckChosen = touched && Boolean(plate.trim());
  // The photo, from the server's own copy of the capture.
  useEffect(() => {
    if (!open || !capture?.id) return undefined;
    const controller = new AbortController();
    let objectUrl;
    setPhoto('');
    setPhotoError('');
    billPhotoService
      .getBillPage(capture.id, photoIndex(capture), { signal: controller.signal })
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setPhoto(objectUrl);
      })
      .catch(() => {
        if (!controller.signal.aborted) setPhotoError('The photo could not be loaded.');
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, capture]);
  // The truck suggestions the server has for this photo.
  useEffect(() => {
    if (!open || !capture?.id) return undefined;
    const controller = new AbortController();
    setSuggestion(capture.suggestion || null);
    billPhotoService
      .getBillSuggestion(capture.id, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setSuggestion(result || null);
      })
      .catch(() => {
        // The capture's own suggestion is already on screen; a failed refresh
        // only leaves it as it was, so there is nothing to report here.
      });
    return () => controller.abort();
  }, [open, capture]);
  // Work that closing the drawer would throw away: a truck the person picked
  // but has not confirmed, or a change that has not been saved.
  const unsaved = hasUnsavedOfficeChanges({
    editing,
    plate,
    savedPlate: row.plate,
    reason,
    truckChosen,
  });

  // The drawer closes only when nothing would be lost.
  const closeDrawer = () => {
    if (saving) {
      setCloseNotice('Saving — please wait for it to finish.');
      return;
    }
    if (unsaved) {
      setCloseNotice('You have unsaved changes');
      return;
    }
    onClose?.();
  };
  // Escape must reach the same guard without re-registering the listener.
  const closeRef = useRef(closeDrawer);
  closeRef.current = closeDrawer;

  // Escape closes the drawer, the way the WhatsApp drawer closes.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);
  /** The bill is linked to a truck: the person confirms it. */
  const confirm = async () => {
    if (saving) return;
    if (!truckChosen) {
      blockConfirm();
      return;
    }
    clearBlocked();
    setSaving(true);
    setError('');
    try {
      await billPhotoService.saveBillLinks([
        {
          captureId: capture.id,
          registrationNumber: plate.trim(),
          reason: null,
          via: 'APPROVALS',
        },
      ]);
      onSaved?.(capture.id);
      onClose?.();
    } catch {
      // The drawer and the choice stay: the person can try again.
      setError('Could not confirm. Try again.');
    } finally {
      setSaving(false);
    }
  };
  /** The bill is linked already: the truck is changed, with a reason. */
  const changeTruck = async () => {
    if (saving || !reason.trim()) return;
    setSaving(true);
    setError('');
    try {
      await billPhotoService.editBillLink(capture.id, {
        registrationNumber: plate.trim(),
        reason: reason.trim(),
      });
      onSaved?.(capture.id);
      setEditing(false);
      setReason('');
      onClose?.();
    } catch (err) {
      setError(
        (err?.status ?? err?.response?.status) === 409
          ? 'This link cannot be changed. It may be attached to a trip, have multiple fuel logs, or have an ambiguous registration.'
          : 'Could not change truck. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };
  if (!open || !capture) return null;
  return (
    <div
      className="ra-drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        // Only a press that starts on the dimmed background closes the drawer:
        // a drag that starts inside the panel and ends outside must not.
        if (event.target !== event.currentTarget) return;
        closeDrawer();
      }}
    >
      <div className="ra-drawer">
        <div className="ra-drawer__header">
          <div className="ra-drawer__header-left">
            <span className="ra-drawer__veh-badge">
              <Receipt size={16} />
              {row.plate || 'Bill'}
            </span>
            <span className={`ra-badge ${confirmed ? 'ra-badge--published' : 'ra-badge--ready'}`}>
              <span className="ra-badge__dot" />
              {row.status}
            </span>
          </div>
          <div className="ra-drawer__header-right">
            <button
              type="button"
              className="ra-drawer__close"
              onClick={closeDrawer}
              title="Close Drawer (Esc)"
              aria-label="Close Drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="ra-drawer__body">
          <div className="ra-drawer__split">
            {/* The photo, the way the WhatsApp drawer shows it. */}
            <DrawerViewerPane
              activeTab="bill"
              setActiveTab={() => {}}
              setZoom={setZoom}
              setRotation={setRotation}
              draft={{ odometerImageUrl: null }}
              currentImg={photo}
              zoom={zoom}
              rotation={rotation}
              photos={[]}
              photoIndex={0}
              setPhotoIndex={() => {}}
            />
            <div className="ra-drawer__details-col">
              {/* The facts of the bill, in short. */}
              <div className="ra-section-card">
                <div className="ra-section-card__title">
                  <Receipt size={15} /> Bill facts
                </div>
                <div className="ra-grid-props">
                  <div className="ra-prop">
                    <span className="ra-prop__label">Pump</span>
                    <span className="ra-prop__val">{row.pump || DASH}</span>
                  </div>
                  <div className="ra-prop">
                    <span className="ra-prop__label">Litres</span>
                    <span className="ra-prop__val">{row.litres || DASH}</span>
                  </div>
                  <div className="ra-prop">
                    <span className="ra-prop__label">Amount</span>
                    <span className="ra-prop__val">{row.amount}</span>
                  </div>
                  <div className="ra-prop">
                    <span className="ra-prop__label">Rate</span>
                    <span className="ra-prop__val">{row.rate || DASH}</span>
                  </div>
                  <div className="ra-prop">
                    <span className="ra-prop__label">Bill date/time</span>
                    <span className="ra-prop__val">
                      {row.date || DASH}
                      {row.time ? ` \u00b7 ${row.time}` : ''}
                    </span>
                  </div>
                  <div className="ra-prop">
                    <span className="ra-prop__label">Uploaded by</span>
                    <span className="ra-prop__val">{row.uploader}</span>
                  </div>
                  {confirmed && (
                    <div className="ra-prop ra-prop--full">
                      <span className="ra-prop__label">Confirmed by</span>
                      <span className="ra-prop__val">
                        {`${row.confirmedBy} \u00b7 ${row.confirmedVia}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <OfficeTruckSuggestions
                suggestion={suggestion}
                capture={capture}
                vehicles={vehicles}
                plate={plate}
                selectedPlate={truckChosen ? plate : ''}
                onChoose={choose}
              />
              {/* A confirmed bill: the truck can still be changed, with a reason. */}
              {confirmed && (
                <OfficeChangeTruckCard
                  capture={capture}
                  suggestion={suggestion}
                  vehicles={vehicles}
                  plate={plate}
                  editing={editing}
                  reason={reason}
                  saving={saving}
                  onChoose={choose}
                  onReasonChange={setReason}
                  onSave={changeTruck}
                  onStartEdit={() => {
                    setEditing(true);
                    setError('');
                  }}
                  onCancel={() => {
                    setEditing(false);
                    resetChoice();
                    setReason('');
                    setError('');
                  }}
                />
              )}
            </div>
          </div>
        </div>
        {closeNotice && (
          <div className="ra-alert" role="alert">
            <AlertTriangle size={16} />
            <span>{closeNotice}</span>
          </div>
        )}
        {error && (
          <div className="ra-alert ra-alert--error" role="alert">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
        {photoError && (
          <div className="ra-alert" role="status">
            <AlertTriangle size={16} />
            <span>{photoError}</span>
          </div>
        )}
        <div className="ra-drawer__footer">
          <div className="ra-drawer__footer-left">
            <span className="ra-drawer__footer-id">{`Bill #${String(capture.id).slice(-8)}`}</span>
          </div>
          <div className="ra-drawer__footer-actions">
            {confirmed ? (
              <>
                <button
                  type="button"
                  className="ra-btn ra-btn--ghost"
                  onClick={() => {
                    if (editing) {
                      setEditing(false);
                      setReason('');
                    } else {
                      setEditing(true);
                    }
                    setError('');
                  }}
                >
                  <Truck size={16} /> {editing ? 'Cancel change' : 'Change truck'}
                </button>
                <button
                  type="button"
                  className="ra-btn ra-btn--ghost"
                  onClick={() => onHistory?.(capture)}
                >
                  <History size={16} /> Log
                </button>
              </>
            ) : (
              <>
                <button
                  key={`confirm-${shakeCount}`}
                  ref={confirmButtonRef}
                  type="button"
                  className={`ra-btn ra-btn--publish${confirmBlocked && !truckChosen ? ' ra-btn--blocked ra-btn--shake' : ''}`}
                  onClick={confirm}
                  disabled={saving}
                >
                  <CheckCircle2 size={16} />
                  {saving ? 'Confirming.' : 'Confirm'}
                </button>
                {confirmBlocked && !truckChosen && (
                  <span className="ra-key-blocked-alert" role="alert">
                    Key field missing: Truck
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default OfficeBillDrawer;
