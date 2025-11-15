import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingPage.css';
import './OnboardingPageExtended.css';
import UkoLogo from '../../assets/uko-logo.png';
import StepProfile from './components/StepProfile.jsx';
import StepCompanyTheme from './components/StepCompanyTheme.jsx';
import StepVehicles from './components/StepVehicles.jsx';
import LaunchAnimation from './components/LaunchAnimation.jsx';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [showLaunch, setShowLaunch] = useState(false);
    
    // Form data state
    const [formData, setFormData] = useState({
        profile: {},
        company: {},
        vehicles: {}
    });

    // Track completion percentage for progress bar
    const [stepCompletion, setStepCompletion] = useState({
        1: 0,
        2: 0,
        3: 0
    });

    // Load saved progress from localStorage
    useEffect(() => {
        const savedStep = localStorage.getItem('onboardingStep');
        if (savedStep) {
            setCurrentStep(parseInt(savedStep, 10));
        }
    }, []);

    // Save current step to localStorage
    useEffect(() => {
        localStorage.setItem('onboardingStep', currentStep.toString());
    }, [currentStep]);

    const handleDataChange = (stepName) => (data) => {
        setFormData(prev => ({
            ...prev,
            [stepName]: data
        }));

        // Calculate completion percentage based on filled fields
        let completion = 0;
        if (stepName === 'profile') {
            const { firstName, lastName, phone } = data;
            const fields = [firstName, lastName, phone];
            completion = (fields.filter(f => f && f.trim()).length / fields.length) * 100;
        } else if (stepName === 'company') {
            const { companyName, selectedColor } = data;
            completion = ((companyName?.trim() ? 50 : 0) + (selectedColor ? 50 : 0));
        } else if (stepName === 'vehicles') {
            const { vehicles } = data;
            if (vehicles && vehicles.length > 0) {
                const validVehicles = vehicles.filter(v => v.registration_no?.trim() && v.vehicle_type?.trim());
                completion = validVehicles.length > 0 ? 100 : 0;
            }
        }

        setStepCompletion(prev => ({
            ...prev,
            [currentStep]: completion
        }));
    };

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        } else {
            // Final step - show launch animation
            setShowLaunch(true);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const steps = [
        { number: 1, title: 'Profile', description: 'Review your details' },
        { number: 2, title: 'Company', description: 'Setup & theme' },
        { number: 3, title: 'Vehicles', description: 'Add your fleet' }
    ];

    if (showLaunch) {
        return <LaunchAnimation />;
    }

    return (
        <div className="onboarding-container">
            <div className="onboarding-wrapper">
                {/* Header with logo */}
                <div className="onboarding-brand">
                    <img src={UkoLogo} alt="Logo" className="onboarding-logo" />
                    <h1 className="onboarding-main-title">Welcome to Your Fleet Management System</h1>
                    <p className="onboarding-main-subtitle">Let's get you set up in just 3 simple steps</p>
                </div>

                {/* Stepper */}
                <div className="stepper-container">
                    {steps.map((step, index) => (
                        <React.Fragment key={step.number}>
                            <div 
                                className={`stepper-item ${currentStep === step.number ? 'active' : ''} ${currentStep > step.number ? 'completed' : ''}`}
                            >
                                <div className="stepper-circle">
                                    {currentStep > step.number ? (
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                                            <path d="M6 11L3 8L4.4 6.6L6 8.2L11.6 2.6L13 4L6 11Z" />
                                        </svg>
                                    ) : (
                                        <span>{step.number}</span>
                                    )}
                                </div>
                                <div className="stepper-content">
                                    <div className="stepper-title">{step.title}</div>
                                    <div className="stepper-description">{step.description}</div>
                                </div>
                            </div>
                            {step.number < 3 && (
                                <div className="stepper-line-wrapper">
                                    <div className="stepper-line-bg"></div>
                                    <div 
                                        className="stepper-line-progress"
                                        style={{
                                            width: currentStep > step.number 
                                                ? '100%' 
                                                : currentStep === step.number 
                                                    ? `${stepCompletion[step.number] || 0}%`
                                                    : '0%'
                                        }}
                                    ></div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Step Content Card */}
                <div className="onboarding-card">
                    {currentStep === 1 && (
                        <StepProfile 
                            onNext={handleNext}
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
                        <StepVehicles 
                            onNext={handleNext}
                            onBack={handleBack}
                            onDataChange={handleDataChange('vehicles')}
                            formData={formData.vehicles}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;