import { useState } from 'react';
import { toast } from 'react-toastify';
import { Hourglass, Truck, CircleCheck } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { useMutation } from '../../hooks/useMutation';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import PlacesMap from './PlacesMap';
import PanelLoading from './PanelLoading';
import EmptyPanel from './EmptyPanel';
import BreakStops from './BreakStops';
import TypeBadge from './TypeBadge';
import typeStyle from './placeTypes';
import {
  PURPOSE_LABEL,
  coordsLabel,
  effectiveType,
  groupBreaks,
  hoursLabel,
  messageOf,
  placeSubtitle,
  placeTitle,
} from './placeIntelligenceModel';

/**
 * Unexplained stop time — stops nothing explains that are not statutory rest
 * or a queue — grouped by the place they happened at, worst place first. An
 * answer takes the stop off this list and teaches the engine about the place.
 */
export default function BreaksView({ version, onChanged, onOpenPlace }) {
  const [selectedKey, setSelectedKey] = useState(null);
  const [busy, setBusy] = useState(false);
  const tag = useMutation(PlaceIntelligenceService.tagStop);
  const breaksQ = useApi(
    (signal) => PlaceIntelligenceService.listBreaks({ limit: 200 }, { signal }),
    [version],
  );
  const sitesQ = useApi(
    (signal) => PlaceIntelligenceService.listSites({ limit: 200 }, { signal }),
    [version],
  );
  const sitesById = new Map((sitesQ.data?.records || []).map((s) => [s._id, s]));
  const groups = groupBreaks(breaksQ.data?.records || []);
  const active = groups.find((g) => g.key === selectedKey) || groups[0] || null;

  const titleOf = (g) => {
    const site = g.siteId && sitesById.get(g.siteId);
    return site ? placeTitle(site) : 'Unmapped roadside spot';
  };
  const subOf = (g) => {
    const site = g.siteId && sitesById.get(g.siteId);
    return site ? placeSubtitle(site) : coordsLabel(g.lat, g.lng);
  };
  const typeOf = (g) => {
    const site = g.siteId && sitesById.get(g.siteId);
    return site ? effectiveType(site).type : 'UNKNOWN';
  };

  const answer = async (stops, purpose) => {
    setBusy(true);
    try {
      // One at a time: useMutation aborts an in-flight call when a new one starts.
      for (const s of stops) await tag.mutate({ id: s._id, purpose });
      toast.success(
        `${stops.length === 1 ? 'Stop' : `${stops.length} stops`} marked as ${PURPOSE_LABEL[purpose].toLowerCase()}`,
      );
      onChanged();
    } catch (err) {
      toast.error(messageOf(err, 'Could not save the answer'));
    } finally {
      setBusy(false);
    }
  };

  if (breaksQ.loading && !breaksQ.data) return <PanelLoading />;
  if (breaksQ.error)
    return (
      <EmptyPanel
        title="Could not load stops"
        hint={messageOf(breaksQ.error, 'Try again in a minute.')}
      />
    );
  if (!groups.length)
    return (
      <EmptyPanel
        Icon={CircleCheck}
        title="No unexplained stop time this week"
        hint="Every long stop matched fuel, loading, a bill, a service, rest rules or a queue — or you answered it."
      />
    );

  const markers = groups.map((g) => ({
    id: g.key,
    lat: g.lat,
    lng: g.lng,
    color: g.key === active?.key ? '#c62828' : typeStyle(typeOf(g)).color,
    hollow: false,
    title: `${titleOf(g)} — ${hoursLabel(g.minutes)}`,
  }));

  return (
    <div className="pi-layout pi-layout--three">
      <section className="pi-list" aria-label="Places with unexplained stops">
        {groups.map((g) => (
          <button
            type="button"
            key={g.key}
            className={`pi-card${g.key === active?.key ? ' is-selected' : ''}`}
            onClick={() => setSelectedKey(g.key)}
            aria-pressed={g.key === active?.key}
          >
            <TypeBadge type={typeOf(g)} hollow />
            <span className="pi-card-body">
              <span className="pi-card-title">{titleOf(g)}</span>
              <span className="pi-card-sub">{subOf(g)}</span>
              <span className="pi-card-meta">
                <span className="pi-risk">
                  <Hourglass size={12} aria-hidden="true" /> {hoursLabel(g.minutes)}
                </span>
                <span>{g.stops.length} stops</span>
                <span>
                  <Truck size={12} aria-hidden="true" /> {g.trucks.length}
                </span>
              </span>
            </span>
          </button>
        ))}
      </section>
      <section className="pi-detail-col">
        {active ? (
          <BreakStops
            group={active}
            title={titleOf(active)}
            busy={busy}
            onAnswer={answer}
            onOpenPlace={onOpenPlace}
          />
        ) : null}
      </section>
      <section className="pi-map-col">
        <PlacesMap markers={markers} selectedId={active?.key} onSelect={setSelectedKey} />
      </section>
    </div>
  );
}
