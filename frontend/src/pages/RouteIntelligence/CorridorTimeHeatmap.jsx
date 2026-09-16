import useApi from '../../hooks/useApi';
import RouteIntelligenceService from './RouteIntelligenceService';
import EmptyState from '../../components/cluster/EmptyState';
import { Skeleton } from '../../components/ui/skeleton';
import {
  indexBuckets,
  colorForValue,
  opacityForSamples,
  p50Range,
  SEQUENTIAL_RAMP,
  NO_DATA_COLOR,
  DOW_LABELS,
} from './corridorTimeHeatmap.utils.js';

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const AXIS_HOURS = new Set([0, 6, 12, 18]);

/**
 * Travel-time-by-hour×day-of-week grid for one corridor. Color is this
 * corridor's OWN light->slow range (see corridorTimeHeatmap.utils.colorForValue)
 * so a 20-min corridor and a 6-hour corridor are each legible on their own
 * terms. Cell opacity fades a bucket backed by only 1-2 traversals — hours
 * and days are UTC, matching RouteCorridor's existing hour-only buckets.
 */
export default function CorridorTimeHeatmap({ corridorId }) {
  const { data, loading, error } = useApi(
    (signal) => RouteIntelligenceService.corridorTimeProfile(corridorId, { signal }),
    [corridorId],
    { enabled: Boolean(corridorId) },
  );

  if (loading) return <Skeleton className="h-40 w-full max-w-2xl" />;
  if (error) {
    return (
      <p className="text-xs" style={{ color: 'var(--cluster-text-dim)' }}>
        Hourly pattern unavailable — the corridor-time feed did not respond.
      </p>
    );
  }

  const buckets = data?.buckets || [];
  if (buckets.length === 0) {
    return (
      <EmptyState
        title="Not enough traversals yet"
        hint="This grid fills in as more trips are driven on this corridor at different times of day."
        className="py-4"
      />
    );
  }

  const byKey = indexBuckets(buckets);
  const { min, max } = p50Range(buckets);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th aria-hidden="true" />
              {HOURS.map((h) => (
                <th
                  key={h}
                  className="text-dim text-center text-[10px] font-normal"
                  style={{ width: 14 }}
                >
                  {AXIS_HOURS.has(h) ? h : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DOW_LABELS.map((label, dow) => (
              <tr key={label}>
                <th className="text-dim pr-2 text-right text-[10px] font-normal">{label}</th>
                {HOURS.map((hour) => {
                  const bucket = byKey.get(`${hour}_${dow}`);
                  const color = colorForValue(bucket?.p50Min ?? null, min, max);
                  const opacity = opacityForSamples(bucket?.samples);
                  const title = bucket
                    ? `${label} ${hour}:00 UTC — p50 ${bucket.p50Min} min, p90 ${bucket.p90Min} min (${bucket.samples} sample${bucket.samples === 1 ? '' : 's'})`
                    : `${label} ${hour}:00 UTC — no traversals observed`;
                  return (
                    <td key={hour} title={title} aria-label={title}>
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 3,
                          background: color,
                          opacity,
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-dim text-[11px]">Faster</span>
        <div
          className="h-2 w-24 rounded-full"
          style={{
            background: `linear-gradient(to right, ${SEQUENTIAL_RAMP.join(', ')})`,
          }}
        />
        <span className="text-dim text-[11px]">Slower</span>
        <span
          className="mx-2 inline-block h-2.5 w-2.5 rounded-sm"
          style={{ background: NO_DATA_COLOR }}
        />
        <span className="text-dim text-[11px]">No data</span>
        <span className="text-dim ml-auto text-[11px]">
          Hours are UTC · faded cells = fewer samples
        </span>
      </div>
    </div>
  );
}
