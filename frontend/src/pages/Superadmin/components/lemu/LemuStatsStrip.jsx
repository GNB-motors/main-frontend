import React from 'react';
import { Activity, AlertTriangle, ScrollText, Users } from 'lucide-react';

/* Stats strip — 24h rollup cards driven by /api/lemu/dashboard. */
const LemuStatsStrip = ({ dashboard, loading, error }) => {
  const stats = [
    { label: 'Events (24h)', value: dashboard?.last24h?.total, icon: <ScrollText size={18} />, tone: 'brand' },
    { label: 'Errors (24h)', value: dashboard?.last24h?.errors, icon: <AlertTriangle size={18} />, tone: 'warn' },
    { label: 'Fatals (24h)', value: dashboard?.last24h?.fatals, icon: <AlertTriangle size={18} />, tone: 'danger' },
    { label: 'Unresolved Errors', value: dashboard?.unresolvedErrors, icon: <Activity size={18} />, tone: 'danger' },
    { label: 'Affected Users Today', value: dashboard?.affectedUsersToday, icon: <Users size={18} />, tone: 'neutral' },
  ];

  return (
    <>
      {error && (
        <div className="lemu-alert lemu-alert--error" role="alert">{error}</div>
      )}
      <div className="lemu-stats">
        {stats.map((s) => (
          <div className="lemu-stat" key={s.label}>
            <span className={`lemu-stat__icon lemu-stat__icon--${s.tone}`}>{s.icon}</span>
            <div className="lemu-stat__body">
              <span className="lemu-stat__value">
                {loading ? '…' : (s.value ?? '—')}
              </span>
              <span className="lemu-stat__label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default LemuStatsStrip;
