import { CheckCircle2, Clock } from 'lucide-react';
import { fmtDate } from './receiptFormat';
import {
  predictedEvidenceLines,
  predictedTimeText,
  matchedRiseText,
} from './predictedTime';

/**
 * The predicted time of a fill, and how we know it.
 *
 * A predicted time is a suggestion for a person, never a read time.
 */
const PredictedFill = ({ draft }) => {
  const predicted = draft?.time?.predicted || null;
  const person = draft?.time?.person || null;
  const text = predictedTimeText(predicted);
  const evidenceLines = predictedEvidenceLines(predicted?.evidence);
  if (!text && evidenceLines.length === 0 && !person?.at) return null;

  return (
    <div className="ra-prop ra-prop--full ra-prop--predicted">
      <span className="ra-prop__label">Suggested time</span>
      {text && (
        <span className="ra-prop__val ra-prop__val--predicted">
          <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
          {text}
        </span>
      )}
      {predicted && <span className="ra-prop__val">{matchedRiseText(predicted)}</span>}
      {evidenceLines.length > 0 && (
        <ul className="ra-predicted__evidence">
          {evidenceLines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      {person?.at && (
        <span className="ra-prop__val">
          <CheckCircle2 size={13} style={{ display: 'inline', marginRight: 4 }} />
          Time set by a person: {fmtDate(person.at)}
        </span>
      )}
    </div>
  );
};

export default PredictedFill;
