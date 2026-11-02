import { Navigation, ChevronDown } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { LiveTrackingService } from './LiveTrackingService';

const pct = (v) => (typeof v === 'number' ? `${Math.round(v * 100)}%` : '—');
const km1 = (v) => (typeof v === 'number' ? `${v.toFixed(1)} km` : '—');
const timeIST = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      });
};

const LOAD_LABEL = { LADEN: 'Laden', EMPTY: 'Empty', UNKNOWN: 'Unknown' };

// Plates are stored as each fleet typed them, with or without spaces.
const plateKey = (reg) =>
  String(reg || '')
    .toUpperCase()
    .replace(/\s+/g, '');

/* The backend names each candidate (Place Hub's name, "Driver's home",
   "Somewhere else"); a raw id is never shown (audit DC-28). */
function candidateLabel(c) {
  if (!c) return null;
  if (c.name) return c.name;
  if (c.ref === 'NONE') return 'Somewhere else';
  return 'Unnamed place';
}

/**
 * Predicted destination for the selected vehicle (Trip Economics intents). Lives
 * in the Live Tracking detail rail (telematics itself has no destination/ETA).
 * Read-only, best-effort: shows nothing if the vehicle has no recent prediction.
 */
export default function DestinationIntentSection({ registrationNumber }) {
  const { data, loading, error } = useApi(
    (signal) => LiveTrackingService.getIntents({ signal, registrationNumber }),
    [registrationNumber],
  );
  const wanted = plateKey(registrationNumber);
  const intent = wanted
    ? (data || []).find((i) => plateKey(i.registrationNumber) === wanted)
    : undefined;

  const top = intent && Array.isArray(intent.candidates) ? intent.candidates[0] : null;
  const eta = timeIST(intent?.eta?.etaAt);
  const alertState = intent?.alert?.state;

  return (
    <details className="sec">
      <summary>
        <Navigation size={16} aria-hidden="true" />
        Destination intent
        <span className="chev">
          <ChevronDown size={16} aria-hidden="true" />
        </span>
      </summary>
      <div className="secbody">
        {loading && !data ? (
          <div className="secnote">Loading prediction…</div>
        ) : error ? (
          <div className="secnote">
            {error?.status === 403 || error?.status === 404
              ? 'Destination prediction is available to owners and managers of fleets with Auto Trips on.'
              : 'Destination prediction is unavailable right now.'}
          </div>
        ) : !intent ? (
          <div className="secnote">
            No prediction for this vehicle right now. It needs the truck moving with a GPS fix in
            the last 30 minutes.
          </div>
        ) : (
          <>
            <div className="kv">
              <span className="k">Likely destination</span>
              <span className="v">
                {candidateLabel(top)}
                {top && typeof top.p === 'number' ? ` · ${pct(top.p)}` : ''}
              </span>
            </div>
            <div className="kv">
              <span className="k">Load state</span>
              <span className="v">{LOAD_LABEL[intent.loadState] || intent.loadState || '—'}</span>
            </div>
            <div className="kv">
              <span className="k">Business / personal</span>
              <span className="v">
                {pct(intent.intentClass?.business)} / {pct(intent.intentClass?.nonBusiness)}
              </span>
            </div>
            {eta ? (
              <div className="kv">
                <span className="k">ETA</span>
                <span className="v">{eta} IST</span>
              </div>
            ) : null}
            <div className="kv">
              <span className="k">Since anchor</span>
              <span className="v">
                {km1(intent.openMeter?.km)}
                {typeof intent.openMeter?.fuelL === 'number'
                  ? ` · ${intent.openMeter.fuelL.toFixed(1)} L`
                  : ''}
              </span>
            </div>
            {alertState && alertState !== 'NONE' ? (
              <div className="secnote">
                ⚠️ Deviation in progress — off the expected business route.
              </div>
            ) : null}
          </>
        )}
      </div>
    </details>
  );
}
