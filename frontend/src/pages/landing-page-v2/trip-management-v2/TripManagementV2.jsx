import './trip-management-v2.css';
import GnbPage from '../GnbPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import MegaNav from '../components/MegaNav.jsx';
import TripHero from './components/TripHero.jsx';
import TripSpecs from './components/TripSpecs.jsx';
import TripCapabilities from './components/TripCapabilities.jsx';
import TripConsole from './components/TripConsole.jsx';
import TripAi from './components/TripAi.jsx';
import TripCta from './components/TripCta.jsx';
import Footer from './components/Footer.jsx';

// GNB Edge — Trip Management page (v2). Real JSX components under ./components;
// tokens + keyframes in trip-management-v2.css, scoped to .gnb-edge-v2.
const TripManagementV2 = () => {
  return (
    <GnbPage>
      <ProgressBar />
      <MegaNav />
      <TripHero />
      <TripSpecs />
      <TripCapabilities />
      <TripConsole />
      <TripAi />
      <TripCta />
      <Footer />
    </GnbPage>
  );
};

export default TripManagementV2;
