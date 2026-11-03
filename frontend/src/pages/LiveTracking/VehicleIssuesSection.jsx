import { TriangleAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import ToneBadge from '../../components/redesign/ToneBadge';
import { intelligenceLink } from '../../utils/redesign/links';

/**
 * VehicleIssuesSection — what is wrong with this truck, right now.
 *
 * Each row says what is happening and what to do about it, and links to
 * the full issue in Intelligence where the evidence is.
 */
export default function VehicleIssuesSection({ issues = [], registrationNumber = null }) {
  if (!issues.length) return null;

  return (
    <section className="flex flex-col gap-1.5">
      {issues.map((issue) => (
        <Link
          key={issue.id}
          to={intelligenceLink({ tab: 'issues', vehicle: registrationNumber })}
          className="flex flex-col gap-1 rounded-[var(--rd-radius)] border border-[var(--rd-line)] bg-[var(--rd-card)] p-3 no-underline transition-colors hover:border-[var(--rd-line-strong)]"
        >
          <span className="flex items-start gap-2">
            <TriangleAlert
              size={15}
              aria-hidden="true"
              className={`mt-0.5 shrink-0 ${
                issue.severity === 'act' ? 'text-[var(--rd-act)]' : 'text-[var(--rd-watch)]'
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-[var(--rd-ink)]">{issue.title}</span>
                <ToneBadge tone={issue.severity} />
              </span>
              <span className="mt-0.5 block text-[12px] text-[var(--rd-ink-2)]">{issue.advice}</span>
            </span>
          </span>
        </Link>
      ))}
    </section>
  );
}
