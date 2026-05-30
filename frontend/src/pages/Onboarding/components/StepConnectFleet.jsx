import React, { useState } from 'react';

/**
 * StepConnectFleet — Step 4 of onboarding
 * Walks the user through connecting their Tata FleetEdge account
 * to the GNB Edge extension so live data syncs into the dashboard.
 * Purely informational — no API call made here.
 */

/* ── SVG Visual Mockups ──────────────────────────────────────────────────── */

/** Visual: Chrome toolbar with the extension icon highlighted */
const ToolbarVisual = () => (
    <div className="ob-cf-visual">
        <div className="ob-cf-toolbar-demo">
            {/* Address bar row */}
            <div className="ob-cf-toolbar-bar">
                <div className="ob-cf-url-pill">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <circle cx="4.5" cy="4.5" r="3.5" stroke="#9CA3AF" strokeWidth="1"/>
                        <path d="M7.5 7.5L9 9" stroke="#9CA3AF" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                    <span>app.gnbmotors.com</span>
                </div>
                {/* Toolbar icons */}
                <div className="ob-cf-toolbar-icons">
                    <div className="ob-cf-toolbar-icon">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10.5 2L14 5.5L9 7L7 9L5.5 14L2 10.5L7 5L10.5 2Z" stroke="#9CA3AF" strokeWidth="1.1" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    {/* GNB Edge icon — highlighted with pulse ring */}
                    <div className="ob-cf-toolbar-icon ob-cf-toolbar-icon--active">
                        <div className="ob-cf-ext-pulse" />
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <rect width="18" height="18" rx="4" fill="#0F172A"/>
                            <path d="M4.5 9L7.5 12L13.5 5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>
            <p className="ob-cf-visual-caption">Click the GNB Edge icon <span className="ob-cf-highlight">↑ here</span> in your toolbar</p>
        </div>
    </div>
);

/** Visual: GNB Edge popup login form */
const GNBLoginVisual = () => (
    <div className="ob-cf-visual">
        <div className="ob-cf-popup">
            <div className="ob-cf-popup-header">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect width="16" height="16" rx="3" fill="#0F172A"/>
                    <path d="M4 8L6.5 10.5L12 5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="ob-cf-popup-title">GNB Edge</span>
            </div>
            <div className="ob-cf-popup-body">
                <p className="ob-cf-popup-label">EMAIL</p>
                <div className="ob-cf-popup-input">user@gnbmotors.com</div>
                <p className="ob-cf-popup-label">PASSWORD</p>
                <div className="ob-cf-popup-input ob-cf-popup-input--pwd">••••••••••</div>
                <div className="ob-cf-popup-btn">Log in to GNB Edge</div>
            </div>
        </div>
        <p className="ob-cf-visual-caption">Log in with your <strong>GNB Motors</strong> account</p>
    </div>
);

/** Visual: Tata FleetEdge login form inside the extension */
const FleetEdgeLoginVisual = () => (
    <div className="ob-cf-visual">
        <div className="ob-cf-popup">
            <div className="ob-cf-popup-header ob-cf-popup-header--fe">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect width="14" height="14" rx="3" fill="#1d4ed8"/>
                    <path d="M2 7H12M7 2L12 7L7 12" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="ob-cf-popup-title">Tata FleetEdge</span>
            </div>
            <div className="ob-cf-popup-body">
                <p className="ob-cf-popup-label">USERNAME / MOBILE</p>
                <div className="ob-cf-popup-input">your_fleet_id</div>
                <p className="ob-cf-popup-label">PASSWORD</p>
                <div className="ob-cf-popup-input ob-cf-popup-input--pwd">••••••••</div>
                <div className="ob-cf-popup-btn ob-cf-popup-btn--blue">Log in to FleetEdge</div>
            </div>
        </div>
        <p className="ob-cf-visual-caption">Enter your <strong>Tata FleetEdge</strong> credentials</p>
    </div>
);

/** Visual: FleetEdge connected success state */
const ConnectFleetEdgeVisual = () => (
    <div className="ob-cf-visual">
        <div className="ob-cf-popup ob-cf-popup--auth">
            <div className="ob-cf-auth-icon">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="13" fill="#F0FDF4" stroke="#BBF7D0" strokeWidth="1"/>
                    <path d="M8 14L12 18L20 10" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            <p className="ob-cf-auth-title">FleetEdge connected!</p>
            <p className="ob-cf-auth-sub">Live trip &amp; fuel data is now syncing to your dashboard</p>
            <div className="ob-cf-auth-buttons">
                <div className="ob-cf-auth-allow" style={{ width: '100%', justifyContent: 'center' }}>Connected ✓</div>
            </div>
        </div>
        <p className="ob-cf-visual-caption">Your fleet data is now <strong>live</strong></p>
    </div>
);

