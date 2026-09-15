import './driver-management-v2.css';
import GnbPage from '../GnbPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import MegaNav from '../components/MegaNav.jsx';
import DriverHero from './components/DriverHero.jsx';
import DriverSpecs from './components/DriverSpecs.jsx';
import DriverCapabilities from './components/DriverCapabilities.jsx';
import DriverConsole from './components/DriverConsole.jsx';
import DriverAi from './components/DriverAi.jsx';
import DriverCta from './components/DriverCta.jsx';
import Footer from './components/Footer.jsx';

// GNB Edge — Driver Management page (v2). Real JSX components under ./components;
// tokens + keyframes in driver-management-v2.css, scoped to .gnb-edge-v2.
const DriverManagementV2 = () => {
  return (
    <GnbPage>
      <ProgressBar />
      <MegaNav />
      <DriverHero />
      <DriverSpecs />
      <DriverCapabilities />
      <DriverConsole />
      <DriverAi />
      <DriverCta />
      <Footer />
    </GnbPage>
  );
};

export default DriverManagementV2;
