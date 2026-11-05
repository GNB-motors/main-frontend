import { Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import SectionCard from '../../components/redesign/SectionCard';
import ToneBadge from '../../components/redesign/ToneBadge';
import InfoTip from '../../components/redesign/InfoTip';
import { formatIst } from '../../utils/redesign/format';

/**
 * VehicleDriverSection — who is driving this truck.
 *
 * When the driver was worked out rather than written down, the badge says
 * so. An owner must never be told a name as a fact when it is a guess.
 */
export default function VehicleDriverSection({ driver = null }) {
  return (
    <SectionCard icon={null} tone="info" title="Driver">
      {!driver ? (
        <>
          <p className="m-0 text-[13px] text-[var(--rd-ink-3)]">
            No driver on record for this truck.
          </p>
          <Link
            to="/drivers"
            className="mt-1 inline-block text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
          >
            Add driver →
          </Link>
        </>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold text-[var(--rd-ink)]">{String(driver.name || '').replace(/\s+N\/?A$/i, '').trim() || 'Name not known'}</span>
            {driver.source === 'INFERRED' ? (
              <>
                <ToneBadge tone="watch">Inferred</ToneBadge>
                <InfoTip
                  text="We did not have a driver list for this period. This truck had the same driver at the start and the end of it, so we assume the same driver drove it in between."
                  basis={null}
                />
              </>
            ) : null}
            {driver.phone ? (
              <a
                href={`tel:${driver.phone}`}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--rd-brand-2)] underline-offset-4 hover:underline"
              >
                <Phone size={13} aria-hidden="true" />
                {driver.phone}
              </a>
            ) : null}
          </div>
          <p className="m-0 text-[12px] text-[var(--rd-ink-3)]">
            {driver.since ? `Assigned since ${formatIst(driver.since)}` : 'Assignment date not known'}
            {driver.source === 'MANUAL' ? ' · from your driver list' : ''}
          </p>
        </div>
      )}
    </SectionCard>
  );
}
