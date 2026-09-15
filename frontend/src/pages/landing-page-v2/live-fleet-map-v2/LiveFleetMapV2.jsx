import './live-fleet-map-v2.css';
import GnbPage from '../GnbPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import MegaNav from '../components/MegaNav.jsx';
import MapHero from './components/MapHero.jsx';
import MapConsole from './components/MapConsole.jsx';
import MapSpecs from './components/MapSpecs.jsx';
import MapCapabilities from './components/MapCapabilities.jsx';
import MapAlerts from './components/MapAlerts.jsx';
import MapCta from './components/MapCta.jsx';
import Footer from './components/Footer.jsx';

// GNB Edge — Live Fleet Map page (v2). Each section is a real React component
// under ./components. Tokens + keyframes live in live-fleet-map-v2.css, scoped
// to the shared .gnb-edge-v2 wrapper.
const LiveFleetMapV2 = () => {
  return (
    <GnbPage>
      <ProgressBar />
      <MegaNav />
      <MapHero />
      <MapConsole />
      <MapSpecs />
      <MapCapabilities />
      <MapAlerts />
      <MapCta />
      <Footer />
    </GnbPage>
  );
};

export default LiveFleetMapV2;
