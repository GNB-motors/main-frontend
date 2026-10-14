import { Route } from 'react-router-dom';
import { lazy } from 'react';

const LandingPageV2 = lazy(() => import('../../pages/landing-page-v2/LandingPageV2.jsx'));
const LiveFleetMapV2 = lazy(
  () => import('../../pages/landing-page-v2/live-fleet-map-v2/LiveFleetMapV2.jsx'),
);
const VehicleTrackingV2 = lazy(
  () => import('../../pages/landing-page-v2/vehicle-tracking-v2/VehicleTrackingV2.jsx'),
);
const TripManagementV2 = lazy(
  () => import('../../pages/landing-page-v2/trip-management-v2/TripManagementV2.jsx'),
);
const DriverManagementV2 = lazy(
  () => import('../../pages/landing-page-v2/driver-management-v2/DriverManagementV2.jsx'),
);
const FuelAndMileageV2 = lazy(
  () => import('../../pages/landing-page-v2/fuel-and-mileage-v2/FuelAndMileageV2.jsx'),
);
const SingleOwnersV2 = lazy(
  () => import('../../pages/landing-page-v2/single-owners-v2/SingleOwnersV2.jsx'),
);
const ContractFleetsV2 = lazy(
  () => import('../../pages/landing-page-v2/contract-fleets-v2/ContractFleetsV2.jsx'),
);
const EnterpriseV2 = lazy(
  () => import('../../pages/landing-page-v2/enterprise-v2/EnterpriseV2.jsx'),
);
const AboutV2 = lazy(() => import('../../pages/landing-page-v2/about-v2/AboutV2.jsx'));
const ContactV2 = lazy(() => import('../../pages/landing-page-v2/contact-v2/ContactV2.jsx'));

const LoginPage = lazy(() => import('../../pages/Login/LoginPage.jsx'));
const SignUpPage = lazy(() => import('../../pages/SignUp/SIgnUpPage.jsx'));
const ContactPage = lazy(() => import('../../pages/Contact/ContactPage.jsx'));
const OnboardingPage = lazy(() => import('../../pages/Onboarding/OnboardingPage.jsx'));
const PublicTrackingPage = lazy(() => import('../../pages/PublicTracking/PublicTrackingPage.jsx'));

const publicRoutes = (
  <>
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
    {/* Public share link — anyone with the token sees only this one vehicle */}
    <Route path="/track/:token" element={<PublicTrackingPage />} />
  </>
);

export default publicRoutes;
