import { useState } from 'react';
import { toast } from 'react-toastify';
import { Hourglass, CircleCheck, ArrowLeft, ChevronRight } from 'lucide-react';
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
 * Unexplained stop time — stops nothing explains that are not statutory rest or
 * a queue — as a plain table grouped by the place they happened at, worst place
 * first. Click a row to go inside, see each stop, and answer it (with a small
 * map of that one place). An answer takes the stop off the list.
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
  const active = groups.find((g) => g.key === selectedKey) || null;

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

  // ─── Detail ("inside" one place's stops) ──────────────────────────────────
  if (active) {
    const marker = {
      id: active.key,
      lat: active.lat,
      lng: active.lng,
      color: typeStyle(typeOf(active)).color,
      hollow: false,
      title: `${titleOf(active)} — ${hoursLabel(active.minutes)}`,
    };
    return (
      <div className="pi-detailpage">
        <button type="button" className="pi-back" onClick={() => setSelectedKey(null)}>
          <ArrowLeft size={15} aria-hidden="true" /> Back to all stops
        </button>
        <div className="pi-detailpage-body">
          <section className="pi-panel pi-detailpage-main" aria-label="Stops at this place">
            <BreakStops
              group={active}
              title={titleOf(active)}
              busy={busy}
              onAnswer={answer}
              onOpenPlace={onOpenPlace}
            />
          </section>
          <aside className="pi-detail-map" aria-label="Map">
            <PlacesMap markers={[marker]} selectedId={active.key} onSelect={() => {}} />
          </aside>
        </div>
      </div>
    );
  }

  // ─── Table (places with unexplained stops) ────────────────────────────────
  const total = groups.reduce((sum, g) => sum + g.minutes, 0);
  return (
    <div className="pi-placestab">
      <div className="pi-listhead pi-listhead--summary">
        <b>
          {groups.length} place{groups.length === 1 ? '' : 's'}
        </b>
        <span>{hoursLabel(total)} unexplained · last 7 days</span>
      </div>
      <div className="pi-table-wrap">
        <table className="pi-table pi-places-table">
          <thead>
            <tr>
              <th>Place</th>
              <th>Where</th>
              <th className="pi-num">Unexplained</th>
              <th className="pi-num">Stops</th>
              <th className="pi-num">Trucks</th>
              <th aria-label="Open" />
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr
                key={g.key}
                className="pi-row"
                tabIndex={0}
                role="button"
                onClick={() => setSelectedKey(g.key)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedKey(g.key);
                  }
                }}
              >
                <td>
                  <span className="pi-rowplace">
                    <TypeBadge type={typeOf(g)} hollow />
                    <span className="pi-rowplace-name">{titleOf(g)}</span>
                  </span>
                </td>
                <td className="pi-rowwhere">{subOf(g)}</td>
                <td className="pi-num">
                  <span className="pi-risk">
                    <Hourglass size={12} aria-hidden="true" /> {hoursLabel(g.minutes)}
                  </span>
                </td>
                <td className="pi-num">{g.stops.length}</td>
                <td className="pi-num">{g.trucks.length}</td>
                <td className="pi-num">
                  <ChevronRight size={16} aria-hidden="true" className="pi-row-go" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
