import useApi from '../../../hooks/useApi';
import { formatDateTimeIST } from '../../../utils/dateUtils';
import { ReportsService } from '../ReportsService.js';
import { fmtKm, formatNumber } from './tripReportsUtils';
import { StatusChip } from './tripReportCells';
import { TRIP_SOURCE_LABEL, notInTripsAlert, tripNotes, tripRoute } from './cycleTrips';
import CycleSlipsTable from './CycleSlipsTable';

const odoRange = (t) =>
  t.odoStart != null || t.odoEnd != null
    ? `${formatNumber(t.odoStart)} → ${formatNumber(t.odoEnd)}`
    : '—';

/** The drop-down under one Fuel Cycles row: every trip the truck ran between the two fills. */
export default function CycleTripsPanel({ cycleId }) {
  const { data, loading, error, refetch } = useApi(
    (signal) => ReportsService.getFuelCycleTrips(cycleId, signal),
    [cycleId],
  );

  if (loading && !data)
    return <div className="rpt-cycle-trips rpt-cycle-trips--note">Loading trips…</div>;
  if (error) {
    return (
      <div className="rpt-cycle-trips rpt-cycle-trips--note" role="alert">
        Could not load the trips for this cycle.{' '}
        <button type="button" className="rpt-btn" onClick={refetch}>
          Try again
        </button>
      </div>
    );
  }

  const summary = data?.summary;
  const trips = data?.trips || [];
  const alert = notInTripsAlert(summary);

  return (
    <div className="rpt-cycle-trips">
      <CycleSlipsTable
        slips={data?.slips || []}
        cycle={{ live: true, intervalId: data?.cycle?.intervalId }}
      />
      <div className="rpt-cycle-trips-summary rpt-cycle-trips-summary--trips">
        <span>
          Cycle <strong>{fmtKm(summary?.cycleKm)}</strong>
          {summary?.cycleKmBasis === 'GPS' ? ' (GPS — slip odometer missing)' : ''}
        </span>
        <span>
          Laden in trips <strong>{fmtKm(summary?.ladenKm)}</strong>
        </span>
        <span title="Empty running to the plant and back from the drop, detours, yard moves">
          Not in trips <strong>{fmtKm(summary?.otherKm)}</strong>
        </span>
        {alert ? (
          <span className={`rpt-cycle-trips-alert rpt-cycle-trips-alert--${alert.tone}`}>
            {alert.label}
          </span>
        ) : null}
      </div>

      {trips.length === 0 ? (
        <div className="rpt-cycle-trips--note">No trips between these two fills.</div>
      ) : (
        <table className="rpt-cycle-trips-table">
          <thead>
            <tr>
              <th>Trip</th>
              <th>Route</th>
              <th>Start</th>
              <th>End</th>
              <th className="num">Odometer</th>
              <th className="num">Laden</th>
              <th className="num">In this cycle</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((t) => (
              <tr key={`${t.kind}-${t.id}`}>
                <td>
                  <div className="cell-primary">{t.erpTripNumber || TRIP_SOURCE_LABEL[t.kind]}</div>
                  {t.erpTripNumber ? (
                    <div className="rpt-cycle-trips-sub">{TRIP_SOURCE_LABEL[t.kind]}</div>
                  ) : null}
                </td>
                <td>{tripRoute(t)}</td>
                <td>{t.startAt ? formatDateTimeIST(t.startAt) : '—'}</td>
                <td>{t.endAt ? formatDateTimeIST(t.endAt) : 'still running'}</td>
                <td className="num">{odoRange(t)}</td>
                <td className="num">{fmtKm(t.km?.laden)}</td>
                <td className="num">{t.kind === 'AUTO' ? fmtKm(t.inCycleKm) : '—'}</td>
                <td>
                  <StatusChip value={t.status} />
                </td>
                <td className="rpt-cycle-trips-notes">{tripNotes(t).join(' · ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
