import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion as Motion } from 'framer-motion';
import { Check, Loader2, Clock } from 'lucide-react';
import { OwnerAlertsService } from '../../OwnerAlerts/OwnerAlertsService';
import { VehicleService } from '../../Profile/VehicleService.js';
import FleetDataService from '../../../services/FleetDataService';
import { SEV } from '../dailyDigestLogic';

// Nova's attention cards only carry 3 tones; CRITICAL and HIGH share the
// red "high" tone (still told apart by the SEV badge text). Colors are
// derived from dailyDigestLogic's SEV (theme CSS vars), not a second
// hardcoded palette, so this card respects theme/dark-mode like the rest
// of the page.
const NOVA_SEV = {
  CRITICAL: {
    c: SEV.CRITICAL.color,
    tint: `color-mix(in srgb, ${SEV.CRITICAL.color} 14%, transparent)`,
  },
  HIGH: { c: SEV.HIGH.color, tint: `color-mix(in srgb, ${SEV.HIGH.color} 14%, transparent)` },
  MEDIUM: { c: SEV.MEDIUM.color, tint: `color-mix(in srgb, ${SEV.MEDIUM.color} 16%, transparent)` },
  LOW: { c: SEV.LOW.color, tint: `color-mix(in srgb, ${SEV.LOW.color} 12%, transparent)` },
};

// ackId alone isn't a safe Set key across item types — ackIds now come from
// three different Mongo collections (UserError, MaintenancePrediction,
// Vehicle.documents), so a real (if astronomically unlikely) collision would
// hide the wrong row.
const resolveKey = (ackType, ackId) => `${ackType || 'ownerAlert'}:${ackId}`;

export default function NdAttentionCard({ actions, onResolved }) {
  const [filter, setFilter] = useState('all');
  // Resolved keys are hidden immediately (optimistic) without waiting for the
  // parent's refetch, so the row doesn't sit there until the next data pass.
  const [resolvedKeys, setResolvedKeys] = useState(() => new Set());
  const [ackingId, setAckingId] = useState(null);
  const visibleActions = actions.filter(
    (a) => !a.ackId || !resolvedKeys.has(resolveKey(a.ackType, a.ackId)),
  );

  const handleResolve = async (action) => {
    const { ackId, ackType, ackVehicleId } = action;
    setAckingId(ackId);
    try {
      if (ackType === 'maintenance') {
        await FleetDataService.acknowledgePrediction(ackId);
      } else if (ackType === 'docExpiry') {
        await VehicleService.acknowledgeVehicleDocument(ackVehicleId, ackId);
      } else {
        await OwnerAlertsService.acknowledgeAlert(ackId);
      }
      setResolvedKeys((prev) => new Set(prev).add(resolveKey(ackType, ackId)));
      onResolved?.(ackType);
    } catch {
      // The service call already logs the failure; leave the row visible.
    } finally {
      setAckingId(null);
    }
  };

  const tabs = [
    { k: 'all', l: 'All', n: visibleActions.length },
    {
      k: 'high',
      l: 'High',
      n: visibleActions.filter((a) => a.sev === 'CRITICAL' || a.sev === 'HIGH').length,
    },
    { k: 'medium', l: 'Medium', n: visibleActions.filter((a) => a.sev === 'MEDIUM').length },
  ];
  const rows =
    filter === 'all'
      ? visibleActions
      : filter === 'high'
        ? visibleActions.filter((a) => a.sev === 'CRITICAL' || a.sev === 'HIGH')
        : visibleActions.filter((a) => a.sev === 'MEDIUM');

  return (
    <div className="nd-card nd-card--attn" id="nd-card-attn">
      <div className="nd-card-head">
        <h2>Needs your attention</h2>
        <span className="nd-count-pill">{rows.length}</span>
        <span className="nd-sp" />
        <div className="nd-ios-tabs" role="tablist" aria-label="Filter attention items">
          {tabs.map((t) => {
            const isSelected = filter === t.k;
            return (
              <button
                key={t.k}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`nd-ios-tab ${isSelected ? 'nd-ios-tab--active' : ''}`}
                onClick={() => setFilter(t.k)}
              >
                {isSelected && (
                  <Motion.span
                    layoutId="ndAttnTabIndicator"
                    className="nd-ios-tab-indicator"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 32,
                    }}
                  />
                )}
                <span className="nd-ios-tab-text">{t.l}</span>
                <span
                  className={`nd-ios-tab-badge ${
                    t.k === 'high' && t.n > 0
                      ? 'nd-ios-tab-badge--high'
                      : isSelected
                        ? 'nd-ios-tab-badge--active'
                        : ''
                  }`}
                >
                  {t.n}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="nd-attn">
        {rows.length === 0 ? (
          <div className="nd-empty">
            <span className="nd-ok">
              <Check size={22} />
            </span>
            <b>You&apos;re all caught up</b>
            <span>No open items in this filter.</span>
          </div>
        ) : (
          rows.map((a) => {
            const s = NOVA_SEV[a.sev] || NOVA_SEV.MEDIUM;
            const Icon = a.icon;
            return (
              <article key={a.id} className="nd-item" style={{ '--c': s.c, '--tint': s.tint }}>
                <span className="nd-item-ico">
                  <Icon size={18} />
                </span>
                <div className="nd-item-body">
                  <div className="nd-item-title">
                    <b>{a.title}</b>
                    <span className="nd-sev">
                      <i />
                      {a.sev === 'CRITICAL' || a.sev === 'HIGH' ? 'high' : a.sev.toLowerCase()}
                    </span>
                  </div>
                  <p className="nd-item-text">{a.desc}</p>
                  {a.meta ? (
                    <div className="nd-item-meta">
                      <span>
                        <Clock size={13} />
                        {a.meta}
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="nd-item-side">
                  {a.amt ? <span className="nd-item-amt">{a.amt}</span> : null}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {a.ackId ? (
                      <button
                        type="button"
                        className="nd-btn nd-btn--sm"
                        disabled={ackingId === a.ackId}
                        onClick={() => handleResolve(a)}
                      >
                        {ackingId === a.ackId ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        Resolve
                      </button>
                    ) : null}
                    <Link to={a.to} className="nd-btn nd-btn--sm">
                      {a.cta || 'Review'}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
