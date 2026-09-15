import './fuel-and-mileage-v2.css';
import GnbPage from '../GnbPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import MegaNav from '../components/MegaNav.jsx';
import FuelHero from './components/FuelHero.jsx';
import FuelSpecs from './components/FuelSpecs.jsx';
import FuelCapabilities from './components/FuelCapabilities.jsx';
import FuelConsole from './components/FuelConsole.jsx';
import FuelVerification from './components/FuelVerification.jsx';
import FuelAi from './components/FuelAi.jsx';
import FuelCta from './components/FuelCta.jsx';
import Footer from './components/Footer.jsx';

// GNB Edge — Fuel and Mileage page (v2). Real JSX components under ./components;
// tokens + keyframes in fuel-and-mileage-v2.css, scoped to .gnb-edge-v2.
const FuelAndMileageV2 = () => {
  return (
    <GnbPage>
      <ProgressBar />
      <MegaNav />
      <FuelHero />
      <FuelSpecs />
      <FuelCapabilities />
      <FuelConsole />
      <FuelVerification />
      <FuelAi />
      <FuelCta />
      <Footer />
    </GnbPage>
  );
};

export default FuelAndMileageV2;
