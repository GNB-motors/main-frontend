import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useLayoutEffect } from 'react';

function RedirectWithState({ to }) {
  const location = useLocation();
  return <Navigate to={to} state={location.state} replace />;
}

// React Router doesn't reset scroll on navigation. The marketing pages scroll
// the window, but the authenticated dashboard scrolls an inner `.page-content`
// div (DashboardLayout.jsx) that persists across routes via <Outlet />, so
// both need resetting on every path change, not just window.scrollTo.
function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector('.page-content')?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

import DashboardLayout from './components/DashboardLayout';
// Removed ProfileProvider import - profile logic completely removed
import { TripCreationProvider } from './contexts/TripCreationContext.jsx';

// Updated page imports
import LoginPage from './pages/Login/LoginPage.jsx';
import SignUpPage from './pages/SignUp/SIgnUpPage.jsx';
import ContactPage from './pages/Contact/ContactPage.jsx';
import CommandCenterPage from './pages/CommandCenter/CommandCenterPage.jsx';
import ReportsPage from './pages/Reports/ReportsPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
// import RequestFormPage from './pages/RequestForm/RequestFormPage.jsx';
import SettingsPage from './pages/Profile/SettingsPage.jsx';
import FleetEdgeAccountsPage from './pages/Settings/FleetEdgeAccountsPage.jsx';
import OnboardingPage from './pages/Onboarding/OnboardingPage.jsx';
import DriversPage from './pages/Drivers/DriversPage.jsx';
import AddDriverPage from './pages/Drivers/AddDriverPage.jsx';
import BulkUploadDriversPage from "./pages/Drivers/BulkUploadDriversPage.jsx";
import BulkUploadVehiclesPage from "./pages/Profile/BulkUploadVehiclesPage.jsx";
import TripManagementPage from './pages/Trip/TripManagementPage.jsx';
import TripCreationFlow from './pages/Trip/TripCreationFlow.jsx';
import TripDetailPage from './pages/Trip/TripDetailPage.jsx';
// Superadmin pages are lazy-loaded: admin-only JSX (incl. the LEMU
// observability page) must not ship in the customer bundle.
const SuperAdminLayout = lazy(() => import('./pages/Superadmin/SuperAdminLayout.jsx'));
const SuperAdminPage = lazy(() => import('./pages/Superadmin/SuperAdminPage.jsx'));
const AddUserPage = lazy(() => import('./pages/Superadmin/components/AddUserPage.jsx'));
const OrgFeatureFlagsPage = lazy(() => import('./pages/Superadmin/components/OrgFeatureFlagsPage.jsx'));
const OrgFeatureFlagsDetailPage = lazy(() => import('./pages/Superadmin/components/OrgFeatureFlagsDetailPage.jsx'));
const OrgDetailPage = lazy(() => import('./pages/Superadmin/components/OrgDetailPage.jsx'));
const RbacPermissionsPage = lazy(() => import('./pages/Superadmin/components/RbacPermissionsPage.jsx'));
const RbacRolesPage = lazy(() => import('./pages/Superadmin/components/RbacRolesPage.jsx'));
const LemuLogsPage = lazy(() => import('./pages/Superadmin/components/LemuLogsPage.jsx'));
const WarehousePage = lazy(() => import('./pages/Superadmin/components/WarehousePage.jsx'));
import AddVehiclePage from './pages/Profile/AddVehiclePage.jsx';
import AddMaintenancePage from './pages/Maintenance/AddMaintenancePage.jsx';
import AddRoutePage from './pages/Routes/AddRoutePage.jsx';
import MileageTrackingVehicleDetail from './pages/MileageTracking/MileageTrackingVehicleDetail.jsx';
import MileageFuelLogPage from './pages/MileageTracking/MileageFuelLogPage.jsx';
import AdBlueLogPage from './pages/MileageTracking/AdBlueLogPage.jsx';
import MileageIntervalDetailPage from './pages/MileageTracking/MileageIntervalDetailPage.jsx';
import ModelComparisonPage from './pages/MileageTracking/ModelComparisonPage.jsx';
import AddLocationPage from './pages/Locations/AddLocationPage.jsx';
import RefuelLogsPage from './pages/Trip/RefuelLogsPage.jsx';
import FieldAgentFuelUploadPage from './pages/FieldAgentFuel/FieldAgentFuelUploadPage.jsx';
import KhataLedgerPage from './pages/KhataLedger/KhataLedgerPage.jsx';
import KhataLedgerDriverDetailPage from './pages/KhataLedger/KhataLedgerDriverDetailPage.jsx';
import KhataLedgerVehicleDetailPage from './pages/KhataLedger/KhataLedgerVehicleDetailPage.jsx';
import PartiesPage from './pages/ErpMasters/PartiesPage.jsx';
import RatesPage from './pages/ErpMasters/RatesPage.jsx';
import CallTasksPage from './pages/ErpCallPlanning/CallTasksPage.jsx';
import CallSchedulesPage from './pages/ErpCallPlanning/CallSchedulesPage.jsx';
import DeliveryOrdersPage from './pages/ErpDeliveryOrders/DeliveryOrdersPage.jsx';
import ApprovalsPage from './pages/ErpApprovals/ApprovalsPage.jsx';
import BillApprovalsPage from './pages/ErpBillApprovals/BillApprovalsPage.jsx';
import PlacementBoardPage from './pages/ErpPlacement/PlacementBoardPage.jsx';
import PlacementsPage from './pages/ErpPlacement/PlacementsPage.jsx';
import VendorsPage from './pages/ErpMasters/VendorsPage.jsx';
import MaterialCompatibilityPage from './pages/ErpMasters/MaterialCompatibilityPage.jsx';
import ErpSettingsPage from './pages/ErpMasters/ErpSettingsPage.jsx';
import TripDashboardPage from './pages/ErpTrips/TripDashboardPage.jsx';
import ErpTripDetailPage from './pages/ErpTrips/TripDetailPage.jsx';
import AdvancesPage from './pages/ErpAdvances/AdvancesPage.jsx';
import AdvanceMastersPage from './pages/ErpAdvances/AdvanceMastersPage.jsx';
import ConsignmentsPage from './pages/ErpConsignments/ConsignmentsPage.jsx';
import InboundEwbPage from './pages/ErpInboundEwb/InboundEwbPage.jsx';
import TripClosePage from './pages/ErpTrips/TripClosePage.jsx';
import PodsPage from './pages/ErpPods/PodsPage.jsx';
import LedgerPage from './pages/ErpLedger/LedgerPage.jsx';
import UnloadingPage from './pages/ErpUnloading/UnloadingPage.jsx';
import SaleBillsPage from './pages/ErpSaleBills/SaleBillsPage.jsx';
import OutstandingPage from './pages/ErpOutstanding/OutstandingPage.jsx';
import ReceiptsPage from './pages/ErpReceipts/ReceiptsPage.jsx';
import VendorPaymentsPage from './pages/ErpVendorPayments/VendorPaymentsPage.jsx';
import SupplierPaymentsPage from './pages/ErpSupplierPayments/SupplierPaymentsPage.jsx';
import FinancePage from './pages/ErpFinance/FinancePage.jsx';
import ErpHomePage from './pages/ErpHome/ErpHomePage.jsx';
import ErpPipelinePage from './pages/ErpPipeline/ErpPipelinePage.jsx';
import ErpBillingPage from './pages/ErpBilling/ErpBillingPage.jsx';
import ErpPayablesPage from './pages/ErpPayables/ErpPayablesPage.jsx';
import ErpAccountsPage from './pages/ErpAccounts/ErpAccountsPage.jsx';
import Account360Page from './pages/ErpAccounts/Account360Page.jsx';
import DocumentDetailPage from './pages/ErpAccounts/DocumentDetailPage.jsx';
import AuditTrailPage from './pages/AuditTrail/AuditTrailPage.jsx';
import Vehicle360Page from './pages/Vehicle360/Vehicle360Page.jsx';

