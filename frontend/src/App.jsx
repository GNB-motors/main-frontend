import { Routes, Route } from 'react-router-dom';

import DashboardLayout from './components/DashboardLayout';
// Updated import path for ProfileProvider
import { ProfileProvider } from './pages/Profile/ProfileContext.jsx';

// Updated page imports
import LoginPage from './pages/Login/LoginPage.jsx';
import SignUpPage from './pages/SignUp/SIgnUpPage.jsx';
import ContactPage from './pages/Contact/ContactPage.jsx';
import OverviewPage from './pages/Overview/OverviewPage.jsx';
import ReportsPage from './pages/Reports/ReportsPage.jsx';
import ProfilePage from './pages/Profile/ProfilePage.jsx';
import RequestFormPage from './pages/RequestForm/RequestFormPage.jsx';
import SettingsPage from './pages/Profile/SettingsPage.jsx';
import OnboardingPage from './pages/Onboarding/OnboardingPage.jsx';
import DriversPage  from './pages/Drivers/DriversPage.jsx';


function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/admin/new-user" element={<SignUpPage/>} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Protected Routes inside DashboardLayout, wrapped by ProfileProvider */}
      <Route
        element={
          <ProfileProvider> {/* <-- Wrap DashboardLayout routes */}
            <DashboardLayout />
          </ProfileProvider>
        }
      >
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/request-report" element={<RequestFormPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;