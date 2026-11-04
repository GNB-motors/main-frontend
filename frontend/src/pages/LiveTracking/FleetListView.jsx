import Skel from './Skel.jsx';
import VehicleCardSkeleton from './VehicleCardSkeleton.jsx';
import renderIconSvg from './renderIconSvg.jsx';
import { NOVA_STATUS } from './statusPalettes.js';
import { formatAgoText } from './minutesAgoFormat.js';
import VehicleLocation from './VehicleLocation.jsx';
import { formatFuel } from '../../utils/liveView.js';
import { modelLabel } from './vehiclePanelModel';
import TrackLoadError from './TrackLoadError.jsx';
import TrackIdlingChip from './TrackIdlingChip.jsx';
import AlertBadge from './AlertBadge.jsx';
import { plateKey } from './trackIdlingModel.js';
import { formatKnownEtaLine, matchKnownEta } from '../../lib/knownEta';

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
  idlingByPlate = new Map(),
  alertCounts = new Map(),
  knownEtas = [],
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
          filteredVehicles.map((v) => {
            const s = NOVA_STATUS[v.status] || NOVA_STATUS.offline;
            const isSel = v.id === selectedId;
            const knownLine = formatKnownEtaLine(matchKnownEta(knownEtas, v.plate));

            return (
              <div
                key={v.id}
                className={`vcard ${isSel ? 'is-sel' : ''}`}
                role="button"
                tabIndex={0}
                style={{ '--c': s.c }}
                onClick={() => setSelectedId(v.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedId(v.id);
                  }
                }}
              >
                <div className="vc-top">
                  <div className="vc-id">
                    <div className="vc-plate">
                      {v.plate}
                      <AlertBadge count={alertCounts.get(plateKey(v.plate)) || 0} />
                    </div>
                    <div className="vc-vin">
                      {v.manufacturer || 'Manufacturer unknown'}
                      {modelLabel(v.model) ? ` · ${modelLabel(v.model)}` : ''}
                    </div>
                    <div className="vc-vin">VIN: {v.vin || '—'}</div>
                    {knownLine ? <div className="vc-vin">{knownLine}</div> : null}
                    <TrackIdlingChip minutes={idlingByPlate.get(plateKey(v.plate)) ?? null} />
                  </div>
                  <span className="vc-state">
                    <i />
                    {s.label}
                  </span>
                </div>

                {/* Current location (real position) */}
                <div className="vc-loc">
                  <VehicleLocation vehicle={v} />
                </div>

                {/* Card Meta Footer */}
                <div className="vc-meta">
                  <span>
                    {renderIconSvg('fuel', 13)}
                    <b title={`Fuel ${formatFuel(v.fuelReading)}`}>{formatFuel(v.fuelReading)}</b>
                  </span>
                  <span>
                    {renderIconSvg('zap', 13)}
                    {v.ignition}
                  </span>
                  <span>
                    {renderIconSvg('nav', 13)}
                    {v.gps}
                  </span>
                  <span className="sp" />
                  <span>{v.ago != null ? formatAgoText(v.ago) : '—'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
