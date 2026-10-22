import { useEffect, useState } from 'react';
import AttributionService from '../../../services/AttributionService';
import AttributionCard from '../../../components/attribution/AttributionCard';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import CardHead from './overview/CardHead';

/**
 * Vehicle360's attribution card: "vehicle issue or driver issue, on what
 * evidence?"
 *
 * Fetches its own card rather than receiving it, because the card is one call
 * against a window of history and none of the other Vehicle360 providers
 * assemble it. The request is aborted on unmount so switching tabs does not
 * leave a write to a component that is gone.
 *
 * Renders NOTHING when the card has nothing to say (no history, no profile). An
 * empty box titled "Attribution" on every truck would be noise, and the plan's
 * whole complaint is that this fleet has too much noise.
 */
export default function AttributionPanel({ vehicleId }) {
  const [card, setCard] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | silent | failed

  useEffect(() => {
    if (!vehicleId) return undefined;
    const controller = new AbortController();
    let alive = true;
    setState('loading');

    AttributionService.forVehicle(vehicleId, {}, { signal: controller.signal })
      .then((data) => {
        if (!alive) return;
        setCard(data);
        // NO_GAP or an unlearned profile means there is genuinely nothing to
        // show — stay silent rather than rendering an empty shell.
        setState(data && data.status !== 'NO_GAP' && data.status !== 'PROFILE_NOT_LEARNED' ? 'ready' : 'silent');
      })
      .catch((err) => {
        if (!alive || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        setState('failed');
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [vehicleId]);

  if (state === 'loading' || state === 'silent') return null;

  if (state === 'failed') {
    return (
      <PanelErrorBoundary name="vehicle-attribution">
        <section className="v360-card">
          <CardHead title="Vehicle or driver?" />
          <div className="v360-empty">
            <span className="v360-empty-title">Attribution unavailable</span>
            <span className="v360-empty-hint">
              The attribution card could not be loaded. Nothing below is affected — mileage, fuel
              and trips are read from other services.
            </span>
          </div>
        </section>
      </PanelErrorBoundary>
    );
  }

  return (
    <PanelErrorBoundary name="vehicle-attribution">
      <section className="v360-card">
        <CardHead title="Vehicle or driver?" />
        <AttributionCard card={card} />
      </section>
    </PanelErrorBoundary>
  );
}