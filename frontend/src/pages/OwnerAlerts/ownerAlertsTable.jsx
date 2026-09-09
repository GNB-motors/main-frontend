import { AlertTriangle, ShieldAlert, Info, CheckCircle2, Check, Loader2 } from 'lucide-react';
import StatusChip from '../../components/ui/StatusChip';
import { StatusPill } from '../Overview/components/overview.primitives.jsx';
import { formatINR } from '../../utils/formatters';
import { cleanMsg } from './ownerAlertsModel';

const SEV_ROWCLASS = {
  CRITICAL: 'oa-row-crit',
  WARNING: 'oa-row-warn',
  INFO: 'oa-row-info',
};

const SEV_ICON = {
  CRITICAL: ShieldAlert,
  WARNING: AlertTriangle,
  INFO: Info,
};

export default function OwnerAlertsTable({
  view,
  isLoading,
  selected,
  selectableIds,
  allSelected,
  toggleAll,
  toggleOne,
  ackingId,
  handleAck,
  onSelectAlert,
}) {
  if (isLoading) {
    return (
      <div className="ov-panel flex flex-col gap-2 p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="ov-inset h-12 animate-pulse" />
        ))}
      </div>
    );
  }

  if (view.length === 0) {
    return (
      <div className="ov-panel flex flex-col items-center justify-center gap-2 py-12 text-center">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--ok) 12%, transparent)',
            color: 'var(--ok)',
          }}
        >
          <CheckCircle2 size={26} />
        </span>
        <p className="text-sm font-semibold" style={{ color: 'var(--cluster-text)' }}>
          You&apos;re all caught up
        </p>
        <p className="text-dim max-w-xs text-xs">
          No alerts currently require your attention with these filters.
        </p>
      </div>
    );
  }

  return (
    <div className="oa-table-wrapper">
      <div className="overflow-x-auto">
        <table className="oa-table">
          <thead>
            <tr>
              <th style={{ width: 44, textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                  disabled={selectableIds.length === 0}
                  className="rounded border-slate-300"
                />
              </th>
              <th>Alert</th>
              <th>Vehicle</th>
              <th>Detected</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {view.map((a) => {
              const Icon = SEV_ICON[a.severity] || AlertTriangle;
              const color =
                a.severity === 'CRITICAL'
                  ? '#e11d48'
                  : a.severity === 'INFO'
                    ? '#2563eb'
                    : '#d97706';
              return (
                <tr
                  key={a.id}
                  className={`fi-row-click ${a.acknowledged ? 'oa-row--acked' : SEV_ROWCLASS[a.severity]}`}
                  onClick={() => onSelectAlert(a)}
                >
                  <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggleOne(a.id)}
                      disabled={a.acknowledged}
                      aria-label={`Select ${a.title}`}
                      className="rounded border-slate-300"
                    />
                  </td>
                  <td>
                    <div className="flex items-start gap-2.5">
                      <Icon size={16} style={{ color, marginTop: 2, flex: '0 0 auto' }} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{a.title}</span>
                          <StatusChip group="severity" value={a.severity} />
                          {a.inrEstimate != null && (
                            <span className="num text-xs font-semibold" style={{ color }}>
                              {formatINR(a.inrEstimate)}
                            </span>
                          )}
                        </div>
                        <div className="oa-clamp text-slate-500 mt-0.5 text-xs">
                          {cleanMsg(a.message)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {a.vehicleNumber ? (
                      <span className="reg-plate font-mono font-bold text-slate-900">
                        {a.vehicleNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs font-medium">Fleet-wide</span>
                    )}
                  </td>
                  <td className="num text-slate-600 text-xs font-medium" title={a.detectedAbs}>
                    {a.detectedRel || '—'}
                  </td>
                  <td>
                    {a.acknowledged ? (
                      <StatusPill tone="ok">Acknowledged</StatusPill>
                    ) : (
                      <StatusPill tone="caution">To review</StatusPill>
                    )}
                  </td>
                  <td className="text-right" onClick={(e) => e.stopPropagation()}>
                    {a.acknowledged ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <Check size={14} /> Done
                      </span>
                    ) : (
                      <button
                        className="oa-ack-action"
                        disabled={ackingId === a.id}
                        onClick={() => handleAck(a.id)}
                      >
                        {ackingId === a.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}{' '}
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
