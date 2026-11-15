import { Store, Truck } from 'lucide-react';
import { confirmedTruckText, officeCandidates, officeRow } from './officeBill';

/**
 * The truck of this bill.
 *
 * A confirmed bill has one truck and one person who linked it: the card says
 * so and there is nothing to suggest. While the bill is still waiting, the
 * server's suggestions and the picker for the plate are both offered.
 */
const OfficeTruckSuggestions = ({
  suggestion,
  capture,
  vehicles,
  plate,
  selectedPlate = '',
  onChoose,
}) => {
  const row = officeRow(capture);
  const confirmed = Boolean(row.confirmed);
  const candidates = officeCandidates(suggestion || capture?.suggestion);
  const market = row.market;

  // The truck is known: there is nothing left to suggest.
  if (confirmed) {
    return (
      <div className="ra-section-card">
        <div className="ra-section-card__title">
          <Truck size={15} /> Confirmed truck
        </div>
        <p className="ra-prop__val">{confirmedTruckText(row)}</p>
      </div>
    );
  }

  return (
    <>
      {/* The trucks the server offers for this photo. */}
      <div className="ra-section-card">
        <div className="ra-section-card__title">
          <Truck size={15} /> Truck suggestions
        </div>
        {candidates.length === 0 ? (
          <p className="ra-caption">We could not suggest a truck for this bill — pick one below.</p>
        ) : (
          candidates.map((candidate) => (
            <div className="ra-prop ra-prop--full" key={candidate.registrationNumber}>
              <button
                type="button"
                className="ra-btn ra-btn--ghost"
                aria-pressed={selectedPlate === candidate.registrationNumber}
                onClick={() => onChoose(candidate.registrationNumber)}
              >
                {candidate.registrationNumber}
                <span
                  className={`ra-chip ${
                    candidate.certainty.kind === 'sure' ? '' : 'ra-chip--warn'
                  }`}
                >
                  {candidate.certainty.text}
                </span>
              </button>
              {candidate.reasons.length > 0 && (
                <ul className="ra-reasons">
                  {candidate.reasons.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>

      {/* The truck this bill belongs to. */}
      <div className="ra-section-card">
        <div className="ra-section-card__title">
          <Truck size={15} /> Truck
        </div>
        {market && (
          <p className="ra-caption">
            <Store size={12} style={{ display: 'inline', marginRight: 4 }} />
            Not one of your trucks (market truck?)
          </p>
        )}
        <label className="ra-prop ra-prop--full">
          <span className="ra-prop__label">Truck</span>
          <input
            id={`office-truck-input-${capture.id}`}
            className="ra-input--plain"
            aria-label="Truck"
            aria-required="true"
            list={`office-truck-${capture.id}`}
            value={plate}
            placeholder="Search all trucks…"
            onChange={(event) => onChoose(event.target.value)}
          />
        </label>
        <datalist id={`office-truck-${capture.id}`}>
          {vehicles.map((vehicle) => (
            /* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a datalist option, not a control on its own */
            <option
              key={vehicle._id || vehicle.id}
              value={vehicle.registrationNumber}
              label={vehicle.registrationNumber}
            />
          ))}
        </datalist>
        <p className="ra-caption">Type the plate when the bill is from a market truck.</p>
      </div>
    </>
  );
};

export default OfficeTruckSuggestions;
