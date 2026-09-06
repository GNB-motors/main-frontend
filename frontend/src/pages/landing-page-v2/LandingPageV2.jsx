import './landing-v2.css';
import GnbPage from './GnbPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import MegaNav from './components/MegaNav.jsx';
import Hero from './components/Hero.jsx';
import OnePlatform from './components/OnePlatform.jsx';
import TwoSurfaces from './components/TwoSurfaces.jsx';
import MultiLocation from './components/MultiLocation.jsx';
import Compliance from './components/Compliance.jsx';
import FuelMonitoring from './components/FuelMonitoring.jsx';
import Capabilities from './components/Capabilities.jsx';
import AiLayer from './components/AiLayer.jsx';
import Metrics from './components/Metrics.jsx';
import Segments from './components/Segments.jsx';
import Testimonials from './components/Testimonials.jsx';
import Faq from './components/Faq.jsx';
import ClosingCta from './components/ClosingCta.jsx';
import Footer from './components/Footer.jsx';

// GNB Edge — Landing page (v2). Each section is a real React component under
// ./components. Runtime interactions (darkzone flip, count-up, scroll-reveal)
// come from the shared <GnbPage> wrapper.
const LandingPageV2 = () => {
  return (
    <GnbPage>
      <ProgressBar />
      <MegaNav />
      <Hero />
      <OnePlatform />
      <TwoSurfaces />
      <MultiLocation />
      <Compliance />
      <FuelMonitoring />
      <Capabilities />
      <AiLayer />
      <Metrics />
      <Segments />
      <Testimonials />
      <Faq />
      <ClosingCta />
      <Footer />
    </GnbPage>
  );
};

export default LandingPageV2;