/* ── Step definitions ───────────────────────────────────────────────────── */
const STEPS_GUIDE = [
    {
        number: 1,
        icon: (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect width="22" height="22" rx="6" fill="#F0F9FF"/>
                <path d="M10.5 2L14 5.5L9 7L7 9L5.5 14L2 10.5L7 5L10.5 2Z" stroke="#0284C7" strokeWidth="1.2" strokeLinejoin="round"/>
                <circle cx="16" cy="16" r="3" fill="#0F172A"/>
                <path d="M15 16L17 16M16 15L16 17" stroke="white" strokeWidth="1" strokeLinecap="round"/>
            </svg>
        ),
        title: 'Find & open the GNB Edge extension',
        desc: 'After installing the extension from the Chrome Web Store, look for the puzzle-piece icon (🧩) in the top-right corner of Chrome. Click it to see all extensions, then click the pin icon next to "GNB Edge" to pin it to your toolbar. Now click the GNB Edge icon in the toolbar to open it.',
        visual: <ToolbarVisual />,
    },
    {
        number: 2,
        icon: (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect width="22" height="22" rx="6" fill="#F0FDF4"/>
                <rect x="6" y="9" width="10" height="7" rx="1.5" stroke="#059669" strokeWidth="1.4"/>
                <path d="M9 9V7.5C9 6.12 9.9 5 11 5C12.1 5 13 6.12 13 7.5V9" stroke="#059669" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
        ),
        title: 'Log in to GNB Edge',
        desc: 'Inside the extension popup, log in with the same GNB Motors account credentials you use to log in to this dashboard (your email and password).',
        visual: <GNBLoginVisual />,
    },
    {
        number: 3,
        icon: (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect width="22" height="22" rx="6" fill="#EFF6FF"/>
                <rect x="5" y="8" width="12" height="8" rx="1.5" stroke="#2563EB" strokeWidth="1.3"/>
                <path d="M8 8V6.5C8 5.12 9.12 4 10.5 4H11.5C12.88 4 14 5.12 14 6.5V8" stroke="#2563EB" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="11" cy="12" r="1" fill="#2563EB"/>
            </svg>
        ),
        title: 'Log in to Tata FleetEdge',
        desc: 'After logging in to GNB Edge, the extension will prompt you to connect your FleetEdge account. Enter your Tata FleetEdge username/mobile number and password here. This is your FleetEdge portal login — not your GNB Motors login.',
        visual: <FleetEdgeLoginVisual />,
    },
    {
        number: 4,
        icon: (
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect width="22" height="22" rx="6" fill="#F5F3FF"/>
                <path d="M7 11C7 8.79 8.79 7 11 7C13.21 7 15 8.79 15 11" stroke="#7C3AED" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="11" cy="14" r="1.5" fill="#7C3AED"/>
                <path d="M11 12.5V11" stroke="#7C3AED" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
        ),
        title: 'Connect with FleetEdge',
        desc: 'Once logged in to both GNB Edge and Tata FleetEdge, the extension will automatically link the two accounts and begin syncing your live trip, fuel, and odometer data to your GNB Motors dashboard. You\'re all set!',
        visual: <ConnectFleetEdgeVisual />,
    },
];

/* ── Component ──────────────────────────────────────────────────────────── */
const StepConnectFleet = ({ onNext, onBack }) => {
    const [expanded, setExpanded] = useState(null);

    const toggle = (num) =>
        setExpanded(prev => (prev === num ? null : num));

    return (
        <div className="ob-step-body">
            <div className="ob-step-header">
                <h2>Connect your FleetEdge account</h2>
                <p>
                    The GNB Edge extension pulls live data from Tata FleetEdge and
                    surfaces it in your dashboard. Follow the steps below inside the extension.
                </p>
            </div>

            <div className="ob-guide-list">
                {STEPS_GUIDE.map((item) => (
                    <div
                        key={item.number}
                        className={`ob-guide-item ${expanded === item.number ? 'ob-guide-item--open' : ''}`}
                        onClick={() => toggle(item.number)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && toggle(item.number)}
                        aria-expanded={expanded === item.number}
                    >
                        {/* Step number badge + title + chevron */}
                        <div className="ob-guide-item-top">
                            <div className="ob-guide-step-badge">{item.number}</div>
                            <div className="ob-guide-item-icon">{item.icon}</div>
                            <div className="ob-guide-item-title">{item.title}</div>
                            <svg
                                className={`ob-guide-chevron ${expanded === item.number ? 'ob-guide-chevron--open' : ''}`}
                                width="14" height="14" viewBox="0 0 14 14" fill="none"
                            >
                                <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>

                        {/* Expanded content: description + visual */}
                        {expanded === item.number && (
                            <div className="ob-guide-item-body">
                                <p className="ob-guide-item-desc">{item.desc}</p>
                                {item.visual}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="ob-notice ob-notice--blue">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" fill="#DBEAFE"/>
                    <path d="M8 7V11M8 5H8.01" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>
                    You can skip this step and connect later from{' '}
                    <strong>Settings → FleetEdge Accounts</strong>.
                </span>
            </div>

            <div className="ob-step-footer">
                <button type="button" className="ob-btn ob-btn--ghost ob-btn--back" onClick={onBack}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Back
                </button>
                <button type="button" className="ob-btn ob-btn--dark" onClick={onNext}>
                    Continue
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default StepConnectFleet;