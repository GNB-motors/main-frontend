import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { pairSummary } from './billPairModel';
import { BillThumbnail } from './BillRow';

/**
 * The odometer photo of a bill, and what the server thinks of the pair.
 * The person reads it and can refuse it: "Not this one".
 */
export default function BillPairCell({ pair, file, onUnpair }) {
  const [busy, setBusy] = useState(false);
  if (!pair) return null;
  const lines = pairSummary(pair);
  const reasons = Array.isArray(pair.reasons) ? pair.reasons.filter(Boolean) : [];
  const refuse = async () => {
    if (busy || !onUnpair) return;
    setBusy(true);
    try {
      await onUnpair();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="bp-pair">
      <div className="bp-pair__thumb">
        <BillThumbnail
          capture={{ id: pair.odometerCaptureId, thumbnailUrl: pair.odometerThumbnailUrl }}
          file={file}
          alt="Odometer photo"
        />
      </div>
      <div className="bp-pair__body">
        {lines.map((line) => (
          <p className="bp-pair__line" key={line}>
            {line}
          </p>
        ))}
        {reasons.length > 0 && (
          <ul className="bp-pair__reasons">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        )}
        {pair.decision === 'ASK' && (
          <p className="bp-pair__ask">Check: is this the right odometer photo?</p>
        )}
        {onUnpair && (
          <Button size="sm" variant="outline" onClick={refuse} disabled={busy}>
            Not this one
          </Button>
        )}
      </div>
    </div>
  );
}
