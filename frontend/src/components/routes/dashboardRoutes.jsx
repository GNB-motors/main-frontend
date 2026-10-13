import { Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import RedirectWithState from './RedirectWithState';
import PlacesRedirect from './PlacesRedirect';
import LegacyReceiptRedirect from './LegacyReceiptRedirect';
import ReceiptApprovalDetailPage from './lazyReceiptApprovalDetailPage';
import erpRoutes from './erpRoutes';

const ReportsPage = lazy(() => import('../../pages/Reports/ReportsPage.jsx'));
const ProfilePage = lazy(() => import('../../pages/Profile/ProfilePage.jsx'));
const SettingsPage = lazy(() => import('../../pages/Settings/SettingsPage.jsx'));
const FleetEdgeAccountsPage = lazy(() => import('../../pages/Settings/FleetEdgeAccountsPage.jsx'));
const DriversPage = lazy(() => import('../../pages/Drivers/DriversPage.jsx'));
const AddDriverPage = lazy(() => import('../../pages/Drivers/AddDriverPage.jsx'));
const BulkUploadDriversPage = lazy(() => import('../../pages/Drivers/BulkUploadDriversPage.jsx'));
const BulkUploadVehiclesPage = lazy(() => import('../../pages/Profile/BulkUploadVehiclesPage.jsx'));
const TripManagementPage = lazy(() => import('../../pages/Trip/TripManagementPage.jsx'));
const TripDetailPage = lazy(() => import('../../pages/Trip/TripDetailPage.jsx'));
const FleetApprovalsPage = lazy(() => import('../../pages/Approvals/ApprovalsPage.jsx'));
const VehiclesPage = lazy(() => import('../../pages/Profile/VehiclesPage.jsx'));
const AddVehiclePage = lazy(() => import('../../pages/Profile/AddVehiclePage.jsx'));
const VehicleDashboardPage = lazy(() => import('../../pages/Profile/VehicleDashboardPage.jsx'));
const ServiceIntelligencePage = lazy(
  () => import('../../pages/Maintenance/ServiceIntelligencePage.jsx'),
);
const AddMaintenancePage = lazy(() => import('../../pages/Maintenance/AddMaintenancePage.jsx'));
const MileagePage = lazy(() => import('../../pages/Mileage/MileagePage.jsx'));
const MileageTrackingVehicleDetail = lazy(
  () => import('../../pages/MileageTracking/MileageTrackingVehicleDetail.jsx'),
);
const MileageFuelLogPage = lazy(() => import('../../pages/MileageTracking/MileageFuelLogPage.jsx'));
const AdBlueLogPage = lazy(() => import('../../pages/MileageTracking/AdBlueLogPage.jsx'));
const AdBlueTrackingPage = lazy(() => import('../../pages/MileageTracking/AdBlueTrackingPage.jsx'));
const MileageIntervalDetailPage = lazy(
  () => import('../../pages/MileageTracking/MileageIntervalDetailPage.jsx'),
);
const LocationPage = lazy(() => import('../../pages/Locations/LocationPage.jsx'));
const AddLocationPage = lazy(() => import('../../pages/Locations/AddLocationPage.jsx'));
const FuelIntegrityPage = lazy(() => import('../../pages/FuelIntegrity/FuelIntegrityPage.jsx'));
const RouteHubPage = lazy(() => import('../../pages/RouteHub/RouteHubPage.jsx'));
const AutoTripsPage = lazy(() => import('../../pages/AutoTrips/AutoTripsPage.jsx'));
const TripPlansPage = lazy(() => import('../../pages/AutoTrips/TripPlansPage.jsx'));
const AutoTripDetailPage = lazy(() => import('../../pages/AutoTrips/AutoTripDetailPage.jsx'));
const ExcursionsPage = lazy(() => import('../../pages/AutoTrips/ExcursionsPage.jsx'));
const ExcursionDetailPage = lazy(() => import('../../pages/AutoTrips/ExcursionDetailPage.jsx'));
const MovementApprovalsPage = lazy(() => import('../../pages/AutoTrips/MovementApprovalsPage.jsx'));
const PlaceHubPage = lazy(() => import('../../pages/PlaceHub/PlaceHubPage.jsx'));
const LiveTrackingPage = lazy(() => import('../../pages/LiveTracking/LiveTrackingPage.jsx'));
const OwnerAlertsPage = lazy(() => import('../../pages/OwnerAlerts/OwnerAlertsPage.jsx'));
const FieldAgentFuelPage = lazy(() => import('../../pages/FieldAgentFuel/FieldAgentFuelPage.jsx'));
const FieldAgentFuelUploadPage = lazy(
  () => import('../../pages/FieldAgentFuel/FieldAgentFuelUploadPage.jsx'),
);
const KhataLedgerPage = lazy(() => import('../../pages/KhataLedger/KhataLedgerPage.jsx'));
const KhataLedgerDriverDetailPage = lazy(
  () => import('../../pages/KhataLedger/KhataLedgerDriverDetailPage.jsx'),
);
const KhataLedgerVehicleDetailPage = lazy(
  () => import('../../pages/KhataLedger/KhataLedgerVehicleDetailPage.jsx'),
);
const DailyDigestPage = lazy(() => import('../../pages/DailyDigest/DailyDigestPage.jsx'));
const FleetAlertsPage = lazy(() => import('../../pages/FleetAlerts/FleetAlertsPage.jsx'));
const OptimalSpeedPage = lazy(() => import('../../pages/OptimalSpeed/OptimalSpeedPage.jsx'));
const RefuelAdvisoryPage = lazy(() => import('../../pages/RefuelAdvisory/RefuelAdvisoryPage.jsx'));
const DrivingDnaPage = lazy(() => import('../../pages/DrivingDna/DrivingDnaPage.jsx'));
const DefLedgerPage = lazy(() => import('../../pages/DefLedger/DefLedgerPage.jsx'));
const FleetCoveragePage = lazy(() => import('../../pages/FleetCoverage/FleetCoveragePage.jsx'));
const Vehicle360Page = lazy(() => import('../../pages/Vehicle360/Vehicle360Page.jsx'));
const AccessControlPage = lazy(() => import('../../pages/AccessControl/AccessControlPage.jsx'));
const AssignedEmployeesPage = lazy(
  () => import('../../pages/AccessControl/AssignedEmployeesPage.jsx'),
);

// Children of the authenticated DashboardLayout route (App.jsx).
const dashboardRoutes = (
  <>
    <Route path="/digest" element={<DailyDigestPage />} />
    <Route path="/fleet-alerts" element={<FleetAlertsPage />} />
    <Route path="/idling-console" element={<Navigate to="/route-hub" replace />} />
    <Route path="/daily-brief" element={<Navigate to="/digest" replace />} />
    <Route path="/def-ledger" element={<DefLedgerPage />} />
    <Route path="/fleet-coverage" element={<FleetCoveragePage />} />
    <Route path="/route-hub" element={<RouteHubPage />} />
    <Route
      path="/route-intelligence"
      element={<RedirectWithState to="/route-hub?tab=intelligence" />}
    />
    <Route path="/optimal-speed" element={<OptimalSpeedPage />} />
    <Route path="/refuel-advisory" element={<RefuelAdvisoryPage />} />
    <Route path="/driving-dna" element={<DrivingDnaPage />} />
    <Route path="/vehicles/:registrationNumber" element={<Vehicle360Page />} />
    <Route path="/reports" element={<ReportsPage />} />
    <Route path="/fuel-integrity" element={<FuelIntegrityPage />} />
    <Route
      path="/approvals"
      element={
        <Suspense fallback={null}>
          <FleetApprovalsPage />
        </Suspense>
      }
    />
    <Route
      path="/approvals/whatsapp/:id"
      element={
        <Suspense fallback={null}>
          <ReceiptApprovalDetailPage />
        </Suspense>
      }
    />
    {/* WhatsApp Approvals became the WhatsApp tab of Approvals */}
    <Route
      path="/whatsapp-approvals"
      element={<Navigate to="/approvals?type=whatsapp" replace />}
    />
    <Route path="/whatsapp-approvals/:id" element={<LegacyReceiptRedirect />} />
    <Route path="/route-deviation" element={<RedirectWithState to="/route-hub?tab=deviation" />} />
    <Route path="/route-replay" element={<RedirectWithState to="/route-hub?tab=replay" />} />
    <Route
      path="/route-profitability"
      element={<RedirectWithState to="/route-hub?tab=profitability" />}
    />
    <Route path="/overspeed" element={<RedirectWithState to="/route-hub?tab=overspeed" />} />
    {/* Deprecated / hidden routes redirect cleanly so no blank screens appear */}
    <Route path="/hotspots" element={<Navigate to="/route-hub" replace />} />
    <Route path="/idling-console" element={<Navigate to="/route-hub" replace />} />
    <Route path="/places" element={<PlacesRedirect />} />
    <Route path="/place-hub" element={<PlaceHubPage />} />
    <Route path="/live-tracking" element={<LiveTrackingPage />} />
    <Route path="/owner-alerts" element={<OwnerAlertsPage />} />
    <Route path="/geofence" element={<Navigate to="/live-tracking" replace />} />
    <Route path="/geofence/zones" element={<Navigate to="/live-tracking" replace />} />
    <Route path="/geofence-zones" element={<Navigate to="/live-tracking" replace />} />
    <Route path="/geofence/alerts" element={<Navigate to="/live-tracking" replace />} />
    {/* Field Agent Fuel deprecated -> the Field agent tab of Approvals */}
    <Route
      path="/field-agent-fuel"
      element={<Navigate to="/approvals?type=field-agent" replace />}
    />
    <Route
      path="/field-agent-fuel/new"
      element={<Navigate to="/approvals?type=field-agent" replace />}
    />
    {/* Fleet Intelligence Routes */}
    <Route path="/route-hub" element={<RouteHubPage />} />
    <Route path="/drivers" element={<DriversPage />} />
    <Route path="/access-control" element={<AccessControlPage />} />
    <Route path="/access-control/assigned-employees" element={<AssignedEmployeesPage />} />
    <Route path="/drivers/add" element={<AddDriverPage />} />
    <Route path="/drivers/bulk-upload" element={<BulkUploadDriversPage />} />
    <Route path="/trip-management" element={<TripManagementPage />} />
    <Route path="/trip-management/trip/:id" element={<TripDetailPage />} />
    {/* The old weight-slip trip form was retired with its backend; adding a trip now happens on the Trips page. */}
    <Route path="/trip/new" element={<Navigate to="/auto-trips?new=manual" replace />} />
    <Route path="/trip/:tripId" element={<TripManagementPage />} />
    {/* Fuel Management Routes */}
    <Route path="/mileage" element={<MileagePage />} />
    <Route path="/fuel-integrity" element={<FuelIntegrityPage />} />
    <Route path="/def-ledger" element={<DefLedgerPage />} />
    {/* Backward-compatibility redirects for unified Mileage */}
    <Route path="/refuel-logs" element={<Navigate to="/mileage?tab=live" replace />} />
    <Route path="/mileage-tracking" element={<Navigate to="/mileage?tab=performance" replace />} />
    {/* Drill-downs the hub's tables link to */}
    <Route path="/mileage-tracking/vehicle/:vehicleId" element={<MileageTrackingVehicleDetail />} />
    <Route path="/mileage-tracking/new" element={<MileageFuelLogPage />} />
    <Route path="/mileage-tracking/:id" element={<MileageIntervalDetailPage />} />
    <Route
      path="/fuel-comparison"
      element={<Navigate to="/mileage?tab=reconciliation&view=ecu" replace />}
    />
    <Route path="/adblue-tracking" element={<Navigate to="/def-ledger" replace />} />
    <Route path="/adblue-tracking/new" element={<Navigate to="/def-ledger" replace />} />
    <Route
      path="/model-comparison"
      element={<Navigate to="/mileage?tab=performance&view=models" replace />}
    />
    <Route
      path="/expected-mileage"
      element={<Navigate to="/mileage?tab=performance&view=models" replace />}
    />
    <Route path="/def-tracking" element={<Navigate to="/def-ledger" replace />} />
    <Route path="/fuel-bills" element={<Navigate to="/mileage?tab=live" replace />} />
    <Route path="/fuel-spend" element={<Navigate to="/mileage?tab=live" replace />} />
    <Route path="/profile" element={<ProfilePage />} />
    <Route path="/vehicles" element={<VehiclesPage />} />
    <Route path="/vehicles/dashboard" element={<VehicleDashboardPage />} />
    <Route path="/vehicles/service-intelligence" element={<ServiceIntelligencePage />} />
    <Route
      path="/vehicles/service-intelligence/add-service"
      element={<AddMaintenancePage recordType="SERVICE" />}
    />
    <Route
      path="/vehicles/service-intelligence/add-repair"
      element={<AddMaintenancePage recordType="REPAIR" />}
    />
    <Route path="/vehicles/add" element={<AddVehiclePage />} />
    <Route path="/vehicles/bulk-upload" element={<BulkUploadVehiclesPage />} />
    <Route path="/warehouses" element={<Navigate to="/auto-trips" replace />} />
    <Route path="/auto-trips" element={<AutoTripsPage />} />
    {/* The Oil & Average report lives on the Reports page now. */}
    <Route
      path="/auto-trips/oil-average"
      element={<Navigate to="/reports?report=oilAverage" replace />}
    />
    <Route path="/auto-trips/excursions" element={<ExcursionsPage />} />
    <Route path="/auto-trips/excursions/:id" element={<ExcursionDetailPage />} />
    <Route path="/auto-trips/approvals" element={<MovementApprovalsPage />} />
    <Route path="/auto-trips/plans" element={<TripPlansPage />} />
    <Route path="/auto-trips/:id" element={<AutoTripDetailPage />} />
    <Route path="/khata-ledger" element={<KhataLedgerPage />} />
    {erpRoutes}

    <Route path="/khata-ledger/drivers/:id" element={<KhataLedgerDriverDetailPage />} />
    <Route path="/khata-ledger/trucks/:id" element={<KhataLedgerVehicleDetailPage />} />
    <Route path="/locations" element={<LocationPage />} />
    <Route path="/locations/add" element={<AddLocationPage />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/settings/fleetedge-accounts" element={<FleetEdgeAccountsPage />} />
  </>
);

export default dashboardRoutes;
