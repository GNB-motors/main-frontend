import Ico from '../../routeHubIcons.jsx';
import { Seg } from '../../routeHubShared.jsx';
import { dkey } from '../../routeHubFormat';
import { RANGES } from './replayConstants.js';

export default function ReplayToolbar({
  reg,
  setReg,
  setTrip,
  erpTripId,
  setErpTripId,
  erpTrips,
  pickTrip,
  load,
  range,
  setRange,
  vehicles,
  from,
  setFrom,
  to,
  setTo,
  loading,
  toast,
}) {
  return (
    <div className="card">
      <div className="rtool">
        <span className="lbl">Vehicle</span>
        <label className="field">
          <select
            value={reg}
            onChange={(e) => {
              setReg(e.target.value);
              setTrip(null);
              // The picked trip belongs to the old vehicle; keeping it would replay
              // one vehicle's window under another's trail.
              setErpTripId('');
              load(e.target.value, range, '', null);
            }}
          >
            {vehicles.map((v) => (
              <option key={v._id} value={v.registrationNumber}>
                {v.registrationNumber}
                {v.model ? ` · ${v.model}` : ''}
              </option>
            ))}
          </select>
        </label>

        {/* Only offered when the vehicle actually has booked trips — an org
            without ERP keeps the plain date-range replay. */}
        {erpTrips.length > 0 && (
          <>
            <span className="lbl">Trip</span>
            <label className="field">
              <select
                aria-label="ERP trip"
                value={erpTripId}
                onChange={(e) => pickTrip(e.target.value)}
              >
                <option value="">Date range (no trip)</option>
                {erpTrips.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.tripNumber}
                    {t.tripDate ? ` · ${dkey(new Date(t.tripDate))}` : ''}
                    {t.warehouseAnchors?.exitedAt ? ' · anchored' : ''}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <Seg
          options={RANGES}
          value={range}
          onChange={(r) => {
            setRange(r);
            // Switching back to a date range drops the trip: the timeline would
            // otherwise still be labelled "left the yard at…" for a window that no
            // longer matches that trip.
            setErpTripId('');
            load(reg, r, '', null);
          }}
        />
        <span className="lbl">From</span>
        <label className="field">
          <input
            type="date"
            aria-label="From date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <span className="lbl">To</span>
        <label className="field">
          <input
            type="date"
            aria-label="To date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="btn btn--primary"
          disabled={loading}
          onClick={() => {
            setRange('custom');
            setErpTripId('');
            load(reg, 'custom', '', null).then(() => toast(`Replay loaded · ${reg}`));
          }}
        >
          <Ico n="route" />
          {loading ? 'Loading…' : 'Load replay'}
        </button>
      </div>
    </div>
  );
}
