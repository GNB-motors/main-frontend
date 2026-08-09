import { Routes, Route, Navigate } from 'react-router-dom';

import DashboardLayout from './components/DashboardLayout';
// Removed ProfileProvider import - profile logic completely removed
import { TripCreationProvider } from './contexts/TripCreationContext.jsx';

// Updated page imports
import LoginPage from './pages/Login/LoginPage.jsx';
import SignUpPage from './pages/SignUp/SIgnUpPage.jsx';
import ContactPage from './pages/Contact/ContactPage.jsx';
import OverviewPage from './pages/Overview/OverviewPage.jsx';
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
import WeightSlipTripDetailPage from './pages/Trip/WeightSlipTripDetailPage.jsx';
import TripDetailPage from './pages/Trip/TripDetailPage.jsx';
import SuperAdminLayout from './pages/Superadmin/SuperAdminLayout.jsx';
import SuperAdminPage from './pages/Superadmin/SuperAdminPage.jsx';
import AddUserPage from './pages/Superadmin/components/AddUserPage.jsx';
import OrgFeatureFlagsPage from './pages/Superadmin/components/OrgFeatureFlagsPage.jsx';
import OrgFeatureFlagsDetailPage from './pages/Superadmin/components/OrgFeatureFlagsDetailPage.jsx';
import OrgDetailPage from './pages/Superadmin/components/OrgDetailPage.jsx';
import VehiclesPage from './pages/Profile/VehiclesPage.jsx';
import AddVehiclePage from './pages/Profile/AddVehiclePage.jsx';
import VehicleDashboardPage from './pages/Profile/VehicleDashboardPage.jsx';
import ServiceIntelligencePage from './pages/Maintenance/ServiceIntelligencePage.jsx';
import AddMaintenancePage from './pages/Maintenance/AddMaintenancePage.jsx';
import RoutesPage from './pages/Routes/RoutesPage.jsx';
import AddRoutePage from './pages/Routes/AddRoutePage.jsx';
import MileageTrackingPage from './pages/MileageTracking/MileageTrackingPage.jsx';
import MileageTrackingVehicleDetail from './pages/MileageTracking/MileageTrackingVehicleDetail.jsx';
import MileageFuelLogPage from './pages/MileageTracking/MileageFuelLogPage.jsx';
import AdBlueLogPage from './pages/MileageTracking/AdBlueLogPage.jsx';
import AdBlueTrackingPage from './pages/MileageTracking/AdBlueTrackingPage.jsx';
import MileageIntervalDetailPage from './pages/MileageTracking/MileageIntervalDetailPage.jsx';
import ModelComparisonPage from './pages/MileageTracking/ModelComparisonPage.jsx';
import LocationPage from './pages/Locations/LocationPage.jsx';
import AddLocationPage from './pages/Locations/AddLocationPage.jsx';
import RefuelLogsPage from './pages/Trip/RefuelLogsPage.jsx';
import FuelComparisonPage from './pages/FuelComparison/FuelComparisonPage.jsx';
import GeofencePage from './pages/Geofence/GeofencePage.jsx';
import GeofenceZonesPage from './pages/Geofence/GeofenceZonesPage.jsx';
import FieldAgentFuelPage from './pages/FieldAgentFuel/FieldAgentFuelPage.jsx';
import FieldAgentFuelUploadPage from './pages/FieldAgentFuel/FieldAgentFuelUploadPage.jsx';
import KhataLedgerPage from './pages/KhataLedger/KhataLedgerPage.jsx';
import TripReportDetailPage from './pages/Reports/reports/TripReportDetailPage.jsx';
import PartiesPage from './pages/ErpMasters/PartiesPage.jsx';
import RatesPage from './pages/ErpMasters/RatesPage.jsx';
import CallTasksPage from './pages/ErpCallPlanning/CallTasksPage.jsx';
import CallSchedulesPage from './pages/ErpCallPlanning/CallSchedulesPage.jsx';
import DeliveryOrdersPage from './pages/ErpDeliveryOrders/DeliveryOrdersPage.jsx';
import ApprovalsPage from './pages/ErpApprovals/ApprovalsPage.jsx';
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

