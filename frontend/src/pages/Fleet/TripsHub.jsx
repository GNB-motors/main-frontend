import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import FleetHub from '../../components/Fleet/FleetHub.jsx';

import TripManagementPage from '../Trip/TripManagementPage.jsx';
import RouteDeviationPage from '../RouteDeviation/RouteDeviationPage.jsx';
import RoutesPage from '../Routes/RoutesPage.jsx';

/**
 * TripsHub — the journey surfaces behind one sidebar row.
 *
 * Two of these three were unreachable before this step. The trip list had no
 * sidebar entry at all (it appeared once in sideNavUtils, inside the Fuel
 * group's matchRoutes, with no link). /routes had no inbound link except
 * AddRoutePage navigating back to a list nobody could open — yet RoutesPage is
 * a complete 296-line screen with RouteService, pagination, search and Add
 * Route. It was orphaned, not unfinished, so it is rescued here as a tab.
 *
 * ONE DELIBERATE OMISSION. TripManagementPage has two datasets behind its own
 * tab strip, and the default one is dead by design:
 *
 *   fetchWeightSlipTrips() -> "The weight-slip trip flow was removed; there is
 *   no data source until the ERP-trip migration (D1). Show an empty list rather
 *   than calling a dead API."
 *
 * Its activeTab defaulted to that dataset, so anyone opening the trip list
 * landed on a guaranteed-empty table and had to find "Refuel Journeys" to see
 * anything. So this hub surfaces only the live dataset and forces the facet to
 * 'refuel'. The weight-slip code is left untouched for the D1 migration — it is
 * simply not offered as a tab until it has data behind it. A tab that is
 * structurally always empty is worse than no tab.
 */
const TripsHub = () => {
  const navigate = useNavigate();

  const tabs = [
    {
      id: 'journeys',
      label: 'Journeys',
      render: () => <TripManagementPage embedded activeTab="refuel" onTabChange={() => {}} />,
    },
    {
      id: 'deviations',
      label: 'Deviations',
      render: () => <RouteDeviationPage embedded />,
    },
    {
      id: 'routes',
      label: 'Routes',
      render: () => <RoutesPage embedded />,
    },
  ];

  return (
    <FleetHub
      title="Trips"
      subtitle="Journeys, the routes they should follow, and where they left them"
      breadcrumbs={[{ label: 'Fleet' }, { label: 'Trips' }]}
      defaultTab="journeys"
      tabs={tabs}
      actions={
        <button type="button" className="ov-btn ov-btn--primary" onClick={() => navigate('/trip/new')}>
          <Plus size={15} /> New trip
        </button>
      }
    />
  );
};

export default TripsHub;
