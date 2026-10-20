import Ico from '../../routeHubIcons.jsx';
import { TableEmpty } from '../../routeHubShared.jsx';
import { fmtT } from '../../routeHubFormat';
import { replayParams } from '../../overspeedReplay';
import { minsOf } from './overspeedHelpers.js';

export default function OverspeedEventsCard({ events, selected, appliedThr, dur, thr, go }) {
  return (
    <div className="card s7 ovs-pane">
      <div className="card-head">
        <h3>Events</h3>
        <span className="count-pill">{events.length}</span>
      </div>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Started</th>
              <th className="num">Duration</th>
              <th className="num">Peak</th>
              <th className="num">Avg</th>
              <th className="num">Distance</th>
              <th aria-label="Replay" />
            </tr>
          </thead>
          {events.length ? (
            <tbody>
              {events.map((e) => (
                <tr key={e.startAt}>
                  <td className="mono">{fmtT(new Date(e.startAt))}</td>
                  <td className="num mono strong">{minsOf(e.durationSec)} min</td>
                  <td className="num mono strong" style={{ color: '#C2323A' }}>
                    {e.maxSpeedKmh} km/h
                  </td>
                  <td className="num mono">{e.avgSpeedKmh} km/h</td>
                  <td className="num mono">
                    {e.distanceKm != null ? `${Number(e.distanceKm).toFixed(1)} km` : '—'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--sm"
                      aria-label={`Replay the overspeed at ${fmtT(new Date(e.startAt))}`}
                      onClick={() => {
                        const { tab, ...extra } = replayParams({
                          vehicleId: selected,
                          event: e,
                          limitKmh: appliedThr,
                          durMin: dur,
                        });
                        go(tab, extra);
                      }}
                    >
                      <Ico n="play" s={13} /> Replay
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
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
