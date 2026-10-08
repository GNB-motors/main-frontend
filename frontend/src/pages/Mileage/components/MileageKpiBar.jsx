import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Gauge, IndianRupee } from 'lucide-react';
import apiClient from '../../../utils/axiosConfig';
import { formatInrCompact, formatNum, formatPct } from '../../../utils/formatters';
import { kpisFromSources, presetRange, rangeToParams } from '../mileageRows';

const Card = ({ label, icon, valueClass, value, sub }) => (
  <div className="mileage-kpi-card">
    <div className="mileage-kpi-top">
      <span>{label}</span>
      {icon}
    </div>
    <div className={`mileage-kpi-value ${valueClass}`}>{value}</div>
    <div className="mileage-kpi-sub">
      <span>{sub}</span>
    </div>
  </div>
);

/**
 * Org-wide figures for the last 30 days, independent of the tab filters.
 * Reconciliation figures come from the unified feed's meta (diesel only — the
 * tank sensor sees diesel); fleet km/L is the model comparison's
 * distance-weighted total, which needs the vehicleActivity module.
 */
export default function MileageKpiBar({ showFleetMileage }) {
  const [feedMeta, setFeedMeta] = useState(null);
  const [modelData, setModelData] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let isMounted = true;
    const range = rangeToParams(presetRange('30DAYS'));
    Promise.allSettled([
      apiClient.get('/api/fuel-logs/unified', {
        params: { ...range, fuelType: 'DIESEL', limit: 1 },
      }),
      showFleetMileage
        ? apiClient.get('/api/mileage/model-comparison', { params: range })
        : Promise.resolve(null),
    ]).then(([feed, models]) => {
      if (!isMounted) return;
      setFeedMeta(feed.status === 'fulfilled' ? feed.value.data?.meta || null : null);
      setModelData(
        models.status === 'fulfilled' && models.value ? models.value.data?.data || [] : null,
      );
      setState(feed.status === 'rejected' ? 'error' : 'ready');
    });
    return () => {
      isMounted = false;
    };
  }, [showFleetMileage]);

  const k = kpisFromSources({ feedMeta, modelData });
  const pending = state === 'loading' ? '…' : '—';

  return (
    <div className="mileage-kpi-grid">
      {showFleetMileage && (
        <Card
          label="Fleet Avg Mileage"
          icon={<Gauge className="w-4 h-4 text-indigo-500" />}
          valueClass="text-indigo-600 dark:text-indigo-400"
          value={k.fleetKmPerL != null ? `${k.fleetKmPerL.toFixed(2)} km/L` : pending}
          sub={
            k.vehicleCount
              ? `Last 30 days · ${k.vehicleCount} vehicles · distance-weighted`
              : 'No completed cycles in the last 30 days'
          }
        />
      )}

      <Card
        label="Diesel Billed"
        icon={<IndianRupee className="w-4 h-4 text-blue-500" />}
        valueClass="text-blue-600 dark:text-blue-400"
        value={k.spendInr != null ? formatInrCompact(k.spendInr) : pending}
        sub={k.bills != null ? `${formatNum(k.bills)} bills · last 30 days` : 'Last 30 days'}
      />

      <Card
        label="Reconciled Fills"
        icon={<CheckCircle className="w-4 h-4 text-emerald-500" />}
        valueClass="text-emerald-600 dark:text-emerald-400"
        value={k.reconciledPct != null ? formatPct(k.reconciledPct, { decimals: 1 }) : pending}
        sub={
          k.sensorFills != null
            ? `${formatNum(k.matched)} of ${formatNum(k.sensorFills)} tank rises have a bill`
            : 'Tank rises backed by a bill'
        }
      />

      <Card
        label="Flagged Variances"
        icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
        valueClass="text-amber-600 dark:text-amber-400"
        value={k.flagged != null ? formatNum(k.flagged) : pending}
        sub="Bill vs tank mismatch · last 30 days"
      />
    </div>
  );
}
