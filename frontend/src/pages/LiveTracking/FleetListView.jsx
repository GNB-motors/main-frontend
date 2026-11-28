import Skel from './Skel.jsx';
import VehicleCardSkeleton from './VehicleCardSkeleton.jsx';
import renderIconSvg from './renderIconSvg.jsx';
import { NOVA_STATUS } from './statusPalettes.js';
import { formatAgoText } from './minutesAgoFormat.js';
import VehicleLocation from './VehicleLocation.jsx';
import TrackLoadError from './TrackLoadError.jsx';
import AlertBadge from './AlertBadge.jsx';
import { plateKey } from './trackIdlingModel.js';
import { modelLabel } from './vehiclePanelModel.js';
import { formatFuelValue, fuelUnitTitle } from '../../utils/liveView.js';
import { sortFleet } from './fleetSortModel.js';
import { alertsForVehicle } from './trackAlertsModel';
import { trackAlertView } from './trackAlertPresentation';

const SKEL_CARD_COUNT = 6;

export default function FleetListView({
  isLiveLoading,
  vehicles,
  filteredVehicles,
  counts,
  setIsRailOpen,
  triggerMapResize,
  selectedId,
  setSelectedId,
  error = null,
  onRetry = null,
  alertCounts = new Map(),
  alerts = [],
  filter = 'all',
}) {
  // A failed load is not an empty fleet. Say so instead of showing "0 vehicles".
  const loadFailed = Boolean(error) && vehicles.length === 0;

  return (
    <div className="railview">
      <div className="fhead">
        <div className="ftitle">
          <h2>Fleet</h2>
          <div className="fsub">
            {isLiveLoading ? (
              <Skel w={120} h={10} />
            ) : loadFailed ? (
              "Couldn't load your fleet"
            ) : vehicles.length === 0 ? (
              '0 vehicles · 0 live'
            ) : filteredVehicles.length === vehicles.length ? (
              `${vehicles.length} vehicles · ${counts.gps} live`
            ) : (
              `${filteredVehicles.length} of ${vehicles.length} vehicles`
            )}
          </div>
        </div>

        <button
          className="btn btn--sm gap-1.5"
          title="Hide list"
          aria-label="Hide list"
          onClick={() => {
            setIsRailOpen(false);
            setTimeout(triggerMapResize, 240);
          }}
        >
          {renderIconSvg('chevRight', 16)}
          <span>Hide</span>
        </button>
      </div>

      {/* Cards List. The search box lives on the map now (F1.3), so the list
          starts straight at the trucks. */}
      <div className="flist" aria-busy={isLiveLoading}>
        {isLiveLoading ? (
          Array.from({ length: SKEL_CARD_COUNT }, (_, i) => <VehicleCardSkeleton key={i} />)
        ) : loadFailed ? (
          <TrackLoadError onRetry={onRetry} />
        ) : !filteredVehicles.length ? (
          <div className="fempty">
            {vehicles.length === 0
              ? "No vehicles found in your organization's fleet."
              : 'No vehicles match this filter.'}
          </div>
        ) : (
          sortFleet(filteredVehicles, { filter, alertCounts }).map((v) => {
            const s = NOVA_STATUS[v.status] || NOVA_STATUS.offline;
            const isSel = v.id === selectedId;
            const vehicleAlerts = alertsForVehicle(alerts, v.plate);

            return (
              <article
                key={v.id}
                className={`vcard ${isSel ? 'is-sel' : ''}`}
                style={{ '--c': s.c }}
              >
                <button
                  type="button"
                  className="vc-select"
                  aria-label={`View ${v.plate} details`}
                  onClick={() => setSelectedId(v.id)}
                />
                <div className="vc-top">
                  <div className="vc-id">
                    <div className="vc-plate">
                      {v.plate}
                      <AlertBadge
                        count={alertCounts.get(plateKey(v.plate)) || 0}
                        alerts={vehicleAlerts}
                        registrationNumber={v.plate}
                      />
                    </div>
                    <div className="vc-vin">
                      {v.manufacturer || 'Manufacturer unknown'}
                      {modelLabel(v.model) ? ` · ${modelLabel(v.model)}` : ''}
                    </div>
                    <div className="vc-vin">VIN: {v.vin || '—'}</div>
                    {vehicleAlerts.length ? (
                      <p className="vc-alert-reason">{trackAlertView(vehicleAlerts[0]).title}</p>
                    ) : null}
                  </div>
                  <span className="vc-state">
                    <i />
                    {v.neverReported ? 'No telemetry' : s.label}
                  </span>
                </div>

                {/* Current location (real position) */}
                <div className="vc-loc">
                  <VehicleLocation vehicle={v} />
                </div>

                {/* Card Meta Footer */}
                <div className="vc-meta">
                  <span>
                    {Number.isFinite(v.speed) ? `${Math.round(v.speed)} km/h` : 'Speed unknown'}
                  </span>
                  {v.fuelReading != null ? (
                    <span
                      title={
                        fuelUnitTitle(v.fuelReading) || `Fuel ${formatFuelValue(v.fuelReading)}`
                      }
                    >
                      {renderIconSvg('fuel', 13)}
                      <b>{formatFuelValue(v.fuelReading)}</b>
                    </span>
                  ) : null}
                  {v.ignition && v.ignition !== '—' ? (
                    <span>
                      {renderIconSvg('zap', 13)}
                      {v.ignition}
                    </span>
                  ) : null}
                  {v.gps && v.gps !== '—' ? (
                    <span>
                      {renderIconSvg('nav', 13)}
                      {v.gps}
                    </span>
                  ) : null}
                  <span className="sp" />
                  <span>
                    {v.neverReported
                      ? 'No telemetry received'
                      : v.ago != null
                        ? formatAgoText(v.ago)
                        : '—'}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
