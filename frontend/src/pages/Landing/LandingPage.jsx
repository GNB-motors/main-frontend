import { useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import EcosystemSection from './components/EcosystemSection';
import SolutionsSection from './components/SolutionsSection';
import InnovationSection from './components/InnovationSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';

const LandingPage = () => {
    const navigate = useNavigate();
    const handleLoginClick = () => navigate('/login');

    return (
        <div className="font-[Inter,sans-serif] text-[#0F172A] bg-[#FDFDFD] text-left">
            <Navbar onLoginClick={handleLoginClick} />
            <main>
                <HeroSection />
                <EcosystemSection />
                <SolutionsSection />
                <InnovationSection />
                <ContactSection />
            </main>
            <Footer onLoginClick={handleLoginClick} />
        </div>
    );
};

export default LandingPage;
