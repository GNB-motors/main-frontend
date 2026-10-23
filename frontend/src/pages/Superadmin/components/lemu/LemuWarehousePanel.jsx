import React from 'react';
import { Database } from 'lucide-react';
import { relativeTime } from './utils';

const LemuWarehousePanel = ({ warehouse, warehouseStatus }) => (
  <div className="lemu-warehouse-panel">
    <div className="lemu-warehouse-panel__head">
      <Database size={16} />
      <h3>Warehouse Freshness</h3>
      {!warehouse?.enabled && (
        <span className="lemu-status-chip lemu-status-chip--off">disabled</span>
      )}
    </div>

    {warehouseStatus === 'loading' && <div className="lemu-meta">Loading warehouse freshness…</div>}

    {warehouseStatus === 'error' && (
      <div className="lemu-alert lemu-alert--error" role="alert">
        Could not load warehouse freshness.
      </div>
    )}

    {warehouseStatus === 'live' && warehouse && (
      <>
        {!warehouse.enabled ? (
          <div className="lemu-alert lemu-alert--info" role="status">
            ClickHouse warehouse mirroring is currently disabled.
          </div>
        ) : (
          <div className="lemu-warehouse-panel__body">
            {warehouse.checkedAt && (
              <div className="lemu-meta lemu-warehouse-panel__checked">
                Checked <strong>{relativeTime(warehouse.checkedAt)}</strong>
              </div>
            )}
            <table className="lemu-table lemu-warehouse-panel__table">
              <thead>
                <tr>
                  <th>Collection</th>
                  <th className="lemu-right">Liveness</th>
                  <th className="lemu-right">Completeness</th>
                  <th className="lemu-right">Correctness</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(warehouse.tables || {}).map(([name, metrics]) => (
                  <tr key={name}>
                    <td className="lemu-mono">{name}</td>
                    <td className="lemu-right">
                      {metrics.liveness != null ? `${metrics.liveness}m` : '—'}
                    </td>
                    <td className="lemu-right">
                      <span
                        className={`lemu-pill ${metrics.completeness ? 'lemu-pill--ok' : 'lemu-pill--stalled'}`}
                      >
                        {metrics.completeness ? 'ok' : 'fail'}
                      </span>
                    </td>
                    <td className="lemu-right">
                      <span
                        className={`lemu-pill ${metrics.correctness ? 'lemu-pill--ok' : 'lemu-pill--stalled'}`}
                      >
                        {metrics.correctness ? 'ok' : 'fail'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.keys(warehouse.tables || {}).length === 0 && (
              <div className="lemu-meta">No mirrored collections reported.</div>
            )}
          </div>
        )}
      </>
    )}
  </div>
);

export default LemuWarehousePanel;
