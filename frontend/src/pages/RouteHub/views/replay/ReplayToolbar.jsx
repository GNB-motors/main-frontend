import Ico from '../../routeHubIcons.jsx';
import { Seg } from '../../routeHubShared.jsx';
import { dkey } from '../../routeHubFormat';
import { RANGES } from './replayConstants.js';
import SearchableDropdown from '../../../../components/SearchableDropdown/SearchableDropdown';
import './ReplayToolbar.css';

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
  const vehicleOptions = vehicles.map((vehicle) => ({
    ...vehicle,
    name: [vehicle.registrationNumber, vehicle.model].filter(Boolean).join(' · '),
  }));
  const selectedVehicle = vehicleOptions.find((vehicle) => vehicle.registrationNumber === reg);
  return (
    <div className="card rtool-card" style={{ overflow: 'visible' }}>
      <div className="rtool">
        <span className="lbl">Vehicle</span>
        <div className="rtool-vehicle-picker">
          <SearchableDropdown
            options={vehicleOptions}
            selectedOption={selectedVehicle?.name || reg}
            placeholder="Select or search vehicle…"
            disabled={loading}
            getSearchText={(vehicle) =>
              [
                vehicle.registrationNumber,
                vehicle.model,
                vehicle.chassisNumber,
                vehicle.manufacturer,
              ]
                .filter(Boolean)
                .join(' ')
            }
            onSelect={(vehicle) => {
              const nextReg = vehicle.registrationNumber;
              setReg(nextReg);
              setTrip(null);
              // Trip evidence belongs to the previously selected vehicle.
              setErpTripId('');
              load(nextReg, range, '', null);
            }}
          />
        </div>

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
