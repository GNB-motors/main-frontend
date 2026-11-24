import { useState } from 'react';
import { namedPrediction, useTripPrediction } from './tripPrediction';

export default function OpenTripPrediction({ reg, onPrediction }) {
  const [open, setOpen] = useState(false);
  const result = useTripPrediction(reg, open);
  const candidate = namedPrediction(result.data);
  if (open && candidate) return onPrediction(candidate);
  return open ? (
    <span className="atx-cell-quiet">
      {result.loading ? (
        'Checking destination…'
      ) : result.error ? (
        <button
          type="button"
          className="atx-inline-link"
          onClick={(e) => {
            e.stopPropagation();
            result.refetch();
          }}
        >
          Retry destination
        </button>
      ) : (
        'Destination unknown'
      )}
    </span>
  ) : (
    <button
      type="button"
      className="atx-inline-link"
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
    >
      Check destination
    </button>
  );
}
