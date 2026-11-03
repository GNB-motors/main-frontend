import { Link } from 'react-router-dom';
import { Fuel, TrendingDown, TrendingUp } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import SectionCard from '@/components/redesign/SectionCard';
import InfoTip from '@/components/redesign/InfoTip';
import ToneBadge from '@/components/redesign/ToneBadge';
import IntelligenceDataState from './IntelligenceDataState';
import IntelligenceService from './IntelligenceService';
import { formatKm, formatL, formatPct } from '@/utils/redesign/format';

// links.js has no helper for the Mileage page yet, so the path is written once,
// here, instead of being repeated across the app.
const MILEAGE_PATH = '/mileage?tab=mileage';

const DEF_TIP =
  'BS-VI trucks use about 3–6 litres of DEF per 100 litres of diesel. Much lower can mean DEF isn’t being dosed; much higher can mean a leak or wrong reading.';

/**
 * MileageDefTab — the trucks that get the most out of a litre, and the ones
 * that do not, plus the DEF readings that sit outside the normal band.
 *
 * It is a shortcut view of the Mileage page, limited to the period the owner
 * picked, and it ends with a way into the full page.
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

  return (
    <div className="flex flex-col gap-3">
      <IntelligenceDataState
        loading={loading}
        error={error}
        held={held}
        isEmpty={items.length === 0}
        emptyMessage="No fuel readings for this period yet."
        what="The mileage of this period"
        onRetry={refetch}
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <SectionCard icon={TrendingUp} tone="good" title="Best km/L">
            <div className="flex flex-col gap-2">
              {best.map((item) => (
                <div key={item.registrationNumber} className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium text-[var(--rd-ink)]">
                    {item.registrationNumber}
                  </span>
                  <span className="text-[13px] text-[var(--rd-ink-2)] tabular-nums">
                    <span>{formatL(item.kmPerL)}</span>
                    {item.usualKmPerL !== null && item.usualKmPerL !== undefined ? (
                      <span className="ml-1 text-[12px] text-[var(--rd-ink-3)]">
                        {`usual ${formatL(item.usualKmPerL)}`}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
              {!best.length ? (
                <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">No truck had enough fuel data.</p>
              ) : null}
            </div>
          </SectionCard>

          <SectionCard icon={TrendingDown} tone="watch" title="Lowest km/L">
            <div className="flex flex-col gap-2">
              {worst.map((item) => (
                <div key={item.registrationNumber} className="flex items-center justify-between gap-3">
                  <span className="text-[13px] font-medium text-[var(--rd-ink)]">
                    {item.registrationNumber}
                  </span>
                  <span className="text-[13px] text-[var(--rd-ink-2)] tabular-nums">
                    <span>{formatL(item.kmPerL)}</span>
                    {item.usualKmPerL !== null && item.usualKmPerL !== undefined ? (
                      <span className="ml-1 text-[12px] text-[var(--rd-ink-3)]">
                        {`usual ${formatL(item.usualKmPerL)}`}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
              {!worst.length ? (
                <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">No truck had enough fuel data.</p>
              ) : null}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          icon={Fuel}
          tone="info"
          title="DEF use outside the normal band"
          info={{ text: DEF_TIP }}
          className="mt-3"
        >
          <div className="flex flex-col gap-2">
            {defOutliers.map((item) => (
              <div key={item.registrationNumber} className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-medium text-[var(--rd-ink)]">
                  {item.registrationNumber}
                </span>
                <ToneBadge tone="watch">
                  {`${formatPct(item.defPctOfDiesel)} of diesel`}
                </ToneBadge>
                {item.defBand ? (
                  <span className="text-[12px] text-[var(--rd-ink-3)]">
                    {`normal ${formatPct(item.defBand.min)}–${formatPct(item.defBand.max)}`}
                  </span>
                ) : null}
                {item.km ? (
                  <span className="text-[12px] text-[var(--rd-ink-3)]">{`${formatKm(item.km)} km`}</span>
                ) : null}
                {item.verdictWhy?.text ? (
                  <span className="w-full text-[12px] leading-relaxed text-[var(--rd-ink-2)]">
                    {item.verdictWhy.text}
                  </span>
                ) : null}
              </div>
            ))}
            {!defOutliers.length ? (
              <p className="m-0 text-[13px] text-[var(--rd-ink-2)]">
                Every DEF reading of this period was inside the normal band.
              </p>
            ) : null}
          </div>
        </SectionCard>

        <div className="mt-3 flex items-center gap-2">
          <Link
            to={MILEAGE_PATH}
            className="text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
          >
            Open Mileage →
          </Link>
          <InfoTip
            text="The Mileage page has every cycle, every bill and every reconciliation for this truck."
            label="About the Mileage page"
          />
        </div>
      </IntelligenceDataState>
    </div>
  );
}
