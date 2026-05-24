import React, { useState } from 'react';

/**
 * StepFinish
 * Step 5 — success screen. Shows a summary of what was configured and
 * gives the user a "Launch Dashboard" CTA to complete onboarding.
 */
const StepFinish = ({ onFinish, onBack }) => {
    const [isLaunching, setIsLaunching] = useState(false);

    const firstName = localStorage.getItem('user_firstName') || '';
    const companyRaw = sessionStorage.getItem('onboardingCompany');
    const company = companyRaw ? JSON.parse(companyRaw) : {};
    const companyName = company.companyName || 'your company';
    const themeColor = company.selectedColor || '#1e293b';

    const handleLaunch = async () => {
        setIsLaunching(true);
        await onFinish();
    };

    const SUMMARY = [
        { icon: '👤', label: 'Profile', value: firstName ? `Confirmed as ${firstName}` : 'Confirmed' },
        { icon: '🏢', label: 'Company', value: companyName },
        { icon: '🎨', label: 'Theme', value: themeColor },
        { icon: '🔌', label: 'Extension', value: 'GNB Edge ready to sync' },
    ];

    return (
        <div className="ob-step-body ob-finish">
            {/* Rocket icon */}
            <div className="ob-finish-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4C16 4 22 8 22 16C22 20 20 23.5 17 25.5L15.5 22.5C17.5 21 19 18.5 19 16C19 10.5 16 7 16 7V4Z" fill="white" fillOpacity="0.9" />
                    <path d="M16 4C16 4 10 8 10 16C10 20 12 23.5 15 25.5L16.5 22.5C14.5 21 13 18.5 13 16C13 10.5 16 7 16 7V4Z" fill="white" fillOpacity="0.6" />
                    <circle cx="16" cy="16" r="2.5" fill="white" />
                    <path d="M12.5 27L10 30L13.5 28.5L12.5 27Z" fill="#F59E0B" />
                    <path d="M19.5 27L22 30L18.5 28.5L19.5 27Z" fill="#F59E0B" />
                </svg>
            </div>

            <div className="ob-finish-text">
                <h2>You're all set{firstName ? `, ${firstName}` : ''}!</h2>
                <p>GNB Edge is ready. Launch your dashboard to start exploring fleet insights.</p>
            </div>

            {/* Summary cards */}
            <div className="ob-finish-summary">
                {SUMMARY.map(item => (
                    <div key={item.label} className="ob-finish-card">
                        <span className="ob-finish-card-icon">{item.icon}</span>
                        <div className="ob-finish-card-body">
                            <span className="ob-finish-card-label">{item.label}</span>
                            <span className="ob-finish-card-value">
                                {item.label === 'Theme' ? (
                                    <span className="ob-finish-swatch-row">
                                        <span
                                            className="ob-finish-swatch"
                                            style={{ backgroundColor: item.value }}
                                        />
                                        {item.value}
                                    </span>
                                ) : item.value}
                            </span>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="7" cy="7" r="6.5" fill="#D1FAE5" />
                            <path d="M4.5 7L6 8.5L9.5 5" stroke="#059669" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="ob-step-footer">
                <button type="button" className="ob-btn ob-btn--ghost ob-btn--back" onClick={onBack} disabled={isLaunching}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back
                </button>
                <button
                    type="button"
                    className="ob-btn ob-btn--dark ob-btn--launch"
                    onClick={handleLaunch}
                    disabled={isLaunching}
                >
                    {isLaunching ? (
                        <>
                            <span className="ob-btn-spinner ob-btn-spinner--light" />
                            Launching…
                        </>
                    ) : (
                        <>
                            Launch Dashboard
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default StepFinish;