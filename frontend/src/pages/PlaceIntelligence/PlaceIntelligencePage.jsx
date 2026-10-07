import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin, Hourglass, Route, ShieldCheck, Layers, Home, Factory } from 'lucide-react';
import PageShell from '../../components/ui/PageShell';
import PanelErrorBoundary from '../../components/cluster/PanelErrorBoundary';
import useApi from '../../hooks/useApi';
import { getUserRole } from '../../utils/session.js';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import SummaryStrip from './SummaryStrip';
import PlacesView from './PlacesView';
import BreaksView from './BreaksView';
import RoutesTab from './RoutesTab';
import RegionsView from './RegionsView';
import FacilitiesView from './FacilitiesView';
import DriverHomesView from './DriverHomesView';
import ShadowReportTab from './ShadowReportTab';
import './placeIntelligence.css';

/** Where each summary tile leads. */
const TILE_TARGET = {
  review: { view: 'places', filter: 'review' },
  confirmed: { view: 'places', filter: 'confirmed' },
  risk: { view: 'places', filter: 'risk' },
  zones: { view: 'places', filter: 'all' },
  stops: { view: 'stops' },
};

/**
 * Place Intelligence — every place the fleet's trucks stop at, what it is,
 * why the system thinks so, and the one-click answer that teaches it. Headline
 * numbers on top; each opens the list behind it. Only the active view mounts,
 * so a view fetches when it is opened. `version` bumps after every answer so
 * the numbers, lists and map all refresh together.
 */
export default function PlaceIntelligencePage() {
  // `?place=<id>` opens that place (links from Auto Trips: a drop to answer, a plant to confirm).
  const [searchParams] = useSearchParams();
  const linkedPlace = searchParams.get('place');
  const [view, setView] = useState('places');
  const [filter, setFilter] = useState(linkedPlace ? 'all' : 'review');
  const [version, setVersion] = useState(0);
  const [focusId, setFocusId] = useState(linkedPlace);
  const isSuperAdmin = getUserRole() === 'SUPER_ADMIN';
  const { data: summary } = useApi(
    (signal) => PlaceIntelligenceService.summary({ signal }),
    [version],
  );
  const bump = () => setVersion((v) => v + 1);

  const pickTile = (key) => {
    const t = TILE_TARGET[key];
    setView(t.view);
    if (t.filter) setFilter(t.filter);
  };
  const openPlace = (siteId) => {
    setFocusId(siteId);
    setFilter('all');
    setView('places');
  };

  const idleHours = summary?.unproductive?.hours;
  const views = [
    { key: 'places', label: 'Places', Icon: MapPin },
    {
      key: 'stops',
      label: 'Unexplained stops',
      Icon: Hourglass,
      badge: idleHours ? `${idleHours} h` : null,
    },
    { key: 'routes', label: 'Routes', Icon: Route },
    { key: 'facilities', label: 'Facilities', Icon: Factory },
    { key: 'regions', label: 'Regions', Icon: Layers },
    { key: 'homes', label: 'Driver homes', Icon: Home },
    ...(isSuperAdmin ? [{ key: 'shadow', label: 'Shadow report', Icon: ShieldCheck }] : []),
  ];
  const activeTile = view === 'stops' ? 'stops' : view === 'places' ? filter : null;

  return (
    <PageShell
      title="Places"
      subtitle="Every place your trucks stop, what it is, and where time and fuel go. Your answers teach the system."
      className="pi-page"
      freshnessAt={summary?.lastRunAt || null}
    >
      <SummaryStrip summary={summary} activeKey={activeTile} onPick={pickTile} />
      <div className="pi-tabs" role="tablist" aria-label="Place Intelligence views">
        {views.map((v) => (
          <button
            type="button"
            role="tab"
            key={v.key}
            aria-selected={view === v.key}
            className={view === v.key ? 'is-active' : ''}
            onClick={() => setView(v.key)}
          >
            <v.Icon size={14} aria-hidden="true" /> {v.label}
            {v.badge ? <span className="pi-count pi-count--warn">{v.badge}</span> : null}
          </button>
        ))}
      </div>
      <div
        className={`pi-view${
          ['routes', 'shadow', 'regions', 'homes', 'facilities'].includes(view)
            ? ' pi-view--scroll'
            : ''
        }`}
      >
        <PanelErrorBoundary name={`place-intelligence-${view}`}>
          {view === 'places' ? (
            <PlacesView
              filter={filter}
              onFilter={setFilter}
              version={version}
              onChanged={bump}
              initialSelectedId={focusId}
            />
          ) : null}
          {view === 'stops' ? (
            <BreaksView version={version} onChanged={bump} onOpenPlace={openPlace} />
          ) : null}
          {view === 'routes' ? <RoutesTab version={version} /> : null}
          {view === 'facilities' ? (
            <FacilitiesView version={version} onChanged={bump} onOpenPlace={openPlace} />
          ) : null}
          {view === 'regions' ? <RegionsView version={version} onChanged={bump} /> : null}
          {view === 'homes' ? <DriverHomesView version={version} onChanged={bump} /> : null}
          {view === 'shadow' ? <ShadowReportTab /> : null}
        </PanelErrorBoundary>
      </div>
    </PageShell>
  );
}
