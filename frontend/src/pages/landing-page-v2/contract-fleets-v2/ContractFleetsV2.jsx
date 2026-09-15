import './contract-fleets-v2.css';
import GnbPage from '../GnbPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import MegaNav from '../components/MegaNav.jsx';
import CustomerHero from './components/CustomerHero.jsx';
import CustomerArchitecture from './components/CustomerArchitecture.jsx';
import CustomerProof from './components/CustomerProof.jsx';
import CustomerMetrics from './components/CustomerMetrics.jsx';
import CustomerSteps from './components/CustomerSteps.jsx';
import ContractAi from './components/ContractAi.jsx';
import CustomerCta from './components/CustomerCta.jsx';
import Footer from './components/Footer.jsx';

// GNB Edge — Contract Fleets page (v2).
const ContractFleetsV2 = () => {
  return (
    <GnbPage>
      <ProgressBar />
      <MegaNav />
      <CustomerHero />
      <CustomerArchitecture />
      <CustomerProof />
      <CustomerMetrics />
      <CustomerSteps />
      <ContractAi />
      <CustomerCta />
      <Footer />
    </GnbPage>
  );
};

export default ContractFleetsV2;
