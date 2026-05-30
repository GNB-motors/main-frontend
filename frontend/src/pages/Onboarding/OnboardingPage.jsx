import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './OnboardingPage.css';
import './OnboardingPageExtended.css';
import UkoLogo from '../../assets/uko-logo.png';
import StepInstallExtension from './components/StepInstallExtension.jsx';
import StepConnectFleet from './components/StepConnectFleet.jsx';
import StepProfile from './components/StepProfile.jsx';
import StepCompanyTheme from './components/StepCompanyTheme.jsx';
import StepFinish from './components/StepFinish.jsx';
import LaunchAnimation from './components/LaunchAnimation.jsx';
import { OnboardingService } from './OnboardingService.jsx';
import { clearAuthData } from '../../utils/authUtils';

const STEPS = [
    { number: 1, title: 'Profile',           short: 'Profile'           },
    { number: 2, title: 'Company',           short: 'Company'           },
    { number: 3, title: 'Install Extension', short: 'Install Extension' },
    { number: 4, title: 'Connect Fleet',     short: 'Connect Fleet'     },
    { number: 5, title: 'Finish',            short: 'Finish'            },
];

const OnboardingPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [showLaunch, setShowLaunch] = useState(false);
    const [formData, setFormData] = useState({ profile: {}, company: {} });

    // ── Auth guard ────────────────────────────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            toast.error('Session expired. Please login again.');
            clearAuthData();
            navigate('/login');
            return;
        }
        const onboardingCompleted = localStorage.getItem('onboardingCompleted');
        if (onboardingCompleted === 'true') {
            navigate('/overview');
        }
    }, [navigate]);

    // ── Persist step across refreshes within same session ────────────────────
    useEffect(() => {
        const saved = sessionStorage.getItem('onboardingStep');
        if (saved) setCurrentStep(parseInt(saved, 10));
    }, []);

    useEffect(() => {
        sessionStorage.setItem('onboardingStep', currentStep.toString());
    }, [currentStep]);

    // ── Data change handler (steps 3 & 4 still use it) ───────────────────────
    const handleDataChange = (stepName) => (data) => {
        setFormData(prev => ({ ...prev, [stepName]: data }));
    };

    // ── Navigation ────────────────────────────────────────────────────────────
    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(s => s + 1);
        } else {
            submitOnboarding();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(s => s - 1);
    };

    // Allow clicking a completed step to jump back to it
    const handleStepClick = (stepNum) => {
        if (stepNum < currentStep) setCurrentStep(stepNum);
    };

    // ── Final submission — identical logic to original, just moved here ───────
    const submitOnboarding = async () => {
        try {
            const token = localStorage.getItem('authToken');
            const orgId = localStorage.getItem('user_orgId');
            const profileRaw = sessionStorage.getItem('onboardingProfile');
            const companyRaw = sessionStorage.getItem('onboardingCompany');
            const profile = profileRaw ? JSON.parse(profileRaw) : {};
            const company = companyRaw ? JSON.parse(companyRaw) : {};

            const onboardingData = {
                firstName:         profile.firstName  || localStorage.getItem('user_firstName'),
                lastName:          profile.lastName   || localStorage.getItem('user_lastName'),
                companyName:       company.companyName,
                gstin:             company.gstin,
                primaryThemeColor: company.selectedColor || company.primaryThemeColor,
            };

            await OnboardingService.completeOnboarding(onboardingData, token, orgId);

            localStorage.setItem('onboardingCompleted', 'true');
            if (onboardingData.primaryThemeColor) {
                localStorage.setItem('primaryThemeColor', onboardingData.primaryThemeColor);
                window.dispatchEvent(new CustomEvent('themeColorChange'));
            }
            setShowLaunch(true);
        } catch (err) {
            try { toast.error('Failed to complete onboarding. Please try again.'); } catch (_) {}
        }
    };

    if (showLaunch) return <LaunchAnimation />;

    return (
        <div className="ob-page">
            {/* ── Top bar ─────────────────────────────────────────────────── */}
            <header className="ob-topbar">
                <div className="ob-topbar-brand">
                    <img src={UkoLogo} alt="Logo" className="ob-topbar-logo" />
                    <span className="ob-topbar-name">GNB <span className="ob-topbar-edge">Edge</span></span>
                </div>
                <div className="ob-topbar-avatar">
                    {(() => {
                        const fn = localStorage.getItem('user_firstName') || '';
                        const ln = localStorage.getItem('user_lastName')  || '';
                        // Show first initial of first name + first initial of last name
                        // Falls back to single "U" if neither is available
                        const initials = (fn[0] || '') + (ln[0] || '');
                        return initials.toUpperCase() || 'U';
                    })()}
                </div>
            </header>

            {/* ── Main content ────────────────────────────────────────────── */}
            <main className="ob-main">
                {/* Heading */}
                <div className="ob-heading">
                    <h1 className="ob-heading-title">Your Setup Progress</h1>
                    <p className="ob-heading-sub">{getSubtitle(currentStep)}</p>
                </div>

                {/* Step indicator */}
                <div className="ob-stepper">
                    {STEPS.map((step, idx) => {
                        const done    = currentStep > step.number;
                        const active  = currentStep === step.number;
                        const isLast  = idx === STEPS.length - 1;
                        return (
                            <React.Fragment key={step.number}>
                                <div
                                    className={`ob-step ${active ? 'ob-step--active' : ''} ${done ? 'ob-step--done' : ''}`}
                                    onClick={() => handleStepClick(step.number)}
                                    style={{ cursor: done ? 'pointer' : 'default' }}
                                >
                                    <div className="ob-step-circle">
                                        {done ? (
                                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                                <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        ) : (
                                            <span>{step.number}</span>
                                        )}
                                    </div>
                                    <span className="ob-step-label">{step.short}</span>
                                </div>
                                {!isLast && (
                                    <div className={`ob-step-line ${done ? 'ob-step-line--done' : ''}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* Card */}
                <div className="ob-card">
                    {currentStep === 1 && (
                        <StepProfile
                            onNext={handleNext}
                            onBack={handleBack}
                            onDataChange={handleDataChange('profile')}
                            formData={formData.profile}
                        />
                    )}
                    {currentStep === 2 && (
                        <StepCompanyTheme
                            onNext={handleNext}
                            onBack={handleBack}
                            onDataChange={handleDataChange('company')}
                            formData={formData.company}
                        />
                    )}
                    {currentStep === 3 && (
                        <StepInstallExtension onNext={handleNext} onBack={handleBack} />
                    )}
                    {currentStep === 4 && (
                        <StepConnectFleet onNext={handleNext} onBack={handleBack} />
                    )}
                    {currentStep === 5 && (
                        <StepFinish onFinish={submitOnboarding} onBack={handleBack} />
                    )}
                </div>
            </main>
        </div>
    );
};

function getSubtitle(step) {
    const map = {
        1: 'Review your profile details',
        2: 'Set up your company and pick a brand colour',
        3: 'Install the GNB Edge extension to unlock live data',
        4: 'Connect your FleetEdge account to pull live data',
        5: "You're all set — let's go",
    };
    return map[step] || '';
}

export default OnboardingPage;