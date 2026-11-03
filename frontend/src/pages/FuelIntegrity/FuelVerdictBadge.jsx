import ToneBadge from '../../components/redesign/ToneBadge';
import InfoTip from '../../components/redesign/InfoTip';
import { verdictFor } from './fuelVerdicts';

/**
 * The "Check" badge of one fuel window.
 *
 * It says what the check found, in the plain words the redesign fixed:
 * "Explained by driving", "Went down while parked", "Fill doesn't match
 * bill", "Not enough data". The tip behind it says why, so the owner can
 * agree or argue with the number instead of guessing.
 */
export default function FuelVerdictBadge({ fuelWindow = null }) {
  const verdict = verdictFor(fuelWindow);

  return (
    <span className="inline-flex items-center gap-1.5">
      <ToneBadge tone={verdict.tone}>{verdict.label}</ToneBadge>
      <InfoTip text={verdict.text} basis={verdict.basis} label={`Why: ${verdict.label}`} />
    </span>
  );
}
