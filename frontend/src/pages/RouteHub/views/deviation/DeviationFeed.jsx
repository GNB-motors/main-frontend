import Ico from '../../routeHubIcons.jsx';
import { TableEmpty, TableSkeleton } from '../../routeHubShared.jsx';
import { ago, fmtDT, inr } from '../../routeHubFormat';
import { isCircuitousDetour, isOpen } from './deviationRules.js';

export default function DeviationFeed({ rows, selId, setSelId, first, error, toggleReview }) {
  return (
    <div className="card">
      <div className="card-head">
        <span style={{ color: 'var(--nova-rage-600)', display: 'flex' }}>
          <Ico n="split" />
        </span>
        <h3>Corridor deviation feed</h3>
        <span className="count-pill">{rows.length} shown</span>
        <span className="sp" />
        <span className="hint">Select a row to see it on the map</span>
      </div>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Trip ID</th>
              <th>Detected at</th>
              <th className="num">Max off corridor</th>
              <th className="num">Extra km (est.)</th>
              <th className="num">Est. cost</th>
              <th>Status</th>
              <th className="num">Action</th>
            </tr>
          </thead>
          {rows.length ? (
            <tbody>
              {rows.map((d) => {
                const at = d.detectedAt ? new Date(d.detectedAt) : null;
                const hours = at ? (Date.now() - at.getTime()) / 3600000 : 0;
                return (
                  <tr
                    key={d._id}
                    className={`click ${d._id === selId ? 'sel' : ''}`}
                    onClick={() => setSelId(d._id)}
                  >
                    <td>
                      <span className="plate">{d.registrationNumber}</span>
                    </td>
                    <td>
                      <span className="plate">
                        {String(d.tripId || '')
                          .slice(-6)
                          .padStart(7, '…')}
                      </span>
                    </td>
                    <td>
                      <span className="mono strong">{at ? fmtDT(at) : '—'}</span>
                      <div className="muted" style={{ fontSize: 11 }}>
                        {at ? ago(hours) : ''}
                      </div>
                    </td>
                    <td className="num mono strong">{Number(d.maxOffKm || 0).toFixed(2)} km</td>
                    <td className="num mono">
                      +{d.extraKmEstimate ?? '—'} km
                      {isCircuitousDetour(d) && (
                        <div style={{ marginTop: 2 }}>
                          <span
                            className="pill"
                            style={{
                              '--c': '#9333ea',
                              '--tint': 'rgba(147, 51, 234, 0.14)',
                              fontSize: 10,
                              padding: '1px 6px',
                            }}
                            title="Circuitous Detour: vehicle took an unauthorized loop adding significant km"
                          >
                            ⚡ Detour
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="num strong" style={{ color: '#C2323A' }}>
                      {inr(d.estimatedExtraCostInr || 0)}
                    </td>
                    <td>
                      {isOpen(d) ? (
                        <span
                          className="pill"
                          style={{ '--c': '#C56200', '--tint': 'rgba(240,170,72,.16)' }}
                        >
                          <Ico n="alert" s={11} />
                          Please review
                        </span>
                      ) : (
                        <span
                          className="pill"
                          style={{ '--c': '#187A32', '--tint': 'rgba(37,186,76,.12)' }}
                        >
                          <Ico n="check" s={11} />
                          Reviewed
                        </span>
                      )}
                    </td>
                    <td className="num">
                      <button
                        type="button"
                        className="btn btn--sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReview(d);
                        }}
                      >
                        {isOpen(d) ? (
                          <>
                            <Ico n="eye" s={14} />
                            Mark reviewed
                          </>
                        ) : (
                          'Reviewed'
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ) : first ? (
            <TableSkeleton cols={8} />
          ) : (
            <TableEmpty
              colSpan={8}
              title={error ? 'Feed unavailable' : 'No deviations match'}
              sub={error || 'Change the filters or date range.'}
              tone={error ? '#C56200' : '#187A32'}
              icon={error ? 'alert' : 'check'}
            />
          )}
        </table>
      </div>
    </div>
  );
}
