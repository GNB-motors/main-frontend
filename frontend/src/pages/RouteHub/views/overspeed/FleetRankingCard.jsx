import Ico from '../../routeHubIcons.jsx';
import { TableEmpty, TableSkeleton } from '../../routeHubShared.jsx';
import { minsOf } from './overspeedHelpers.js';

export default function FleetRankingCard({ rank, openVehicle, loading, thr, dur }) {
  return (
    <div className="card s7 ovs-pane">
      <div className="card-head">
        <h3>Fleet ranking</h3>
        <span className="hint">Select a vehicle to audit its speed trace</span>
      </div>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th className="num">Events</th>
              <th className="num">Longest</th>
              <th className="num">Peak</th>
              <th className="num">Km over limit</th>
              <th aria-label="Open" />
            </tr>
          </thead>
          {rank.length ? (
            <tbody>
              {rank.map((r) => (
                <tr key={r.vehicleId} className="click" onClick={() => openVehicle(r.vehicleId)}>
                  <td>
                    <span className="plate">{r.registrationNumber}</span>
                    <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                      {r.model || '—'}
                    </div>
                  </td>
                  <td
                    className="num mono strong"
                    style={{ color: r.eventCount ? '#C56200' : 'var(--fg-tertiary)' }}
                  >
                    {r.eventCount}
                  </td>
                  <td className="num mono">
                    {r.longestDurationSec ? `${minsOf(r.longestDurationSec)} min` : '—'}
                  </td>
                  <td
                    className="num mono strong"
                    style={{ color: r.peakSpeedKmh ? '#C2323A' : 'var(--fg-tertiary)' }}
                  >
                    {r.peakSpeedKmh ? `${r.peakSpeedKmh} km/h` : '—'}
                  </td>
                  <td className="num mono">
                    {r.distanceKm ? Number(r.distanceKm).toFixed(1) : '—'}
                  </td>
                  <td className="num">
                    <span className="go" style={{ display: 'inline-grid' }}>
                      <Ico n="arrowR" s={14} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          ) : loading ? (
            <TableSkeleton cols={6} />
          ) : (
            <TableEmpty
              colSpan={6}
              title="No sustained overspeed"
              sub={`Nothing stayed above ${thr} km/h for ${dur}+ minutes in this window.`}
            />
          )}
        </table>
      </div>
    </div>
  );
}
