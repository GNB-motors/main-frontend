import './vehicle-tracking-v2.css';
import GnbPage from '../GnbPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import MegaNav from '../components/MegaNav.jsx';
import TrackingHero from './components/TrackingHero.jsx';
import TrackingSpecs from './components/TrackingSpecs.jsx';
import TrackingCapabilities from './components/TrackingCapabilities.jsx';
import TrackingConsole from './components/TrackingConsole.jsx';
import TrackingAi from './components/TrackingAi.jsx';
import TrackingCta from './components/TrackingCta.jsx';
import Footer from './components/Footer.jsx';

// GNB Edge — Vehicle Tracking page (v2). Real JSX components under ./components;
// tokens + keyframes in vehicle-tracking-v2.css, scoped to .gnb-edge-v2.
const VehicleTrackingV2 = () => {
  return (
    <GnbPage>
      <ProgressBar />
      <MegaNav />
      <TrackingHero />
      <TrackingSpecs />
      <TrackingCapabilities />
      <TrackingConsole />
      <TrackingAi />
      <TrackingCta />
      <Footer />
    </GnbPage>
  );
};

export default VehicleTrackingV2;