import LandingPage from './pages/Landing/LandingPage.jsx';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin/new-user" element={<SignUpPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Super Admin Routes */}
      <Route path="/superadmin" element={<SuperAdminLayout />}>
        <Route index element={<SuperAdminPage />} />
        <Route path="add-user" element={<AddUserPage />} />
        <Route path="feature-flags" element={<OrgFeatureFlagsPage />} />
        <Route path="feature-flags/:orgId" element={<OrgFeatureFlagsDetailPage />} />
        <Route path="organizations/:id" element={<OrgDetailPage />} />
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
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/trip/:id" element={<TripReportDetailPage />} />
        <Route path="/fuel-comparison" element={<FuelComparisonPage />} />
        <Route path="/geofence" element={<GeofencePage />} />
        <Route path="/geofence/zones" element={<GeofenceZonesPage />} />
        <Route path="/field-agent-fuel" element={<FieldAgentFuelPage />} />
        <Route path="/field-agent-fuel/new" element={<FieldAgentFuelUploadPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/drivers/add" element={<AddDriverPage />} />
        <Route path="/drivers/bulk-upload" element={<BulkUploadDriversPage />} />
        <Route path="/trip-management" element={<TripManagementPage />} />
        <Route path="/trip-management/weight-slip/:id" element={<WeightSlipTripDetailPage />} />
        <Route path="/trip-management/trip/:id" element={<TripDetailPage />} />
        <Route path="/trip/new" element={<TripCreationFlow />} />
        <Route path="/trip/:tripId" element={<TripManagementPage />} />
        <Route path="/refuel-logs" element={<RefuelLogsPage />} />
        <Route path="/mileage-tracking" element={<MileageTrackingPage />} />
        <Route path="/mileage-tracking/vehicle/:vehicleId" element={<MileageTrackingVehicleDetail />} />
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
        <Route path="/vehicles/service-intelligence/add-service" element={<AddMaintenancePage recordType="SERVICE" />} />
        <Route path="/vehicles/service-intelligence/add-repair" element={<AddMaintenancePage recordType="REPAIR" />} />
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
        <Route path="/erp/approvals" element={<ApprovalsPage />} />
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
        <Route path="/erp/delivery-orders" element={<Navigate to="/erp/pipeline?tab=dos" replace />} />
        <Route path="/erp/placement-board" element={<Navigate to="/erp/pipeline?tab=placement" replace />} />
        <Route path="/erp/placements" element={<Navigate to="/erp/pipeline?tab=placement" replace />} />
        <Route path="/erp/trips" element={<Navigate to="/erp/pipeline?tab=trips" replace />} />
        <Route path="/erp/advances" element={<Navigate to="/erp/pipeline?tab=trips" replace />} />
        <Route path="/erp/consignments" element={<Navigate to="/erp/pipeline?tab=trips" replace />} />
        <Route path="/erp/trip-close" element={<Navigate to="/erp/pipeline?tab=trips" replace />} />
        <Route path="/erp/pods" element={<Navigate to="/erp/pipeline?tab=trips" replace />} />
        <Route path="/erp/unloading" element={<Navigate to="/erp/pipeline?tab=trips" replace />} />
        <Route path="/erp/sale-bills" element={<Navigate to="/erp/billing?tab=bills" replace />} />
        <Route path="/erp/outstanding" element={<Navigate to="/erp/billing?tab=outstanding" replace />} />
        <Route path="/erp/receipts" element={<Navigate to="/erp/billing?tab=receipts" replace />} />
        <Route path="/erp/vendor-payments" element={<Navigate to="/erp/payables?tab=vendor" replace />} />
        <Route path="/erp/supplier-payments" element={<Navigate to="/erp/payables?tab=supplier" replace />} />
        <Route path="/erp/ledger" element={<Navigate to="/erp/accounts?tab=ledger" replace />} />
        <Route path="/erp/finance" element={<Navigate to="/erp/accounts?tab=finance" replace />} />
        <Route path="/locations" element={<LocationPage />} />
        <Route path="/locations/add" element={<AddLocationPage />} />
        {/* <Route path="/request-report" element={<RequestFormPage />} /> */}
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/fleetedge-accounts" element={<FleetEdgeAccountsPage />} />
      </Route>
    </Routes>
  );
}

export default App;