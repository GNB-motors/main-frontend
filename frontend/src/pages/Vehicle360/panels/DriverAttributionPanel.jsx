import { useEffect, useState } from 'react';
import AttributionService from '../../../services/AttributionService';
import AttributionCard from '../../../components/attribution/AttributionCard';
import PanelErrorBoundary from '../../../components/cluster/PanelErrorBoundary';
import CardHead from './overview/CardHead';

/**
 * The attribution card for a DRIVER — "is this the driver, across the trucks
 * they have driven?" — the mirror of the vehicle card.
 *
 * Mounted today on Vehicle360's DriverCard, which is the only per-driver
 * surface this build has. When a standalone driver-profile page lands, this
 * component drops in unchanged; it already fetches by driver id and nothing else
 * is vehicle-specific.
 *
 * Silent when there is nothing to say: no profile learned, or no gap. An empty
 * card on every driver is exactly the noise plan item 26 is about.
 */
export default function DriverAttributionPanel({ driverId, compact = false }) {
  const [card, setCard] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | silent | failed

  useEffect(() => {
    if (!driverId) return undefined;
    const controller = new AbortController();
    let alive = true;
    setState('loading');

    AttributionService.forDriver(driverId, {}, { signal: controller.signal })
      .then((data) => {
        if (!alive) return;
        setCard(data);
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
  }, [driverId]);

  if (state === 'loading' || state === 'silent') return null;

  if (state === 'failed') {
    if (compact) return null;
    return (
      <PanelErrorBoundary name="driver-attribution">
        <section className="v360-card">
          <CardHead title="Driver or truck?" />
          <div className="v360-empty">
            <span className="v360-empty-title">Attribution unavailable</span>
            <span className="v360-empty-hint">
              This driver&rsquo;s card could not be loaded. Nothing else on the page is affected.
            </span>
          </div>
        </section>
      </PanelErrorBoundary>
    );
  }

  return (
    <PanelErrorBoundary name="driver-attribution">
      <section className="v360-card">
        <CardHead title="Driver or truck?" />
        <AttributionCard card={card} />
      </section>
    </PanelErrorBoundary>
  );
}