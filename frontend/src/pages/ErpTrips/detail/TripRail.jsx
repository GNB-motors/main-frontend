import { placeMapUrl } from '../../ErpDeliveryOrders/doPlaces';
import Facts from './Facts';
import TelematicsPanel from './TelematicsPanel';
import { stamp } from './tripFormat';
import GpsTripPanel from './GpsTripPanel';

const TripRail = ({ data, handleRecomputeTelematics, recomputing }) => (
  <aside className="trip360-rail">
    <section className="trip360-panel">
      <div className="trip360-panel-head">Consignment</div>
      <div className="trip360-panel-body">
        <Facts
          items={[
            { label: 'Client', value: data.partyId?.name },
            { label: 'DO', value: data.doId?.doNumber },
            { label: 'Material', value: data.material },
            {
              label: 'Qty',
              value: `${data.plannedQty ?? '—'} planned${
                data.loadedQty != null ? ` · ${data.loadedQty} loaded` : ''
              }`,
            },
          ]}
        />
      </div>
    </section>

    <section className="trip360-panel">
      <div className="trip360-panel-head">Vehicle &amp; route</div>
      <div className="trip360-panel-body">
        <Facts
          items={[
            { label: 'Vehicle', value: data.vehicleNumber },
            { label: 'Ownership', value: data.vehicleType },
            {
              label: 'Route',
              value: `${data.fromLocation || '—'} → ${data.toLocation || '—'}`,
            },
            data.gpsPickup?.arrivedAt
              ? {
                  label: 'At pickup (GPS)',
                  value: `${stamp(data.gpsPickup.arrivedAt)} → ${data.gpsPickup.leftAt ? stamp(data.gpsPickup.leftAt) : 'still there'}`,
                }
              : null,
            data.gpsDrop?.arrivedAt
              ? {
                  label: 'At drop (GPS)',
                  value: `${stamp(data.gpsDrop.arrivedAt)} → ${data.gpsDrop.leftAt ? stamp(data.gpsDrop.leftAt) : 'still there'}`,
                }
              : null,
            // Exact points from the DO; trips placed before DOs carried them have none.
            ...[
              ['Pickup', data.pickupName, data.pickupSiteId],
              ['Drop', data.dropName, data.dropSiteId],
            ].map(([label, name, site]) =>
              name
                ? {
                    label,
                    value: placeMapUrl(site) ? (
                      <a href={placeMapUrl(site)} target="_blank" rel="noreferrer">
                        {name}
                      </a>
                    ) : (
                      name
                    ),
                  }
                : null,
            ),
            { label: 'Distance', value: data.totalKm ? `${data.totalKm} km` : null },
            data.expectedFreeAt ? { label: 'Free at', value: stamp(data.expectedFreeAt) } : null,
          ]}
        />
      </div>
    </section>

    <GpsTripPanel plan={data.plan} autoTrip={data.autoTrip} error={data.gpsLinkError} />
    <TelematicsPanel
      telematics={data.telematics}
      plannedKm={data.totalKm}
      onRecompute={handleRecomputeTelematics}
      recomputing={recomputing}
    />
  </aside>
);

export default TripRail;
