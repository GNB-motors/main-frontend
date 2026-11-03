import { Link } from 'react-router-dom';
import ToneBadge from '../../components/redesign/ToneBadge';

/**
 * DigestReportCardTile — one driver or truck inside a story card.
 *
 * The good ones and the ones that need a word are shown the same way, so
 * the owner reads a name and a reason rather than a list of complaints.
 */
export default function DigestReportCardTile({ card, linkTo = null }) {
  if (!card) return null;

  const tone = card.grade === 'FALLING' ? 'act' : card.grade === 'FAIR' ? 'watch' : 'good';
  const body = (
    <>
      <span className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] font-semibold text-[var(--rd-ink)]">{card.name}</span>
        <ToneBadge tone={tone}>{card.grade}</ToneBadge>
      </span>
      {card.headline ? (
        <span className="mt-0.5 block text-[12px] text-[var(--rd-ink-2)]">{card.headline}</span>
      ) : null}
    </>
  );

  if (linkTo) {
    return (
      <Link
        to={linkTo}
        className="flex flex-col rounded-[var(--rd-radius-xs)] px-1 py-1 no-underline transition-colors hover:bg-[var(--rd-card-2)]"
      >
        {body}
      </Link>
    );
  }

  return <div className="flex flex-col px-1 py-1">{body}</div>;
}
