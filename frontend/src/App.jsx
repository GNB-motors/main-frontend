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
import DriversPage  from './pages/Drivers/DriversPage.jsx';
import AddDriverPage from './pages/Drivers/AddDriverPage.jsx';
import BulkUploadPage from "./pages/BulkUpload/BulkUploadPage.jsx";
import BulkUploadDriversPage from "./pages/Drivers/BulkUploadDriversPage.jsx";
import BulkUploadVehiclesPage from "./pages/Profile/BulkUploadVehiclesPage.jsx";
import TripManagementPage from './pages/Trip/TripManagementPage.jsx';
import TripCreationFlow from './pages/Trip/TripCreationFlow.jsx';
import SuperAdminLayout from './pages/Superadmin/SuperAdminLayout.jsx';
import SuperAdminPage from './pages/Superadmin/SuperAdminPage.jsx';
import AddUserPage from './pages/Superadmin/components/AddUserPage.jsx';
import VehiclesPage from './pages/Profile/VehiclesPage.jsx';
import RoutesPage from './pages/Routes/RoutesPage.jsx';
import AddRoutePage from './pages/Routes/AddRoutePage.jsx';
import RefuelLogsPage from './pages/Trip/RefuelLogsPage.jsx';


function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin/new-user" element={<SignUpPage/>} />
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
        <Route path="/drivers" element={<DriversPage />} />
  <Route path="/drivers/add" element={<AddDriverPage />} />
        <Route path="/drivers/bulk-upload" element={<BulkUploadDriversPage />} />
        <Route path="/bulk-upload" element={<BulkUploadPage />} />
        <Route path="/trip-management" element={<TripManagementPage />} />
        <Route path="/trip/new" element={<TripCreationFlow />} />
        <Route path="/trip/:tripId" element={<TripManagementPage />} />
        <Route path="/refuel-logs" element={<RefuelLogsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/vehicles/bulk-upload" element={<BulkUploadVehiclesPage />} />
  <Route path="/routes" element={<RoutesPage />} />
  <Route path="/routes/add" element={<AddRoutePage />} />
        {/* <Route path="/request-report" element={<RequestFormPage />} /> */}
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;