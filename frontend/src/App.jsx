import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import DashboardLayout from './components/DashboardLayout';
import LottieLoader from './components/LottieLoader';
import { TripCreationProvider } from './contexts/TripCreationContext.jsx';

function RedirectWithState({ to }) {
  const location = useLocation();
  return <Navigate to={to} state={location.state} replace />;
}

// Every route is lazy-loaded. Only the app shell, providers, ErrorBoundary,
// and the Suspense fallback ship in the main chunk.
const LoginPage = lazy(() => import('./pages/Login/LoginPage.jsx'));
const SignUpPage = lazy(() => import('./pages/SignUp/SIgnUpPage.jsx'));
const ContactPage = lazy(() => import('./pages/Contact/ContactPage.jsx'));
const OverviewPage = lazy(() => import('./pages/Overview/OverviewPage.jsx'));
const CommandCenterPage = lazy(() => import('./pages/CommandCenter/CommandCenterPage.jsx'));
const ReportsPage = lazy(() => import('./pages/Reports/ReportsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage.jsx'));
const SettingsPage = lazy(() => import('./pages/Profile/SettingsPage.jsx'));
const FleetEdgeAccountsPage = lazy(() => import('./pages/Settings/FleetEdgeAccountsPage.jsx'));
const OnboardingPage = lazy(() => import('./pages/Onboarding/OnboardingPage.jsx'));
const DriversPage = lazy(() => import('./pages/Drivers/DriversPage.jsx'));
const AddDriverPage = lazy(() => import('./pages/Drivers/AddDriverPage.jsx'));
const BulkUploadDriversPage = lazy(() => import('./pages/Drivers/BulkUploadDriversPage.jsx'));
const BulkUploadVehiclesPage = lazy(() => import('./pages/Profile/BulkUploadVehiclesPage.jsx'));
const TripManagementPage = lazy(() => import('./pages/Trip/TripManagementPage.jsx'));
const TripCreationFlow = lazy(() => import('./pages/Trip/TripCreationFlow.jsx'));
const TripDetailPage = lazy(() => import('./pages/Trip/TripDetailPage.jsx'));
// Superadmin pages are lazy-loaded: admin-only JSX (incl. the LEMU
// observability page) must not ship in the customer bundle.
const SuperAdminLayout = lazy(() => import('./pages/Superadmin/SuperAdminLayout.jsx'));
const SuperAdminPage = lazy(() => import('./pages/Superadmin/SuperAdminPage.jsx'));
const AddUserPage = lazy(() => import('./pages/Superadmin/components/AddUserPage.jsx'));
const OrgFeatureFlagsPage = lazy(
  () => import('./pages/Superadmin/components/OrgFeatureFlagsPage.jsx'),
);
const OrgFeatureFlagsDetailPage = lazy(
  () => import('./pages/Superadmin/components/OrgFeatureFlagsDetailPage.jsx'),
);
const OrgDetailPage = lazy(() => import('./pages/Superadmin/components/OrgDetailPage.jsx'));
const RbacPermissionsPage = lazy(
  () => import('./pages/Superadmin/components/RbacPermissionsPage.jsx'),
);
const RbacRolesPage = lazy(() => import('./pages/Superadmin/components/RbacRolesPage.jsx'));
const LemuLogsPage = lazy(() => import('./pages/Superadmin/components/LemuLogsPage.jsx'));
const LemuGraphPage = lazy(
  () => import('./pages/Superadmin/components/lemu/graph/LemuGraphPage.jsx'),
);
const WarehousePage = lazy(() => import('./pages/Superadmin/components/WarehousePage.jsx'));
const VehiclesPage = lazy(() => import('./pages/Profile/VehiclesPage.jsx'));
const AddVehiclePage = lazy(() => import('./pages/Profile/AddVehiclePage.jsx'));
const VehicleDashboardPage = lazy(() => import('./pages/Profile/VehicleDashboardPage.jsx'));
const ServiceIntelligencePage = lazy(
  () => import('./pages/Maintenance/ServiceIntelligencePage.jsx'),
);
const AddMaintenancePage = lazy(() => import('./pages/Maintenance/AddMaintenancePage.jsx'));
const RoutesPage = lazy(() => import('./pages/Routes/RoutesPage.jsx'));
const AddRoutePage = lazy(() => import('./pages/Routes/AddRoutePage.jsx'));
const MileageTrackingPage = lazy(() => import('./pages/MileageTracking/MileageTrackingPage.jsx'));
const MileageTrackingVehicleDetail = lazy(
  () => import('./pages/MileageTracking/MileageTrackingVehicleDetail.jsx'),
);
const MileageFuelLogPage = lazy(() => import('./pages/MileageTracking/MileageFuelLogPage.jsx'));
const AdBlueLogPage = lazy(() => import('./pages/MileageTracking/AdBlueLogPage.jsx'));
const AdBlueTrackingPage = lazy(() => import('./pages/MileageTracking/AdBlueTrackingPage.jsx'));
const MileageIntervalDetailPage = lazy(
  () => import('./pages/MileageTracking/MileageIntervalDetailPage.jsx'),
);
const ModelComparisonPage = lazy(() => import('./pages/MileageTracking/ModelComparisonPage.jsx'));
const LocationPage = lazy(() => import('./pages/Locations/LocationPage.jsx'));
const AddLocationPage = lazy(() => import('./pages/Locations/AddLocationPage.jsx'));
const RefuelLogsPage = lazy(() => import('./pages/Trip/RefuelLogsPage.jsx'));
const FuelComparisonPage = lazy(() => import('./pages/FuelComparison/FuelComparisonPage.jsx'));
const FuelIntegrityPage = lazy(() => import('./pages/FuelIntegrity/FuelIntegrityPage.jsx'));
const RouteDeviationPage = lazy(() => import('./pages/RouteDeviation/RouteDeviationPage.jsx'));
const RouteProfitabilityPage = lazy(
  () => import('./pages/RouteProfitability/RouteProfitabilityPage.jsx'),
);
const OverspeedPage = lazy(() => import('./pages/Overspeed/OverspeedPage.jsx'));
const HotspotsPage = lazy(() => import('./pages/Hotspots/HotspotsPage.jsx'));
const LiveTrackingPage = lazy(() => import('./pages/LiveTracking/LiveTrackingPage.jsx'));
const OwnerAlertsPage = lazy(() => import('./pages/OwnerAlerts/OwnerAlertsPage.jsx'));
const GeofencePage = lazy(() => import('./pages/Geofence/GeofencePage.jsx'));
const GeofenceZonesPage = lazy(() => import('./pages/Geofence/GeofenceZonesPage.jsx'));
const FieldAgentFuelPage = lazy(() => import('./pages/FieldAgentFuel/FieldAgentFuelPage.jsx'));
const FieldAgentFuelUploadPage = lazy(
  () => import('./pages/FieldAgentFuel/FieldAgentFuelUploadPage.jsx'),
);
const KhataLedgerPage = lazy(() => import('./pages/KhataLedger/KhataLedgerPage.jsx'));
const KhataLedgerDriverDetailPage = lazy(
  () => import('./pages/KhataLedger/KhataLedgerDriverDetailPage.jsx'),
);
const KhataLedgerVehicleDetailPage = lazy(
  () => import('./pages/KhataLedger/KhataLedgerVehicleDetailPage.jsx'),
);
const TripReportDetailPage = lazy(() => import('./pages/Reports/reports/TripReportDetailPage.jsx'));
const PartiesPage = lazy(() => import('./pages/ErpMasters/PartiesPage.jsx'));
const RatesPage = lazy(() => import('./pages/ErpMasters/RatesPage.jsx'));
const CallTasksPage = lazy(() => import('./pages/ErpCallPlanning/CallTasksPage.jsx'));
const CallSchedulesPage = lazy(() => import('./pages/ErpCallPlanning/CallSchedulesPage.jsx'));
const DeliveryOrdersPage = lazy(() => import('./pages/ErpDeliveryOrders/DeliveryOrdersPage.jsx'));
const ApprovalsPage = lazy(() => import('./pages/ErpApprovals/ApprovalsPage.jsx'));
const BillApprovalsPage = lazy(() => import('./pages/ErpBillApprovals/BillApprovalsPage.jsx'));
const PlacementBoardPage = lazy(() => import('./pages/ErpPlacement/PlacementBoardPage.jsx'));
const PlacementsPage = lazy(() => import('./pages/ErpPlacement/PlacementsPage.jsx'));
const VendorsPage = lazy(() => import('./pages/ErpMasters/VendorsPage.jsx'));
const MaterialCompatibilityPage = lazy(
  () => import('./pages/ErpMasters/MaterialCompatibilityPage.jsx'),
);
const ErpSettingsPage = lazy(() => import('./pages/ErpMasters/ErpSettingsPage.jsx'));
const ErpTripDetailPage = lazy(() => import('./pages/ErpTrips/TripDetailPage.jsx'));
const AdvanceMastersPage = lazy(() => import('./pages/ErpAdvances/AdvanceMastersPage.jsx'));
const LedgerPage = lazy(() => import('./pages/ErpLedger/LedgerPage.jsx'));
const ErpHomePage = lazy(() => import('./pages/ErpHome/ErpHomePage.jsx'));
const ErpPipelinePage = lazy(() => import('./pages/ErpPipeline/ErpPipelinePage.jsx'));
const ErpBillingPage = lazy(() => import('./pages/ErpBilling/ErpBillingPage.jsx'));
const ErpPayablesPage = lazy(() => import('./pages/ErpPayables/ErpPayablesPage.jsx'));
const ErpAccountsPage = lazy(() => import('./pages/ErpAccounts/ErpAccountsPage.jsx'));
const Account360Page = lazy(() => import('./pages/ErpAccounts/Account360Page.jsx'));
const DocumentDetailPage = lazy(() => import('./pages/ErpAccounts/DocumentDetailPage.jsx'));
const DailyDigestPage = lazy(() => import('./pages/DailyDigest/DailyDigestPage.jsx'));
const CompliancePage = lazy(() => import('./pages/Compliance/CompliancePage.jsx'));
const FleetAlertsPage = lazy(() => import('./pages/FleetAlerts/FleetAlertsPage.jsx'));
const FuelSpendPage = lazy(() => import('./pages/FuelSpend/FuelSpendPage.jsx'));
const DefLedgerPage = lazy(() => import('./pages/DefLedger/DefLedgerPage.jsx'));
const FleetCoveragePage = lazy(() => import('./pages/FleetCoverage/FleetCoveragePage.jsx'));
const AuditTrailPage = lazy(() => import('./pages/AuditTrail/AuditTrailPage.jsx'));
const RouteIntelligencePage = lazy(
  () => import('./pages/RouteIntelligence/RouteIntelligencePage.jsx'),
);
const Vehicle360Page = lazy(() => import('./pages/Vehicle360/Vehicle360Page.jsx'));

