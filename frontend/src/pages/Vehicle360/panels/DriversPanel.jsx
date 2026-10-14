import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import { formatDateIST } from '../../../utils/dateUtils';
import useApi from '../../../hooks/useApi';
import DriverVehicleAssignmentService from '../../../services/DriverVehicleAssignmentService';
import Empty from './Empty';

/**
 * Driver ↔ vehicle assignment history — reuses the assignment ledger's own
 * list endpoint (`DriverVehicleAssignmentService`), the same one the
 * Employee page and Khata Ledger's Assignments tab already call. Not fetched
 * as part of the vehicle profile aggregate, so this tab fetches it on its own
 * only when the tab is actually opened.
 */
export default function DriversPanel({ vehicleId, assignedDriver }) {
  const { data, loading, error } = useApi(
    (signal) =>
      DriverVehicleAssignmentService.getAssignments({ vehicleId, includePast: true }, { signal }),
    [vehicleId],
    { enabled: Boolean(vehicleId) },
  );
  const rows = Array.isArray(data) ? data : data?.results || data?.items || [];

  return (
    <PanelErrorBoundary name="vehicle-drivers">
      <div className="v360-panel v360-panel--single">
        <section className="v360-card">
          <div className="v360-card-head">
            <p className="v360-card-title">Drivers</p>
          </div>
          {!vehicleId ? (
            <Empty
              title="No fleet-master record"
              hint="This registration isn't in the fleet master, so assignments can't be resolved."
            />
          ) : loading && !data ? (
            <Empty title="Loading assignment history…" />
          ) : error ? (
            <Empty
              title="Could not load assignments"
              hint="This vehicle may not have driver assignments enabled for this organization."
            />
          ) : rows.length === 0 ? (
            <Empty
              title="No assignments on record"
              hint="Nobody has been assigned to this vehicle yet."
            />
          ) : (
            <table className="v360-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Phone</th>
                  <th className="is-num">Start</th>
                  <th className="is-num">End</th>
                  <th className="is-num">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const driverName = [a.driverId?.firstName, a.driverId?.lastName]
                    .filter(Boolean)
                    .join(' ');
                  const isCurrent =
                    assignedDriver &&
                    String(a.driverId?._id || a.driverId) === String(assignedDriver.id);
                  return (
                    <tr key={a._id}>
                      <td>
                        {driverName || '—'}
                        {isCurrent ? ' (current)' : ''}
                      </td>
                      <td>{a.driverId?.mobileNumber || '—'}</td>
                      <td className="is-num">{a.startDate ? formatDateIST(a.startDate) : '—'}</td>
                      <td className="is-num">{a.endDate ? formatDateIST(a.endDate) : 'ongoing'}</td>
                      <td className="is-num">{a.status || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </PanelErrorBoundary>
  );
}
