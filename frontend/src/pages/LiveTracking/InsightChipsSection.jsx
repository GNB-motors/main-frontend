import { Gauge } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionCard from '../../components/redesign/SectionCard';
import InsightChip from '../../components/redesign/InsightChip';
import { intelligenceLink } from '../../utils/redesign/links';

/**
 * InsightChipsSection — how the truck and the driver are doing.
 *
 * The good chips come first: an owner should see what is working before
 * what is not. Every chip says why, and every chip links to the exact
 * moments behind the claim.
 */
export default function InsightChipsSection({ chips = [], registrationNumber = null }) {
  return (
    <SectionCard icon={Gauge} tone="info" title="How it's driving (7 days)">
      {chips.length === 0 ? (
        <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
          Not enough driving in the last 7 days to judge.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <InsightChip key={chip.key} chip={chip} />
            ))}
          </div>
          <Link
            to={intelligenceLink({ tab: 'vehicles', vehicle: registrationNumber })}
            className="mt-2 inline-block text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
          >
            See full report →
          </Link>
        </>
      )}
    </SectionCard>
  );
}
