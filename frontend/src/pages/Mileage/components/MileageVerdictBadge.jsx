import ToneBadge from '../../../components/redesign/ToneBadge';
import InfoTip from '../../../components/redesign/InfoTip';
import { verdictOf } from '../mileageVerdicts';

/**
 * The verdict pill of one truck or one cycle.
 *
 * "Adds up" and "Doesn't add up" are measurements of a fuel number, not a
 * judgement on anybody. The tip behind the pill gives the reason the backend
 * sent, so the owner can question it.
 */
export default function MileageVerdictBadge({ item = null }) {
  const { label, tone } = verdictOf(item);
  const why = item?.verdictWhy ?? null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <ToneBadge tone={tone}>{label}</ToneBadge>
      {why?.text ? <InfoTip text={why.text} basis={why.basis} label={`Why: ${label}`} /> : null}
    </span>
  );
}
