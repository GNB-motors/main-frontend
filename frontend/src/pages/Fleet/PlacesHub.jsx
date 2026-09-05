import React from 'react';
import FleetHub from '../../components/Fleet/FleetHub.jsx';

import LocationPage from '../Locations/LocationPage.jsx';
import GeofenceZonesPage from '../Geofence/GeofenceZonesPage.jsx';

/**
 * PlacesHub — the geographic master data behind one sidebar row.
 *
 * The tab is called "Fuel pumps", not "Locations", on purpose. The sidebar row
 * said "Locations" while the page's own heading said "Pump Location
 * Management" — and the app already uses "location" for something else
 * entirely: BranchContext and the Navbar's LocationSwitcher mean a BUSINESS
 * BRANCH, and switching one re-keys every page and changes X-Branch-Id.
 *
 * So one word covered two unrelated concepts, one of which changes the whole
 * app's data scope. Here it is a place on the map; the branch switcher keeps
 * the other meaning. Nothing about the branch mechanism changed — only the
 * label that was competing with it.
 *
 * Zones sit beside pumps because both are geographic master data you maintain.
 * Zone BREACHES are exceptions and live in Alerts instead — which is why the
 * old Geofence accordion (Anomalies + Zones) was split across the two hubs:
 * defining a zone and triaging a breach are different jobs on different days.
 */
const PlacesHub = () => {
  const tabs = [
    {
      id: 'pumps',
      label: 'Fuel pumps',
      render: () => <LocationPage embedded />,
    },
    {
      id: 'zones',
      label: 'Geofence zones',
      render: () => <GeofenceZonesPage embedded />,
    },
  ];

  return (
    <FleetHub
      title="Places"
      subtitle="Fuel pumps and geofence zones on your map"
      breadcrumbs={[{ label: 'Fleet' }, { label: 'Places' }]}
      defaultTab="pumps"
      tabs={tabs}
    />
  );
};

export default PlacesHub;
