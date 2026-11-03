import Skel from './Skel.jsx';
import VehicleCardSkeleton from './VehicleCardSkeleton.jsx';
import renderIconSvg from './renderIconSvg.jsx';
import { NOVA_STATUS } from './statusPalettes.js';
import { formatAgoText } from './minutesAgoFormat.js';
import VehicleLocation from './VehicleLocation.jsx';
import { formatFuel } from '../../utils/liveView.js';
import { modelLabel } from './vehiclePanelModel';

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
}) {
  return (
    <div className="railview">
      <div className="fhead">
        <div className="ftitle">
          <h2>Fleet</h2>
          <div className="fsub">
            {isLiveLoading ? (
              <Skel w={120} h={10} />
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
          className="btn btn--sm btn--icon"
          title="Hide list"
          aria-label="Hide list"
          onClick={() => {
            setIsRailOpen(false);
            setTimeout(triggerMapResize, 240);
          }}
        >
          {renderIconSvg('chevRight', 16)}
        </button>
      </div>

      {/* Cards List. The search box lives on the map now (F1.3), so the list
          starts straight at the trucks. */}
      <div className="flist" aria-busy={isLiveLoading}>
        {isLiveLoading ? (
          Array.from({ length: SKEL_CARD_COUNT }, (_, i) => <VehicleCardSkeleton key={i} />)
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
                    <div className="vc-plate">{v.plate}</div>
                    <div className="vc-vin">
                      {v.manufacturer || 'Manufacturer unknown'}
                      {modelLabel(v.model) ? ` · ${modelLabel(v.model)}` : ''}
                    </div>
                    <div className="vc-vin">VIN: {v.vin || '—'}</div>
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
