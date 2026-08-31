import './contact-v2.css';
import GnbPage from '../GnbPage.jsx';
import ProgressBar from './components/ProgressBar.jsx';
import MegaNav from '../components/MegaNav.jsx';
import ContactHero from './components/ContactHero.jsx';
import ContactForm from './components/ContactForm.jsx';
import ContactNextSteps from './components/ContactNextSteps.jsx';
import Footer from './components/Footer.jsx';

// GNB Edge — Contact page (v2).
const ContactV2 = () => {
  return (
    <GnbPage>
      <ProgressBar />
      <MegaNav />
      <ContactHero />
      <ContactForm />
      <ContactNextSteps />
      <Footer />
    </GnbPage>
  );
};

export default ContactV2;
