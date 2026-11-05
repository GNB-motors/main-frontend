import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Fuel } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext.jsx';
import { RefuelAdvisoryService } from '../RefuelAdvisory/RefuelAdvisoryService';
import { refuelAdvisoryResponseSchema } from '../../schemas/refuelAdvisory.schema';
import { formatINR, formatKm, formatLitres, formatNum, formatPct } from '../../utils/formatters';
import { MAX_ADVISORY_ROWS, missingReasons, sortAdvisories } from './refuelAdvisoryModel.js';

const MAX_ROWS = MAX_ADVISORY_ROWS;
const STATUS_BADGE = {
  CRITICAL: 'fi-status-badge--critical',
  REFUEL_SOON: 'fi-status-badge--flagged',
  OK: 'fi-status-badge--confirmed',
};

/** The backend's codes, in words a person would use. */
const STATUS_LABEL = {
  CRITICAL: 'Critical',
  REFUEL_SOON: 'Refuel soon',
  OK: 'All good',
};

/**
 * Refuel advisory — the same numbers the full Refuel Advisory page shows,
 * trimmed to the five vehicles an owner acts on first. The API is the role
 * and feature gate; the card hides itself when the org's flag is off.
 */
export default function RefuelAdvisoryCard() {
  const { isEnabled, ready } = useFeatureFlags();
  const enabled = ready ? isEnabled('refuelAdvisory') : false;

  const { data, loading, error } = useApi(
    (signal) =>
      RefuelAdvisoryService.getAdvisories({}, signal).then((body) =>
        refuelAdvisoryResponseSchema.parse(body),
      ),
    [],
    { enabled },
  );

  const rows = useMemo(() => sortAdvisories(data?.advisories).slice(0, MAX_ROWS), [data]);
  const summary = data?.summary || {};

  if (!enabled) return null;

  return (
    <section className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
          <Fuel size={15} className="text-slate-400" />
          Refuel advisory
          <span className="text-[11px] font-normal text-slate-500">
            {formatNum(summary.CRITICAL ?? 0)} critical · {formatNum(summary.REFUEL_SOON ?? 0)} refuel
            soon
          </span>
        </div>
        <Link to="/refuel-advisory" className="fi-action-btn">
          Full advisory
        </Link>
      </header>

      {loading && !data ? (
        <div className="h-20 animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-800/60" />
      ) : error ? (
        <p className="text-xs text-slate-500 m-0">
          Refuel advisory is not available for this account — the sweep is run for owners and
          managers.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-slate-500 m-0">
          No advisory yet — the sweep needs a recent tank reading and efficiency history.
        </p>
      ) : (
        <ul className="list-none p-0 m-0 flex flex-col gap-2">
          {rows.map((a) => {
            const reasons = missingReasons(a);
            const key = a._id || a.vehicleId || a.registrationNumber;
            return (
              <li
                key={key}
                className="border-t border-slate-200 dark:border-slate-800 pt-2 first:border-t-0 first:pt-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {a.registrationNumber || 'Vehicle'}
                  </span>
                  <span
                    className={`fi-status-badge ${
                      STATUS_BADGE[a.status] || 'fi-status-badge--neutral'
                    }`}
                  >
                    {STATUS_LABEL[a.status] || 'Unknown'}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Tank</div>
                    <div className="fi-mono text-slate-800 dark:text-slate-200">
                      {formatPct(a.pctFull)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Range</div>
                    <div className="fi-mono text-slate-800 dark:text-slate-200">
                      {formatKm(a.estimatedRangeKm)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">To fill</div>
                    <div className="fi-mono text-slate-800 dark:text-slate-200">
                      {formatLitres(a.litresToFull)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">Est. fill</div>
                    <div className="fi-mono text-slate-800 dark:text-slate-200">
                      {formatINR(a.estimatedFillCostInr)}
                    </div>
                  </div>
                </div>
                {reasons.length > 0 && (
                  <div className="text-[11px] text-slate-500 mt-1">
                    Not estimated: {reasons.join('; ')}.
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
