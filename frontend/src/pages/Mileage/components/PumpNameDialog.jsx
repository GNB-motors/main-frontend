import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Info, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../../../components/ui/dialog';
import { humanDateTime } from '../mileageDates';
import { formatLitres } from '../../../utils/formatters';
import { refuelCoords } from '../pumpNaming';
import { MileageApi } from '../mileageApi';
import DocumentService from '../../Trip/services/DocumentService';
import RefuelMap from './PumpLocationMap';

export default function PumpNameDialog({ row, onClose, onSaved }) {
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState(row.place?.id || '');
  const [suggestion, setSuggestion] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [billPhoto, setBillPhoto] = useState(null);
  const [openingBill, setOpeningBill] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    MileageApi.pumpOptions(row.id, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setSelectedId(result.linkedPlace?.id || row.place?.id || '');
      })
      .catch((err) => {
        if (!controller.signal.aborted)
          setError(err?.response?.data?.message || 'Could not load pump suggestions. Try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [row, reloadKey]);
  const initialCoords = useMemo(() => refuelCoords(row), [row]);
  const coords = data?.coords || initialCoords;
  const selected =
    data?.savedPumps?.find((p) => p.id === selectedId) ||
    (data?.linkedPlace?.id === selectedId ? data.linkedPlace : null) ||
    (row.place?.id === selectedId ? row.place : null);
  const savedName = selected?.name || '';
  const valid = !!savedName || (name.trim().length >= 2 && name.trim().length <= 120);
  const canSave = !loading && data && !saving && valid && (!!selectedId || !!coords);
  const title = savedName ? 'Pump details' : selectedId ? 'Name pump' : 'Save pump';
  const choosePump = (id) => {
    setSelectedId(id);
    setName('');
    setSuggestion(null);
  };
  const changeName = (value) => {
    setName(value);
    setSuggestion(null);
  };

  const openBill = async () => {
    setOpeningBill(true);
    try {
      const doc = await DocumentService.getDocument(data.bill.documentId);
      const url = doc?.publicUrl || doc?.data?.publicUrl;
      if (!url) throw new Error('No photo');
      setBillPhoto(url);
    } catch {
      setError('Could not open the bill photo. Try again.');
    } finally {
      setOpeningBill(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const result = await MileageApi.savePump(row.id, {
        ...(selectedId ? { siteId: selectedId } : { create: true }),
        ...(savedName ? {} : { name: name.trim() }),
        source: savedName ? 'EXISTING' : suggestion?.source || 'MANUAL',
        ...(suggestion?.billId && !savedName ? { billId: suggestion.billId } : {}),
        ...(suggestion?.poiId && !savedName ? { poiId: suggestion.poiId } : {}),
      });
      onSaved(result.place);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Could not save this pump. Your name has been kept; try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent className="mhub-pump-dialog" initialFocus={inputRef}>
        <form onSubmit={save}>
          <div className="mhub-pump-head">
            <div>
              <DialogTitle className="mhub-pump-title">{title}</DialogTitle>
              <DialogDescription className="mhub-pump-context">
                {[
                  row.vehicleNo || 'Truck',
                  row.at && humanDateTime(row.at),
                  row.sensorLitres != null && formatLitres(row.sensorLitres, { decimals: 0 }),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </DialogDescription>
            </div>
            <button
              type="button"
              className="mhub-pump-close"
              aria-label="Close naming dialog"
              disabled={saving}
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
          <div className="mhub-pump-body">
            {coords && (
              <div className="mhub-pump-location">
                <RefuelMap coords={coords} candidate={suggestion} />
              </div>
            )}
            {loading && (
              <p role="status" className="mhub-pump-hint">
                Loading saved pumps and nearby stations…
              </p>
            )}
            {error && (
              <div className="mhub-pump-error" role="alert">
                {error}
                {!data && (
                  <button
                    type="button"
                    className="mhub-pump-recenter"
                    onClick={() => setReloadKey((k) => k + 1)}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}
            {data && (
              <>
                {!!data.savedPumps?.length && (
                  <fieldset className="mhub-pump-choices" disabled={saving}>
                    <legend>Saved pumps nearby</legend>
                    <div className="mhub-pump-choice-list">
                      {data.savedPumps.map((pump) => (
                        <label
                          className="mhub-pump-choice"
                          key={pump.id}
                          htmlFor={`saved-pump-${pump.id}`}
                        >
                          <input
                            id={`saved-pump-${pump.id}`}
                            aria-label={pump.name || 'Unnamed pump'}
                            type="radio"
                            name="savedPump"
                            checked={selectedId === pump.id}
                            onChange={() => choosePump(pump.id)}
                            disabled={!!data.linkedPlace && data.linkedPlace.id !== pump.id}
                          />
                          <span>
                            <strong>{pump.name || 'Unnamed pump'}</strong>
                            <small>{pump.distanceM} m from refuel · Saved place</small>
                          </span>
                        </label>
                      ))}
                      {!data.linkedPlace && (
                        <label className="mhub-pump-choice" htmlFor="create-pump">
                          <input
                            id="create-pump"
                            aria-label="Create a separate pump at the refuel pin"
                            type="radio"
                            name="savedPump"
                            checked={!selectedId}
                            onChange={() => choosePump('')}
                          />
                          <span>Create a separate pump at the refuel pin</span>
                        </label>
                      )}
                    </div>
                  </fieldset>
                )}
                {!savedName && !!data.suggestions?.length && (
                  <div className="mhub-pump-suggestions">
                    <span className="mhub-pump-section-label">Suggested names</span>
                    <div className="mhub-pump-choice-list">
                      {data.suggestions.map((item) => (
                        <div className="mhub-pump-suggestion" key={item.id}>
                          <span>
                            <strong>{item.name}</strong>
                            <small>
                              {item.source === 'BILL'
                                ? 'On linked bill'
                                : `Track pump data · ${item.distanceM} m away`}
                            </small>
                            {item.address && <small>{item.address}</small>}
                          </span>
                          <button
                            type="button"
                            className="mhub-pump-recenter"
                            disabled={saving}
                            onClick={() => {
                              setName(item.name);
                              setSuggestion(item);
                              inputRef.current?.focus();
                            }}
                          >
                            Use name
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="mhub-pump-hint">
                      Suggestions only. Check the station and name before saving.
                    </p>
                  </div>
                )}
                {data.bill && (
                  <div className="mhub-pump-bill-context">
                    {data.bill.documentId && (
                      <button
                        type="button"
                        className="mhub-pump-recenter"
                        disabled={openingBill}
                        onClick={openBill}
                      >
                        {openingBill ? 'Opening…' : 'View bill'}
                      </button>
                    )}
                    <span>
                      On linked bill: {data.bill.stationName || 'No station name recorded'}
                    </span>
                    {data.bill.address && <small>Bill address: {data.bill.address}</small>}
                  </div>
                )}
                <div className="mhub-pump-fields">
                  <div className="mhub-pump-field-head">
                    <label htmlFor="pump-name">Pump name</label>
                    {selected && (
                      <Link
                        className="mhub-pump-places"
                        to={`/place-hub?place=${encodeURIComponent(selected.hubId)}`}
                      >
                        View in Places <ArrowUpRight size={15} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                  <input
                    ref={inputRef}
                    aria-label="Pump name"
                    id="pump-name"
                    name="pumpName"
                    value={savedName || name}
                    readOnly={!!savedName}
                    disabled={saving}
                    maxLength={120}
                    minLength={2}
                    required
                    placeholder="e.g. Salbani Fuel Station"
                    aria-describedby="pump-name-hint"
                    onChange={(event) => changeName(event.target.value)}
                  />
                  <p id="pump-name-hint" className="mhub-pump-hint">
                    <Info size={15} aria-hidden="true" />
                    <span>
                      {savedName
                        ? 'This saved name is protected. Linking a bill will not rename the pump.'
                        : selectedId
                          ? 'This name will appear on other refuels linked to this pump.'
                          : 'Creates a saved fuel pump at the recorded refuel pin. Other places stay unchanged.'}
                    </span>
                  </p>
                  {!coords && !selectedId && (
                    <p className="mhub-pump-hint">
                      A recorded refuel location is required before saving a place.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="mhub-pump-footer">
            <span className="mhub-pump-hint">
              {savedName ? 'Saved pump names stay unchanged.' : 'Only saves when you confirm.'}
            </span>
            <div className="mhub-pump-actions">
              <button
                type="button"
                className="mhub-pump-cancel"
                disabled={saving}
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="mhub-pump-save" disabled={!canSave}>
                {saving
                  ? 'Saving…'
                  : savedName
                    ? 'Use this pump'
                    : selectedId
                      ? 'Save pump name'
                      : 'Save as new pump'}
              </button>
            </div>
          </div>
        </form>
        <Dialog
          open={!!billPhoto}
          onOpenChange={(open) => {
            if (!open) setBillPhoto(null);
          }}
        >
          <DialogContent forceBackdrop className="mhub-pump-bill-photo">
            <DialogTitle>Linked fuel bill</DialogTitle>
            <DialogDescription>
              Check the station name printed on this refuel’s bill.
            </DialogDescription>
            <button type="button" className="mhub-pump-cancel" onClick={() => setBillPhoto(null)}>
              Close bill
            </button>
            {billPhoto && <img src={billPhoto} alt="Linked fuel receipt" />}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
