import {
  MapPinned,
  Hourglass,
  Flame,
  Clock,
  Route,
  Factory,
  Layers,
  Home,
  ShieldCheck,
} from 'lucide-react';

// Place Intelligence's views live here too: the map ones first, then its tables.
export default function placeHubTabs({
  allowIdling,
  allowFuel,
  allowSites,
  isSuperAdmin,
  allowHygiene,
}) {
  return [
    { id: 'places', label: 'Places', Icon: MapPinned },
    allowIdling && { id: 'idling', label: 'Idling', Icon: Hourglass },
    allowFuel && { id: 'fuel', label: 'Fuel risk', Icon: Flame },
    allowSites && { id: 'stops', label: 'Stops', Icon: Clock, title: 'Unexplained stops' },
    allowHygiene && { id: 'duplicates', label: 'Same place?', Icon: Layers, table: true },
    allowSites && { id: 'routes', label: 'Routes', Icon: Route, table: true },
    allowSites && { id: 'facilities', label: 'Facilities', Icon: Factory, table: true },
    allowSites && { id: 'regions', label: 'Regions', Icon: Layers, table: true },
    allowSites && { id: 'homes', label: 'Driver homes', Icon: Home, table: true },
    allowSites &&
      isSuperAdmin && { id: 'shadow', label: 'Shadow report', Icon: ShieldCheck, table: true },
  ].filter(Boolean);
}
