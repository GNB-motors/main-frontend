import { Gauge, Fuel, MapPin } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { formatLitres, formatNum } from '../../utils/formatters';
import { FuelIntegrityService } from './FuelIntegrityService.jsx';
import { Panel } from '../Overview/components/overview.primitives.jsx';

/**
 * Refuel Advisory (#16) for the filtered vehicle. Estimated range is DERIVED
 * from tank level × recent economy (the vendor distanceToEmpty is empty).
 * Recommends the most honest pumps from the short-delivery ledger.
 */
export default function RefuelAdvisoryPanel({ vehicle }) {
  const enabled = !!vehicle;
  const { data, loading, error } = useApi(
    (signal) => FuelIntegrityService.getRefuelAdvisory({ vehicle }, { signal }),
    [vehicle],
    { enabled },
  );

  return (
    <Panel
      className="min-w-0"
      eyebrow="Refuel advisory"
      question={enabled ? `When should ${vehicle} refuel?` : 'When should this vehicle refuel?'}
    >
      {!enabled && (
        <div className="text-dim py-6 text-center text-xs">
          Filter by a vehicle registration to see its refuel advisory.
        </div>
      )}

      {enabled && error && (
        <div className="text-dim py-4 text-center text-xs">Could not load the refuel advisory.</div>
      )}

      {enabled && loading && !data && (
        <div className="text-dim py-6 text-center text-xs">Loading advisory…</div>
      )}

      {enabled && data && !error && (
        <>
          {!data.hasFuelData ? (
            <div className="text-dim flex flex-col items-center gap-2 py-6 text-center text-xs">
              <Fuel size={18} className="opacity-60" />
              <span>No recent tank-level telemetry for {vehicle}.</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="ov-inset flex flex-col items-center gap-0.5 py-3">
                  <span className="num text-xl font-bold">{formatLitres(data.currentLevelL)}</span>
                  <span className="text-dim text-[10px] uppercase tracking-wide">In tank</span>
                </div>
                <div className="ov-inset flex flex-col items-center gap-0.5 py-3">
                  <span
                    className="num text-xl font-bold"
                    style={{ color: data.refuelSoon ? 'var(--critical)' : 'var(--cluster-text)' }}
                  >
                    {data.estimatedRangeKm != null ? `${formatNum(data.estimatedRangeKm)}` : '—'}
                  </span>
                  <span className="text-dim text-[10px] uppercase tracking-wide">Range km</span>
                </div>
                <div className="ov-inset flex flex-col items-center gap-0.5 py-3">
                  <span className="num text-xl font-bold">
                    {data.levelPct != null ? `${data.levelPct}%` : '—'}
                  </span>
                  <span className="text-dim text-[10px] uppercase tracking-wide">Level</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs">
                <Gauge size={14} className="opacity-70" />
                <span className="text-dim">
                  {data.kmPerL} km/L ({data.kmPerLSource === 'telematics' ? 'measured' : 'assumed'})
                </span>
                {data.refuelSoon && (
                  <span
                    className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold"
                    style={{
                      background: 'color-mix(in srgb, var(--critical) 14%, transparent)',
                      color: 'var(--critical)',
                    }}
                  >
                    Refuel soon
                  </span>
                )}
              </div>

              {data.recommendedPumps?.length > 0 && (
                <div className="mt-4">
                  <div className="text-dim mb-1 text-[11px] font-semibold uppercase tracking-wide">
                    Most honest pumps
                  </div>
                  {data.recommendedPumps.map((p) => (
                    <div key={p.pump} className="flex items-center gap-2 py-1 text-xs">
                      <MapPin size={12} className="opacity-60" />
                      <span className="font-medium">{p.pump}</span>
                      <span className="text-dim ml-auto">
                        {p.shortfallPct}% short
                        {p.distanceKm != null ? ` · ${p.distanceKm} km` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-dim mt-3 text-[10px]">{data.disclaimer}</p>
            </>
          )}
        </>
      )}
    </Panel>
  );
}
