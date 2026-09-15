import './about-v2.css';
import GnbPage from '../GnbPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import MegaNav from '../components/MegaNav.jsx';
import AboutHero from './components/AboutHero.jsx';
import AboutStory from './components/AboutStory.jsx';
import AboutMetrics from './components/AboutMetrics.jsx';
import AboutPrinciples from './components/AboutPrinciples.jsx';
import AboutHowWeWork from './components/AboutHowWeWork.jsx';
import AboutOffices from './components/AboutOffices.jsx';
import AboutCta from './components/AboutCta.jsx';
import Footer from './components/Footer.jsx';

// GNB Edge — About page (v2).
const AboutV2 = () => {
  return (
    <GnbPage>
      <ProgressBar />
      <MegaNav />
      <AboutHero />
      <AboutStory />
      <AboutMetrics />
      <AboutPrinciples />
      <AboutHowWeWork />
      <AboutOffices />
      <AboutCta />
      <Footer />
    </GnbPage>
  );
};

export default AboutV2;
