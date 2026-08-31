import './enterprise-v2.css';
import GnbPage from '../GnbPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import MegaNav from '../components/MegaNav.jsx';
import CustomerHero from './components/CustomerHero.jsx';
import CustomerArchitecture from './components/CustomerArchitecture.jsx';
import CustomerProof from './components/CustomerProof.jsx';
import CustomerMetrics from './components/CustomerMetrics.jsx';
import CustomerSteps from './components/CustomerSteps.jsx';
import EnterpriseAi from './components/EnterpriseAi.jsx';
import CustomerCta from './components/CustomerCta.jsx';
import Footer from './components/Footer.jsx';

// GNB Edge — Enterprise page (v2).
const EnterpriseV2 = () => {
  return (
    <GnbPage>
      <ProgressBar />
      <MegaNav />
      <CustomerHero />
      <CustomerArchitecture />
      <CustomerProof />
      <CustomerMetrics />
      <CustomerSteps />
      <EnterpriseAi />
      <CustomerCta />
      <Footer />
    </GnbPage>
  );
};

export default EnterpriseV2;
