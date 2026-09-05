import React from 'react';
import FleetHub from '../../components/Fleet/FleetHub.jsx';

import OwnerAlertsPage from '../OwnerAlerts/OwnerAlertsPage.jsx';
import CompliancePage from '../Compliance/CompliancePage.jsx';
import GeofencePage from '../Geofence/GeofencePage.jsx';
import FleetAlertsPage from '../FleetAlerts/FleetAlertsPage.jsx';

/**
 * AlertsHub — the four alert surfaces behind one sidebar row.
 *
 * These are NOT merged into a single list, and that is deliberate. The audit
 * plan originally called for fusing Fleet Alerts and Owner Alerts into one
 * faceted stream; reading the services showed why that would be wrong:
 *
 *   /api/owner-alerts  — the "unified owner-alert feed". 13 types. Already
 *                        ingests the FleetEdge events (refuel, fuel drain,
 *                        geofence entered/exited, overspeed) AND adds
 *                        GNB-derived ones (siphon suspected, idling burn,
 *                        AdBlue flag, re-auth). Acknowledgeable. Paginated.
 *   /api/fleet-alerts  — the RAW FleetEdge push timeline, with per-type counts
 *                        and CSV export. Paginated.
 *
 * Owner Alerts is a superset of Fleet Alerts. Concatenating two independently
 * server-paginated feeds would show the same FleetEdge event twice and make
 * page counts meaningless. So they stay separate views over the same data at
 * different fidelities — and the tab labels finally say which is which:
 * "Inbox" is what needs a human, "FleetEdge feed" is what the device sent.
 *
 * The other two are genuinely different jobs, not duplicates:
 *   Documents  — an expiry register you work through (with ₹ fine exposure)
 *   Anomalies  — locations where fuel went missing, each resolved with a note
 *
 * The real fix in this step is not the tabs. It is pages/Fleet/alertActions.js:
 * every alert now carries a link to the screen that resolves it.
 */
const AlertsHub = () => {
  const tabs = [
    {
      id: 'inbox',
      label: 'Inbox',
      render: () => <OwnerAlertsPage embedded />,
    },
    {
      id: 'documents',
      label: 'Documents',
      render: () => <CompliancePage embedded />,
    },
    {
      id: 'anomalies',
      label: 'Anomalies',
      render: () => <GeofencePage embedded />,
    },
    {
      id: 'feed',
      label: 'FleetEdge feed',
      render: () => <FleetAlertsPage embedded />,
    },
  ];

  return (
    <FleetHub
      title="Alerts"
      subtitle="What needs your attention, and where to fix it"
      breadcrumbs={[{ label: 'Fleet' }, { label: 'Alerts' }]}
      defaultTab="inbox"
      tabs={tabs}
    />
  );
};

export default AlertsHub;
