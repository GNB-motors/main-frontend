import './single-owners-v2.css';
import GnbPage from '../GnbPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import MegaNav from '../components/MegaNav.jsx';
import CustomerHero from './components/CustomerHero.jsx';
import CustomerArchitecture from './components/CustomerArchitecture.jsx';
import CustomerProof from './components/CustomerProof.jsx';
import CustomerMetrics from './components/CustomerMetrics.jsx';
import CustomerSteps from './components/CustomerSteps.jsx';
import OwnerAi from './components/OwnerAi.jsx';
import CustomerCta from './components/CustomerCta.jsx';
import Footer from './components/Footer.jsx';

// GNB Edge — Single Owners page (v2). Real JSX components under ./components;
// tokens + keyframes in single-owners-v2.css, scoped to .gnb-edge-v2.
const SingleOwnersV2 = () => {
  return (
    <GnbPage>
      <ProgressBar />
      <MegaNav />
      <CustomerHero />
      <CustomerArchitecture />
      <CustomerProof />
      <CustomerMetrics />
      <CustomerSteps />
      <OwnerAi />
      <CustomerCta />
      <Footer />
    </GnbPage>
  );
};

export default SingleOwnersV2;