import LandingPageV2 from './pages/landing-page-v2/LandingPageV2.jsx';
import LiveFleetMapV2 from './pages/landing-page-v2/live-fleet-map-v2/LiveFleetMapV2.jsx';
import VehicleTrackingV2 from './pages/landing-page-v2/vehicle-tracking-v2/VehicleTrackingV2.jsx';
import TripManagementV2 from './pages/landing-page-v2/trip-management-v2/TripManagementV2.jsx';
import DriverManagementV2 from './pages/landing-page-v2/driver-management-v2/DriverManagementV2.jsx';
import FuelAndMileageV2 from './pages/landing-page-v2/fuel-and-mileage-v2/FuelAndMileageV2.jsx';
import SingleOwnersV2 from './pages/landing-page-v2/single-owners-v2/SingleOwnersV2.jsx';
import ContractFleetsV2 from './pages/landing-page-v2/contract-fleets-v2/ContractFleetsV2.jsx';
import EnterpriseV2 from './pages/landing-page-v2/enterprise-v2/EnterpriseV2.jsx';
import AboutV2 from './pages/landing-page-v2/about-v2/AboutV2.jsx';
import ContactV2 from './pages/landing-page-v2/contact-v2/ContactV2.jsx';
import AccessControlPage from './pages/AccessControl/AccessControlPage.jsx';
import AssignedEmployeesPage from './pages/AccessControl/AssignedEmployeesPage.jsx';
// Fleet hubs — one route hosting several existing pages as ?tab= panels.
import FuelHub from './pages/Fleet/FuelHub.jsx';
import AlertsHub from './pages/Fleet/AlertsHub.jsx';
import VehiclesHub from './pages/Fleet/VehiclesHub.jsx';
import TripsHub from './pages/Fleet/TripsHub.jsx';
import PlacesHub from './pages/Fleet/PlacesHub.jsx';
import LiveHub from './pages/Fleet/LiveHub.jsx';

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPageV2 />} />
      <Route path="/live-fleet-map" element={<LiveFleetMapV2 />} />
      <Route path="/vehicle-tracking" element={<VehicleTrackingV2 />} />
      <Route path="/trips" element={<TripManagementV2 />} />
      <Route path="/driver-management" element={<DriverManagementV2 />} />
      <Route path="/fuel-and-mileage" element={<FuelAndMileageV2 />} />
      <Route path="/single-owners" element={<SingleOwnersV2 />} />
      <Route path="/contract-fleets" element={<ContractFleetsV2 />} />
      <Route path="/enterprise" element={<EnterpriseV2 />} />
      <Route path="/about" element={<AboutV2 />} />
      <Route path="/contact-us" element={<ContactV2 />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin/new-user" element={<SignUpPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Super Admin Routes */}
      <Route path="/superadmin" element={
        <Suspense fallback={<div style={{ padding: 24 }}>Loading admin…</div>}>
          <SuperAdminLayout />
        </Suspense>
      }>
        <Route index element={<Suspense fallback={null}><SuperAdminPage /></Suspense>} />
        <Route path="add-user" element={<Suspense fallback={null}><AddUserPage /></Suspense>} />
        <Route path="feature-flags" element={<Suspense fallback={null}><OrgFeatureFlagsPage /></Suspense>} />
        <Route path="feature-flags/:orgId" element={<Suspense fallback={null}><OrgFeatureFlagsDetailPage /></Suspense>} />
        <Route path="organizations/:id" element={<Suspense fallback={null}><OrgDetailPage /></Suspense>} />
        {/* RBAC management */}
        <Route path="rbac/permissions" element={<Suspense fallback={null}><RbacPermissionsPage /></Suspense>} />
        <Route path="rbac/roles" element={<Suspense fallback={null}><RbacRolesPage /></Suspense>} />
        <Route path="lemu" element={<Suspense fallback={null}><LemuLogsPage /></Suspense>} />
        <Route path="warehouse" element={<Suspense fallback={null}><WarehousePage /></Suspense>} />
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
        <Route path="/audit-trail" element={<AuditTrailPage />} />
        <Route path="/vehicles/:registrationNumber" element={<Vehicle360Page />} />
        <Route path="/reports" element={<ReportsPage />} />
        {/* ── Fleet Fuel hub ────────────────────────────────────────────────
            One row in the sidebar replacing seven. The pages below still exist
            as standalone routes for now; the redirects further down point the
            old URLs at the matching hub tab so bookmarks keep working. */}
        <Route path="/fleet/fuel" element={<FuelHub />} />
        {/* ── Fleet Alerts hub ──────────────────────────────────────────────
            Four sidebar rows become one. The feeds are NOT merged: owner-alerts
            is the curated superset of fleet-alerts, and both are server-paginated
            (see AlertsHub.jsx). Old URLs land on the matching tab. */}
        <Route path="/fleet/alerts" element={<AlertsHub />} />
        <Route path="/owner-alerts" element={<Navigate to="/fleet/alerts?tab=inbox" replace />} />
        <Route path="/compliance" element={<Navigate to="/fleet/alerts?tab=documents" replace />} />
        <Route path="/geofence" element={<Navigate to="/fleet/alerts?tab=anomalies" replace />} />
        <Route path="/fleet-alerts" element={<Navigate to="/fleet/alerts?tab=feed" replace />} />
        <Route path="/fuel-comparison" element={<Navigate to="/fleet/fuel?tab=checks&view=comparison" replace />} />
        <Route path="/fuel-integrity" element={<Navigate to="/fleet/fuel?tab=checks&view=integrity" replace />} />
        <Route path="/fuel-spend" element={<Navigate to="/fleet/fuel?tab=costs&view=spend" replace />} />
        <Route path="/def-ledger" element={<Navigate to="/fleet/fuel?tab=costs&view=adblue" replace />} />
        <Route path="/mileage-tracking" element={<Navigate to="/fleet/fuel?tab=logs&view=mileage" replace />} />
        <Route path="/adblue-tracking" element={<Navigate to="/fleet/fuel?tab=logs&view=adblue" replace />} />
        <Route path="/field-agent-fuel" element={<Navigate to="/fleet/fuel?tab=logs&view=field" replace />} />
        <Route path="/field-agent-fuel/new" element={<FieldAgentFuelUploadPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/access-control" element={<AccessControlPage />} />
        <Route path="/access-control/assigned-employees" element={<AssignedEmployeesPage />} />
        <Route path="/drivers/add" element={<AddDriverPage />} />
        <Route path="/drivers/bulk-upload" element={<BulkUploadDriversPage />} />
        <Route path="/trip-management/trip/:id" element={<TripDetailPage />} />
        <Route path="/trip/new" element={<TripCreationFlow />} />
        <Route path="/trip/:tripId" element={<TripManagementPage />} />
        <Route path="/refuel-logs" element={<RefuelLogsPage />} />
        <Route path="/mileage-tracking/vehicle/:vehicleId" element={<MileageTrackingVehicleDetail />} />
        <Route path="/mileage-tracking/new" element={<MileageFuelLogPage />} />
        <Route path="/mileage-tracking/:id" element={<MileageIntervalDetailPage />} />
        <Route path="/adblue-tracking/new" element={<AdBlueLogPage />} />
        <Route path="/model-comparison" element={<ModelComparisonPage />} />
        <Route path="/expected-mileage" element={<ModelComparisonPage />} />
        <Route path="/def-tracking" element={<Navigate to="/fleet/fuel?tab=logs&view=adblue" replace />} />
        <Route path="/fuel-bills" element={<RefuelLogsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* ── Vehicles hub ──────────────────────────────────────────────────
            /vehicles/dashboard was a separate nav row rendering the same fleet
            as cards; it is now the Grid facet of the Vehicles tab. The add-
            service / add-repair routes below stay real pages — they are forms,
            reached from inside the Service tab. */}
        {/* ── Fleet Trips hub ──────────────────────────────────────────────
            The trip list had NO sidebar entry before this; /routes had no
            inbound link at all despite being a complete screen. Both are
            reachable here. /trip/new and /trip/:tripId stay standalone. */}
        {/* ── Fleet Live hub — the module's landing surface ────────────────
            /live-tracking previously had NO sidebar entry: its only ways in
            were two links buried ~1,260px down /overview. The map is now the
            default tab and fills the viewport; the old dashboard is the
            Insights tab beside it. */}
        <Route path="/fleet" element={<LiveHub />} />
        <Route path="/live-tracking" element={<Navigate to="/fleet?tab=live" replace />} />
        <Route path="/overview" element={<Navigate to="/fleet?tab=insights" replace />} />
        <Route path="/fleet-coverage" element={<Navigate to="/fleet?tab=coverage" replace />} />
        <Route path="/digest" element={<Navigate to="/fleet?tab=digest" replace />} />

        <Route path="/fleet/trips" element={<TripsHub />} />
        <Route path="/trip-management" element={<Navigate to="/fleet/trips?tab=journeys" replace />} />
        <Route path="/route-deviation" element={<Navigate to="/fleet/trips?tab=deviations" replace />} />
        <Route path="/routes" element={<Navigate to="/fleet/trips?tab=routes" replace />} />

        {/* ── Fleet Places hub ─────────────────────────────────────────────
            Pump locations + geofence zones. "Location" previously meant both a
            map place and a business branch (BranchContext / LocationSwitcher);
            the map-place meaning lives here as "Places". */}
        <Route path="/fleet/places" element={<PlacesHub />} />
        <Route path="/locations" element={<Navigate to="/fleet/places?tab=pumps" replace />} />
        <Route path="/geofence/zones" element={<Navigate to="/fleet/places?tab=zones" replace />} />

        <Route path="/vehicles" element={<VehiclesHub />} />
        <Route path="/vehicles/dashboard" element={<Navigate to="/vehicles?tab=list&view=grid" replace />} />
        <Route path="/vehicles/service-intelligence" element={<Navigate to="/vehicles?tab=service&view=SERVICE" replace />} />
        <Route path="/vehicles/service-intelligence/add-service" element={<AddMaintenancePage recordType="SERVICE" />} />
        <Route path="/vehicles/service-intelligence/add-repair" element={<AddMaintenancePage recordType="REPAIR" />} />
        <Route path="/vehicles/add" element={<AddVehiclePage />} />
        <Route path="/vehicles/bulk-upload" element={<BulkUploadVehiclesPage />} />
        <Route path="/routes/add" element={<AddRoutePage />} />
        <Route path="/khata-ledger" element={<KhataLedgerPage />} />
        {/* ISOCL ERP — Hub & Spoke Architecture */}
        <Route path="/erp" element={<ErpHomePage />} />
        <Route path="/erp/pipeline" element={<ErpPipelinePage />} />
        <Route path="/erp/inbound-ewb" element={<InboundEwbPage />} />
        <Route path="/erp/billing" element={<ErpBillingPage />} />
        <Route path="/erp/payables" element={<ErpPayablesPage />} />
        <Route path="/erp/accounts" element={<ErpAccountsPage />} />
        {/* Voucher/document detail — MUST precede the Account 360 catch-all so
            "voucher" is not matched as an accountType. */}
        <Route path="/erp/accounts/voucher/:docId" element={<DocumentDetailPage segment="voucher" />} />
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
        <Route path="/erp/delivery-orders" element={<RedirectWithState to="/erp/pipeline?tab=dos" />} />
        <Route path="/erp/placement-board" element={<RedirectWithState to="/erp/pipeline?tab=placement" />} />
        <Route path="/erp/placements" element={<RedirectWithState to="/erp/pipeline?tab=placement" />} />
        <Route path="/erp/trips" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
        <Route path="/erp/advances" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
        <Route path="/erp/consignments" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
        <Route path="/erp/trip-close" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
        <Route path="/erp/pods" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
        <Route path="/erp/unloading" element={<RedirectWithState to="/erp/pipeline?tab=trips" />} />
        <Route path="/erp/sale-bills" element={<RedirectWithState to="/erp/billing?tab=bills" />} />
        <Route path="/erp/outstanding" element={<RedirectWithState to="/erp/billing?tab=outstanding" />} />
        <Route path="/erp/receipts" element={<RedirectWithState to="/erp/billing?tab=receipts" />} />
        <Route path="/erp/vendor-payments" element={<RedirectWithState to="/erp/payables?tab=vendor" />} />
        <Route path="/erp/supplier-payments" element={<RedirectWithState to="/erp/payables?tab=supplier" />} />
        <Route path="/erp/ledger" element={<RedirectWithState to="/erp/accounts?tab=ledger" />} />
        <Route path="/erp/finance" element={<RedirectWithState to="/erp/accounts?tab=finance" />} />

        <Route path="/khata-ledger/drivers/:id" element={<KhataLedgerDriverDetailPage />} />
        <Route path="/khata-ledger/trucks/:id" element={<KhataLedgerVehicleDetailPage />} />
        <Route path="/locations/add" element={<AddLocationPage />} />
        {/* <Route path="/request-report" element={<RequestFormPage />} /> */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/fleetedge-accounts" element={<FleetEdgeAccountsPage />} />
      </Route>
      </Routes>
    </>
  );
}

export default App;