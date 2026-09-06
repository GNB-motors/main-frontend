import { Link } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import EmptyState from '../../components/cluster/EmptyState';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import PlaceLabel from '../../components/ui/PlaceLabel';
import { DataArcGauge, DataValue } from '../../components/data-state';
import { formatKm, formatNum, timeAgo } from '../../utils/formatters';
import { formatDateTimeIST } from '../../utils/dateUtils';
import { Panel, KV } from './vehicle360Atoms';
import { fuelUnit, defUnit, hasDefLedgerData } from './vehicle360Logic';

/** Live readings: fuel/DEF gauges, odometer, engine hours, next service. */
export const HealthPanel = ({ health }) => (
  <PanelErrorBoundary name="vehicle-health">
    <Panel eyebrow="Live readings">
      {health ? (
        <>
          <div className="flex items-start justify-around">
            <DataArcGauge
              value={health.primaryFuelLevel}
              label="Fuel"
              unit={fuelUnit(health)}
              at={health.pulledAt}
              low={15}
              warn={30}
            />
            <DataArcGauge
              value={health.defLevel}
              label="DEF"
              unit={defUnit(health)}
              at={health.pulledAt}
              low={10}
              warn={25}
            />
          </div>
          <div className="mt-2">
            <KV k="Odometer (CAN)" v={health.canOdo != null ? formatKm(health.canOdo) : '—'} />
            <KV
              k="Engine hours"
              v={
                health.engineRunHour != null
                  ? `${formatNum(health.engineRunHour, { decimals: 1 })} h`
                  : '—'
              }
            />
            <KV
              k="Next service"
              v={
                health.nextServiceKm != null
                  ? `${formatKm(health.nextServiceKm)}${health.kmToService != null ? ` (${formatNum(health.kmToService)} km left)` : ''}`
                  : '—'
              }
            />
          </div>
          {health.kmToService != null && health.kmToService < 5000 ? (
            <span
              className={`lamp ${health.kmToService < 1500 ? 'lamp--critical' : 'lamp--caution'}`}
            >
              service due in {formatNum(health.kmToService)} km
            </span>
          ) : null}
        </>
      ) : (
        <EmptyState
          title="No live readings"
          hint="Fuel, DEF and odometer readings appear here when the FleetEdge live-status pull covers this vehicle."
        />
      )}
    </Panel>
  </PanelErrorBoundary>
);

/** Fleet master + FleetEdge directory identity fields. */
export const IdentityPanel = ({ fleetMaster, fleetEdge }) => (
  <PanelErrorBoundary name="vehicle-identity">
    <Panel eyebrow="Identity">
      {fleetMaster || fleetEdge ? (
        <div>
          <KV k="Model" v={fleetEdge?.vehicleModel || fleetMaster?.model} />
          <KV k="Manufacturer" v={fleetEdge?.manufacturer || fleetMaster?.manufacturer} />
          <KV k="Category" v={fleetMaster?.vehicleCategory || fleetEdge?.vehicleType} />
          <KV k="Fuel" v={fleetEdge?.fuelType} />
          <KV k="Emission norm" v={fleetEdge?.emissionNorm} />
          <KV k="Line of business" v={fleetEdge?.lobName} />
          <KV k="VIN" v={fleetEdge?.vin || fleetMaster?.chassisNumber} />
          {!fleetMaster ? (
            <p className="text-dim mt-2 text-[11px]">
              Not in the fleet master — add it to unlock trips, mileage and document tracking.
            </p>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No identity data"
          hint="Neither the fleet master nor FleetEdge knows this registration."
        />
      )}
    </Panel>
  </PanelErrorBoundary>
);

/** Live GPS position. */
export const PositionPanel = ({ livePosition }) => (
  <PanelErrorBoundary name="vehicle-position">
    <Panel
      eyebrow="Position"
      right={
        livePosition?.latitude != null ? (
          <PlaceLabel lat={livePosition.latitude} lng={livePosition.longitude} />
        ) : null
      }
    >
      {livePosition ? (
        <div>
          <KV k="State" v={livePosition.state} />
          <KV
            k="Speed"
            v={livePosition.speed != null ? `${formatNum(livePosition.speed)} km/h` : '—'}
          />
          <KV
            k="Last event"
            v={
              livePosition.eventDateTime
                ? `${formatDateTimeIST(livePosition.eventDateTime)} (${timeAgo(livePosition.eventDateTime)})`
                : '—'
            }
          />
        </div>
      ) : (
        <EmptyState
          title="No live position"
          hint="Positions appear once live tracking polls this vehicle. Open Live Tracking for the fleet map."
          action={
            <Link
              to="/live-tracking"
              className="text-xs font-semibold"
              style={{ color: 'var(--gnb-400)' }}
            >
              Open Live Tracking →
            </Link>
          }
        />
      )}
    </Panel>
  </PanelErrorBoundary>
);

/** Claimed-vs-consumed DEF ledger row. */
export const DefLedgerPanel = ({ defBalance }) => (
  <PanelErrorBoundary name="vehicle-def">
    <Panel
      eyebrow="DEF ledger"
      right={<Droplets size={13} style={{ color: 'var(--cluster-text-dim)' }} />}
    >
      {hasDefLedgerData(defBalance) ? (
        <div>
          <KV
            k="Claimed (bills)"
            v={<DataValue value={defBalance.claimedAdblueL} unit="litres" />}
          />
          <KV
            k="Consumed (telemetry)"
            v={<DataValue value={defBalance.telemetryDefL} unit="litres" />}
          />
          <KV
            k="Expected balance"
            v={<DataValue value={defBalance.expectedBalanceL} unit="litres" />}
          />
          <KV k="Flags" v={<DataValue value={defBalance.flagCount} unit="flags" />} />
          {defBalance.flagCount > 0 ? (
            <Link
              to="/def-ledger"
              className="mt-2 inline-block text-[11px] font-semibold"
              style={{ color: 'var(--caution)' }}
            >
              Review flags in the DEF ledger →
            </Link>
          ) : null}
        </div>
      ) : (
        <EmptyState
          title="No DEF ledger row"
          hint="Claimed vs consumed DEF appears once bills and CAN data exist."
        />
      )}
    </Panel>
  </PanelErrorBoundary>
);