const LandingPage = lazy(() => import('./pages/Landing/LandingPage.jsx'));
const AccessControlPage = lazy(() => import('./pages/AccessControl/AccessControlPage.jsx'));
const AssignedEmployeesPage = lazy(() => import('./pages/AccessControl/AssignedEmployeesPage.jsx'));

function App() {
  return (
    <Suspense fallback={<LottieLoader isLoading />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin/new-user" element={<SignUpPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* Super Admin Routes */}
        <Route
          path="/superadmin"
          element={
            <Suspense fallback={<div style={{ padding: 24 }}>Loading admin…</div>}>
              <SuperAdminLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={null}>
                <SuperAdminPage />
              </Suspense>
            }
          />
          <Route
            path="add-user"
            element={
              <Suspense fallback={null}>
                <AddUserPage />
              </Suspense>
            }
          />
          <Route
            path="feature-flags"
            element={
              <Suspense fallback={null}>
                <OrgFeatureFlagsPage />
              </Suspense>
            }
          />
          <Route
            path="feature-flags/:orgId"
            element={
              <Suspense fallback={null}>
                <OrgFeatureFlagsDetailPage />
              </Suspense>
            }
          />
          <Route
            path="organizations/:id"
            element={
              <Suspense fallback={null}>
                <OrgDetailPage />
              </Suspense>
            }
          />
          {/* RBAC management */}
          <Route
            path="rbac/permissions"
            element={
              <Suspense fallback={null}>
                <RbacPermissionsPage />
              </Suspense>
            }
          />
          <Route
            path="rbac/roles"
            element={
              <Suspense fallback={null}>
                <RbacRolesPage />
              </Suspense>
            }
          />
          <Route
            path="lemu"
            element={
              <Suspense fallback={null}>
                <LemuLogsPage />
              </Suspense>
            }
          />
          <Route
            path="graph"
            element={
              <Suspense fallback={null}>
                <LemuGraphPage />
              </Suspense>
            }
          />
          <Route
            path="warehouse"
            element={
              <Suspense fallback={null}>
                <WarehousePage />
              </Suspense>
            }
          />
        </Route>

        {/* Protected Routes inside DashboardLayout */}
        <Route
          element={
            <TripCreationProvider>
              <DashboardLayout />
            </TripCreationProvider>
          }
        >
          <Route path="/command-center" element={<CommandCenterPage />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/digest" element={<DailyDigestPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/fleet-alerts" element={<FleetAlertsPage />} />
          <Route path="/fuel-spend" element={<FuelSpendPage />} />
          <Route path="/def-ledger" element={<DefLedgerPage />} />
          <Route path="/fleet-coverage" element={<FleetCoveragePage />} />
          <Route path="/audit-trail" element={<AuditTrailPage />} />
          <Route path="/route-intelligence" element={<RouteIntelligencePage />} />
          <Route path="/vehicles/:registrationNumber" element={<Vehicle360Page />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/trip/:id" element={<TripReportDetailPage />} />
          <Route path="/fuel-comparison" element={<FuelComparisonPage />} />
          <Route path="/fuel-integrity" element={<FuelIntegrityPage />} />
          <Route path="/route-deviation" element={<RouteDeviationPage />} />
          <Route path="/route-profitability" element={<RouteProfitabilityPage />} />
          <Route path="/overspeed" element={<OverspeedPage />} />
          <Route path="/hotspots" element={<HotspotsPage />} />
          <Route path="/live-tracking" element={<LiveTrackingPage />} />
          <Route path="/owner-alerts" element={<OwnerAlertsPage />} />
          <Route path="/geofence" element={<GeofencePage />} />
          <Route path="/geofence/zones" element={<GeofenceZonesPage />} />
          <Route path="/field-agent-fuel" element={<FieldAgentFuelPage />} />
          <Route path="/field-agent-fuel/new" element={<FieldAgentFuelUploadPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/access-control" element={<AccessControlPage />} />
          <Route path="/access-control/assigned-employees" element={<AssignedEmployeesPage />} />
          <Route path="/drivers/add" element={<AddDriverPage />} />
          <Route path="/drivers/bulk-upload" element={<BulkUploadDriversPage />} />
          <Route path="/trip-management" element={<TripManagementPage />} />
          <Route path="/trip-management/trip/:id" element={<TripDetailPage />} />
          <Route path="/trip/new" element={<TripCreationFlow />} />
          <Route path="/trip/:tripId" element={<TripManagementPage />} />
          <Route path="/refuel-logs" element={<RefuelLogsPage />} />
          <Route path="/mileage-tracking" element={<MileageTrackingPage />} />
          <Route
            path="/mileage-tracking/vehicle/:vehicleId"
            element={<MileageTrackingVehicleDetail />}
          />
          <Route path="/mileage-tracking/new" element={<MileageFuelLogPage />} />
          <Route path="/mileage-tracking/:id" element={<MileageIntervalDetailPage />} />
          <Route path="/adblue-tracking" element={<AdBlueTrackingPage />} />
          <Route path="/adblue-tracking/new" element={<AdBlueLogPage />} />
          <Route path="/model-comparison" element={<ModelComparisonPage />} />
          <Route path="/expected-mileage" element={<ModelComparisonPage />} />
          <Route path="/def-tracking" element={<Navigate to="/adblue-tracking" replace />} />
          <Route path="/fuel-bills" element={<RefuelLogsPage />} />
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
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/routes/add" element={<AddRoutePage />} />
          <Route path="/khata-ledger" element={<KhataLedgerPage />} />
          {/* ISOCL ERP — Hub & Spoke Architecture */}
          <Route path="/erp" element={<ErpHomePage />} />
          <Route path="/erp/pipeline" element={<ErpPipelinePage />} />
          <Route path="/erp/billing" element={<ErpBillingPage />} />
          <Route path="/erp/payables" element={<ErpPayablesPage />} />
          <Route path="/erp/accounts" element={<ErpAccountsPage />} />
          {/* Voucher/document detail — MUST precede the Account 360 catch-all so
              "voucher" is not matched as an accountType. */}
          <Route
            path="/erp/accounts/voucher/:docId"
            element={<DocumentDetailPage segment="voucher" />}
          />
          {/* Account 360 — per-party/vendor/supplier/driver financial detail. */}
          <Route path="/erp/accounts/:accountType/:accountId" element={<Account360Page />} />
          <Route path="/erp/approvals" element={<ApprovalsPage />} />
          <Route path="/erp/bill-approvals" element={<BillApprovalsPage />} />
          <Route path="/erp/call-tasks" element={<CallTasksPage />} />
          <Route path="/erp/call-schedules" element={<CallSchedulesPage />} />
          <Route path="/erp/trips/:tripId" element={<ErpTripDetailPage />} />

          {/* Masters & Settings */}
          <Route path="/erp/parties" element={<PartiesPage />} />
          <Route path="/erp/rates" element={<RatesPage />} />
          <Route path="/erp/vendors" element={<VendorsPage />} />
          <Route path="/erp/material-compatibility" element={<MaterialCompatibilityPage />} />
          <Route path="/erp/advance-masters" element={<AdvanceMastersPage />} />
          <Route path="/erp/settings" element={<ErpSettingsPage />} />

          {/* Legacy Route Redirects (1 Release Backward Compatibility) */}
          <Route
            path="/erp/delivery-orders"
            element={<RedirectWithState to="/erp/pipeline?tab=dos" />}
          />
          <Route
            path="/erp/placement-board"
            element={<RedirectWithState to="/erp/pipeline?tab=placement" />}
          />
          <Route
            path="/erp/placements"
            element={<RedirectWithState to="/erp/pipeline?tab=placement" />}
          />
          <Route path="/erp/trips" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
          <Route
            path="/erp/advances"
            element={<RedirectWithState to="/erp/pipeline?tab=trips" />}
          />
          <Route
            path="/erp/consignments"
            element={<RedirectWithState to="/erp/pipeline?tab=trips" />}
          />
          <Route
            path="/erp/trip-close"
            element={<RedirectWithState to="/erp/pipeline?tab=trips" />}
          />
          <Route path="/erp/pods" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
          <Route
            path="/erp/unloading"
            element={<RedirectWithState to="/erp/pipeline?tab=trips" />}
          />
          <Route
            path="/erp/sale-bills"
            element={<RedirectWithState to="/erp/billing?tab=bills" />}
          />
          <Route
            path="/erp/outstanding"
            element={<RedirectWithState to="/erp/billing?tab=outstanding" />}
          />
          <Route
            path="/erp/receipts"
            element={<RedirectWithState to="/erp/billing?tab=receipts" />}
          />
          <Route
            path="/erp/vendor-payments"
            element={<RedirectWithState to="/erp/payables?tab=vendor" />}
          />
          <Route
            path="/erp/supplier-payments"
            element={<RedirectWithState to="/erp/payables?tab=supplier" />}
          />
          <Route path="/erp/ledger" element={<RedirectWithState to="/erp/accounts?tab=ledger" />} />
          <Route
            path="/erp/finance"
            element={<RedirectWithState to="/erp/accounts?tab=finance" />}
          />

          <Route path="/khata-ledger/drivers/:id" element={<KhataLedgerDriverDetailPage />} />
          <Route path="/khata-ledger/trucks/:id" element={<KhataLedgerVehicleDetailPage />} />
          <Route path="/locations" element={<LocationPage />} />
          <Route path="/locations/add" element={<AddLocationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/fleetedge-accounts" element={<FleetEdgeAccountsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
