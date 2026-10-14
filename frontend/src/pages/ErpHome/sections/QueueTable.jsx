import React from 'react';
import { RED, AMB, GRN } from '../commandCenterTones';
import { inr, shortDate } from '../commandCenterFormat';
import SortTh from './SortTh';

function QueueTable({
  visible,
  sel,
  allVisibleSelected,
  toggleAllVisible,
  toggleRow,
  stage,
  limitDays,
  sortKey,
  sortDir,
  onSort,
  startRun,
}) {
  return (
    <div className="tblwrap" style={{ overflowX: 'auto' }}>
      <table className="tbl">
        {
          <>
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input
                    type="checkbox"
                    className="cb"
                    aria-label="Select all"
                    checked={allVisibleSelected}
                    onChange={(e) => toggleAllVisible(e.target.checked)}
                  />
                </th>
                <th>{stage.col || 'Trip'}</th>
                <th>Party</th>
                <th className="hide-sm">Vehicle</th>
                <th className="hide-sm">Material</th>
                <SortTh k="ageDays" label="Waiting" {...{ sortKey, sortDir, onSort }} />
                <SortTh k="freight" label="Freight" cls="num" {...{ sortKey, sortDir, onSort }} />
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const ratio = limitDays > 0 ? r.ageDays / limitDays : 0;
                const tone = ratio > 1 ? RED : ratio >= 0.75 ? AMB : GRN;
                return (
                  <tr key={r._id} className={sel.has(r._id) ? 'sel' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        className="cb"
                        aria-label={`Select ${r.ref}`}
                        checked={sel.has(r._id)}
                        onChange={(e) => toggleRow(r._id, e.target.checked)}
                      />
                    </td>
                    <td>
                      <div className="strong mono">{r.ref}</div>
                      <div className="muted">{shortDate(r.date)}</div>
                    </td>
                    <td>{r.partyName || '—'}</td>
                    <td className="hide-sm">
                      <span className="strong">{r.vehicleNumber || '—'}</span>
                    </td>
                    <td className="hide-sm">
                      {r.material || '—'}
                      <div className="muted">
                        {r.qty} {r.qtyUnit}
                      </div>
                    </td>
                    <td>
                      <span className="pill" style={{ '--c': tone.c, '--tint': tone.tint }}>
                        <i />
                        {r.ageDays === 0 ? 'Today' : `${r.ageDays}d`}
                      </span>
                    </td>
                    <td className="num">{r.freight == null ? '—' : inr(r.freight)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button type="button" className="btn btn--sm" onClick={() => startRun([r])}>
                        {stage.verb}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </>
        }
      </table>
    </div>
  );
}

export default QueueTable;
