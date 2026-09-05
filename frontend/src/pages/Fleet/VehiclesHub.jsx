import React from 'react';
import { Link } from 'react-router-dom';
import FleetHub from '../../components/Fleet/FleetHub.jsx';

import VehiclesPage from '../Profile/VehiclesPage.jsx';
import VehicleDashboardPage from '../Profile/VehicleDashboardPage.jsx';
import ServiceIntelligencePage from '../Maintenance/ServiceIntelligencePage.jsx';

/**
 * VehiclesHub — three sidebar rows behind one.
 *
 * The change worth explaining is /vehicles/dashboard. It was a separate nav row
 * showing THE SAME FLEET as the list, rendered as document-expiry cards instead
 * of table rows — and its own header carried a "← Vehicles" back link, so the
 * code already treated it as a child view rather than a peer screen. It is now
 * the Grid facet of the Vehicles tab: same subject, different rendering, which
 * is a view toggle, not a destination.
 *
 * The two feeds stay separate on purpose:
 *   Table -> VehicleService.getAllVehicles  — paginated, editable, add/remove
 *   Grid  -> VehicleService.getFleetDashboard — doc-expiry rollup per vehicle
 * Fetching one and deriving the other would mean either losing the edit paths
 * or re-implementing the expiry rollup on the client.
 *
 * Service & Repairs is a tab whose own SERVICE/REPAIR/ALERTS strip is hoisted
 * into the hub's facet row — one tab row, not two stacked on each other.
 */
const SERVICE_FACETS = [
  { id: 'SERVICE', label: 'Service' },
  { id: 'REPAIR', label: 'Repair' },
  { id: 'ALERTS', label: 'Alerts' },
];

const VehiclesHub = () => {
  const tabs = [
    {
      id: 'list',
      label: 'Vehicles',
      defaultFacet: 'table',
      facets: [
        { id: 'table', label: 'Table' },
        { id: 'grid', label: 'Grid' },
      ],
      render: ({ facet }) =>
        facet === 'grid' ? <VehicleDashboardPage embedded /> : <VehiclesPage embedded />,
    },
    {
      id: 'service',
      label: 'Service & Repairs',
      defaultFacet: 'SERVICE',
      facets: SERVICE_FACETS,
      render: ({ facet, setFacet }) => (
        <ServiceIntelligencePage embedded activeTab={facet} onTabChange={setFacet} />
      ),
    },
  ];

  return (
    <FleetHub
      title="Vehicles"
      subtitle="The fleet master, document status, and service history"
      breadcrumbs={[{ label: 'Fleet' }, { label: 'Vehicles' }]}
      defaultTab="list"
      tabs={tabs}
      actions={<Link className="ov-btn" to="/reports?r=vehicle">View vehicle report</Link>}
    />
  );
};

export default VehiclesHub;
