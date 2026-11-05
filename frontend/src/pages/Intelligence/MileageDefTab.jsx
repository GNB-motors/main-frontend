import Link from '@/components/redesign/FleetLink';
import { useApi } from '@/hooks/useApi';
import ToneBadge from '@/components/redesign/ToneBadge';
import IntelCard from './IntelCard';
import IntelligenceDataState from './IntelligenceDataState';
import IntelligenceService from './IntelligenceService';
import { formatKm, formatPct } from '@/utils/redesign/format';

// links.js has no helper for the Mileage page yet, so the path is written once,
// here, instead of being repeated across the app.
const MILEAGE_PATH = '/mileage?tab=live&subtab=completed';

const DEF_TIP =
  'BS-VI trucks use about 3–6 litres of DEF per 100 litres of diesel. Much lower can mean DEF isn’t being dosed; much higher can mean a leak or wrong reading.';

const kmPerL = (value) =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? '—'
    : `${Number(value).toFixed(1)} km/L`;

function KmplTable({ rows }) {
  if (!rows.length) {
    return <p className="intel-card-empty">No truck had enough fuel data.</p>;
  }
  return (
    <div className="intel-table-wrap intel-table-wrap--flush">
      <table className="intel-table">
        <thead>
          <tr>
            <th scope="col">Truck</th>
            <th scope="col" className="intel-num">
              km/L
            </th>
            <th scope="col" className="intel-num">
              Usual
            </th>
            <th scope="col" className="intel-num">
              Distance
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.registrationNumber}>
              <td className="font-semibold">{item.registrationNumber}</td>
              <td className="intel-num font-semibold">{kmPerL(item.kmPerL)}</td>
              <td className="intel-num intel-when">
                {item.usualKmPerL !== null && item.usualKmPerL !== undefined
                  ? `usual ${kmPerL(item.usualKmPerL)}`
                  : '—'}
              </td>
              <td className="intel-num intel-when">{item.km != null ? formatKm(item.km) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * MileageDefTab — the trucks that get the most out of a litre, and the ones
 * that do not, plus the DEF readings that sit outside the normal band.
 *
 * It is a shortcut view of the Mileage page, limited to the period the owner
 * picked, and it links into the full page.
 */
export default function MileageDefTab({ from, to, vehicle = '' }) {
  const { data, loading, error, refetch } = useApi(
    (signal) => IntelligenceService.getMileage({ from, to, vehicle, signal }),
    [from, to, vehicle],
  );

  const held = data?.held ? data.why : null;
  const items = data?.items ?? [];

  const measured = items.filter((item) => item?.kmPerL !== null && item?.kmPerL !== undefined);
  const best = [...measured].sort((a, b) => b.kmPerL - a.kmPerL).slice(0, 10);
  const worst = [...measured].sort((a, b) => a.kmPerL - b.kmPerL).slice(0, 10);
  const defOutliers = items.filter((item) => {
    const value = item?.defPctOfDiesel;
    if (value === null || value === undefined) return false;
    const band = item?.defBand;
    if (!band) return false;
    return value < band.min || value > band.max;
  });

  const openMileage = (
    <Link to={MILEAGE_PATH} className="intel-link">
      Open Mileage
    </Link>
  );

  return (
    <div className="flex flex-col gap-4">
      <IntelligenceDataState
        loading={loading}
        loadingVariant="cards"
        loadingCount={2}
        error={error}
        held={held}
        isEmpty={items.length === 0}
        emptyMessage="No km/L figures for this period yet. The Mileage page has every fill and cycle."
        what="The mileage of this period"
        onRetry={refetch}
      >
        <div className="intel-two-col">
          <IntelCard title="Best km/L" flush action={openMileage}>
            <KmplTable rows={best} />
          </IntelCard>
          <IntelCard title="Lowest km/L" flush>
            <KmplTable rows={worst} />
          </IntelCard>
        </div>

        <IntelCard
          title="DEF use outside the normal band"
          count={defOutliers.length || null}
          info={{ text: DEF_TIP }}
          flush
          className="mt-4"
        >
          {defOutliers.length ? (
            <div className="intel-table-wrap intel-table-wrap--flush">
              <table className="intel-table">
                <thead>
                  <tr>
                    <th scope="col">Truck</th>
                    <th scope="col">DEF use</th>
                    <th scope="col">Normal band</th>
                    <th scope="col" className="intel-num">
                      Distance
                    </th>
                    <th scope="col">Why it stands out</th>
                  </tr>
                </thead>
                <tbody>
                  {defOutliers.map((item) => (
                    <tr key={item.registrationNumber}>
                      <td className="font-semibold">{item.registrationNumber}</td>
                      <td>
                        <ToneBadge tone="watch">{`${formatPct(item.defPctOfDiesel)} of diesel`}</ToneBadge>
                      </td>
                      <td className="intel-when">
                        {item.defBand
                          ? `normal ${formatPct(item.defBand.min)}–${formatPct(item.defBand.max)}`
                          : '—'}
                      </td>
                    <td className="intel-num intel-when">{item.km != null ? formatKm(item.km) : '—'}</td>
                      <td>
                        <span className="intel-cell-wrap">{item.verdictWhy?.text ?? '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="intel-card-empty">
              Every DEF reading of this period was inside the normal band.
            </p>
          )}
        </IntelCard>
      </IntelligenceDataState>
      {!loading && !error && !held && items.length === 0 ? (
        <div className="self-center">{openMileage}</div>
      ) : null}
    </div>
  );
}
