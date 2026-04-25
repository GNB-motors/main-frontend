import { Routes, Route } from 'react-router-dom';

import DashboardLayout from './components/DashboardLayout';
// Removed ProfileProvider import - profile logic completely removed
import { TripCreationProvider } from './contexts/TripCreationContext.jsx';

// Updated page imports
import LoginPage from './pages/Login/LoginPage.jsx';
import SignUpPage from './pages/SignUp/SIgnUpPage.jsx';
import ContactPage from './pages/Contact/ContactPage.jsx';
import OverviewPage from './pages/Overview/OverviewPage.jsx';
import ReportsPage from './pages/Reports/ReportsPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
// import RequestFormPage from './pages/RequestForm/RequestFormPage.jsx';
import SettingsPage from './pages/Profile/SettingsPage.jsx';
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
import VehiclesPage from './pages/Profile/VehiclesPage.jsx';
import AddVehiclePage from './pages/Profile/AddVehiclePage.jsx';
import RoutesPage from './pages/Routes/RoutesPage.jsx';
import AddRoutePage from './pages/Routes/AddRoutePage.jsx';
import MileageTrackingPage from './pages/MileageTracking/MileageTrackingPage.jsx';
import MileageFuelLogPage from './pages/MileageTracking/MileageFuelLogPage.jsx';
import LocationPage from './pages/Locations/LocationPage.jsx';
import AddLocationPage from './pages/Locations/AddLocationPage.jsx';
import RefuelLogsPage from './pages/Trip/RefuelLogsPage.jsx';
import FuelComparisonPage from './pages/FuelComparison/FuelComparisonPage.jsx';
import KhataLedgerPage from './pages/KhataLedger/KhataLedgerPage.jsx';
import TripReportDetailPage from './pages/Reports/reports/TripReportDetailPage.jsx';

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
      </Route>

      {/* Protected Routes inside DashboardLayout */}
      <Route
        element={
          <TripCreationProvider>
            <DashboardLayout />
          </TripCreationProvider>
        }
      >
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/trip/:id" element={<TripReportDetailPage />} />
        <Route path="/fuel-comparison" element={<FuelComparisonPage />} />
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
        <Route path="/mileage-tracking/new" element={<MileageFuelLogPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/add" element={<AddVehiclePage />} />
        <Route path="/vehicles/bulk-upload" element={<BulkUploadVehiclesPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/routes/add" element={<AddRoutePage />} />
        <Route path="/khata-ledger" element={<KhataLedgerPage />} />
        <Route path="/locations" element={<LocationPage />} />
        <Route path="/locations/add" element={<AddLocationPage />} />
        {/* <Route path="/request-report" element={<RequestFormPage />} /> */}
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;