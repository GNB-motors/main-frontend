import { useNavigate } from 'react-router-dom';
import ukoLogo from '../../assets/uko-logo.png';
import bg1234 from '../../assets/1234.png';
import './LandingPage.css';

const LandingPage = () => {
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <div className="lp-body">
            <div className="lp-top-bar">
                <div className="lp-container lp-top-bar-content">
                    <div className="lp-logo-section">
                        <img src={ukoLogo} alt="Logo" className="lp-logo-img" />
                        <span className="lp-logo-text">GNB Edge</span>
                    </div>
                    <div className="lp-top-bar-right">
                        <div className="lp-advisory-text">
                            <p className="lp-advisory-subtitle">Executive Advisory</p>
                            <p className="lp-advisory-title">Strategic Oversight</p>
                        </div>
                        <button className="lp-contact-partner-btn">
                            Contact Partner
                        </button>
                    </div>
                </div>
            </div>

            <header className="lp-main-header">
                <div className="lp-container lp-header-content">
                    <nav className="lp-main-nav">
                        <a href="#ecosystem">Ecosystem</a>
                        <a href="#solutions">Strategic Value</a>
                        <a href="#innovation">Architecture</a>
                    </nav>
                    <div className="lp-header-actions">
                        <button className="lp-portal-login-btn" onClick={handleLoginClick}>Portal Login</button>
                        <button className="lp-request-briefing-btn">Request Briefing</button>
                    </div>
                </div>
            </header>

            <main className="lp-main">
                <section className="lp-hero-section">
                    <div className="lp-hero-bg">
                        <img
                            alt="Refined executives collaborating in a glass-walled office"
                            src={bg1234}
                        />
                        <div className="lp-hero-overlay"></div>
                    </div>
                    <div className="lp-container lp-hero-content-wrapper">
                        <div className="lp-hero-content">
                            <p className="lp-hero-subtitle">The Future of Fleet Intelligence</p>
                            <h1 className="lp-hero-title">
                                An Integrated <br />
                                <span>Executive Ecosystem</span>
                            </h1>
                            <p className="lp-hero-desc">
                                Transcend traditional logistics with a unified architecture designed for absolute clarity. From automated telemetry to AI-driven document processing, FleetEdge delivers a single source of truth for the modern enterprise.
                            </p>
                            <div className="lp-hero-buttons">
                                <button className="lp-experience-btn">Experience the Vision</button>
                                <button className="lp-whitepaper-btn">Technical Whitepaper</button>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="ecosystem" className="lp-ecosystem-section">
                    <div className="lp-diagram-connector"></div>
                    <div className="lp-container lp-ecosystem-content">
                        <div className="lp-ecosystem-header">
                            <span className="lp-section-subtitle">Unified Architecture</span>
                            <h2 className="lp-section-title">The Seamless Ecosystem</h2>
                            <p className="lp-section-desc">Four mission-critical components, one cohesive intelligence network.</p>
                            <div className="lp-section-divider"></div>
                        </div>
                        <div className="lp-ecosystem-grid">
                            <div className="lp-ecosystem-diagram">
                                <div className="lp-blur-gradient"></div>
                                <div className="lp-diagram-center">
                                    <div className="lp-diagram-decorator"></div>
                                    <span className="material-symbols-outlined lp-diagram-icon">terminal</span>
                                    <h4>Core Engine</h4>
                                    <p>Node.js / Python gRPC</p>
                                </div>
                                <div className="lp-diagram-node lp-node-tr">
                                    <span className="material-symbols-outlined">dashboard</span>
                                    <h5>Executive UI</h5>
                                    <p>Real-time Visualization</p>
                                </div>
                                <div className="lp-diagram-node lp-node-bl">
                                    <span className="material-symbols-outlined">extension</span>
                                    <h5>Telemetry Plugin</h5>
                                    <p>Session-based Capture</p>
                                </div>
                                <div className="lp-diagram-node lp-node-cr">
                                    <span className="material-symbols-outlined">notifications_active</span>
                                    <h5>Alerting Bot</h5>
                                    <p>Discord Ops Hub</p>
                                </div>
                                <svg className="lp-diagram-svg" viewBox="0 0 400 400">
                                    <path d="M 200,200 L 320,50" fill="none" stroke="#4169E1" strokeDasharray="4" strokeWidth="1"></path>
                                    <path d="M 200,200 L 80,350" fill="none" stroke="#4169E1" strokeDasharray="4" strokeWidth="1"></path>
                                    <path d="M 200,200 L 350,200" fill="none" stroke="#4169E1" strokeDasharray="4" strokeWidth="1"></path>
                                </svg>
                            </div>
                            <div className="lp-ecosystem-features">
                                <div className="lp-feature-item">
                                    <h3>Intelligent Core (Backend)</h3>
                                    <p>Our Node.js backbone orchestrates a multi-service architecture, utilizing Python gRPC for high-performance OCR processing and MongoDB for immutable record keeping.</p>
                                </div>
                                <div className="lp-feature-item">
                                    <h3>The Command Center (Frontend)</h3>
                                    <p>A refined React-based interface designed for strategic oversight. It implements the "Single Submission Pattern," ensuring complex trip logs are verified and committed in a single atomic transaction.</p>
                                </div>
                                <div className="lp-feature-item">
                                    <h3>Silent Telemetry (Extension)</h3>
                                    <p>The FleetEdge Fuel Monitor bridge. A secure Chrome extension that passively captures vehicle telemetry every 5 minutes, automatically flagging fuel discrepancies against manual logs.</p>
                                </div>
                                <div className="lp-feature-item">
                                    <h3>Operational Pulse (Discord)</h3>
                                    <p>A dedicated webhook and bot system that keeps your operational leadership informed in real-time, delivering critical alerts and journey milestones directly to your preferred channels.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="solutions" className="lp-solutions-section">
                    <div className="lp-container">
                        <div className="lp-solutions-grid">
                            <div className="lp-solutions-text">
                                <div className="lp-editorial-line">
                                    <h2>Beyond <br />Logistics</h2>
                                </div>
                                <p className="lp-quote">
                                    "Technology is no longer a support function; it is the strategic differentiator of the global leader."
                                </p>
                                <p className="lp-solutions-desc">
                                    FleetEdge was architected by veterans of the industry to address the subtle inefficiencies that erode margin. Our partnership model ensures that your system scales with your ambition, providing the data fidelity required for board-level reporting and long-term planning.
                                </p>
                                <div className="lp-stats-grid">
                                    <div className="lp-stat-item">
                                        <span className="lp-stat-value-l">99.9%</span>
                                        <p className="lp-stat-label">Extraction Accuracy</p>
                                    </div>
                                    <div className="lp-stat-item">
                                        <span className="lp-stat-value-l">5-Min</span>
                                        <p className="lp-stat-label">Telemetry Sync</p>
                                    </div>
                                </div>
                            </div>
                            <div className="lp-solutions-image">
                                <div className="lp-image-wrapper">
                                    <img
                                        alt="Modern professional analyzing data trends"
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXkSWSk5CS4YwooL4MioXlUU1AmUJhDrFcfW85DXnWvBCguu0m33vyGJ0s2Edx1ZmAwgCJuQrGwTXqXu8xiWp8I2rs1azfvB7KUccBcStCM2UJLcTwfjF8DX2gqdW1NRgKkWp7haIlBQXJ2055RBDEjU23qWI_aivA5wbczTm1XjlmJoudfyOxz1x0_8Webf4xDM30BmEv-GnCzxCAU1nMApEXkVLOQWvCgpdbjoF15EwPATINlcRf5baGBj2abLHsf5ypT35R_yI"
                                    />
                                </div>
                                <div className="lp-image-backdrop"></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="innovation" className="lp-innovation-section">
                    <div className="lp-container">
                        <div className="lp-innovation-card">
                            <div className="lp-innovation-image">
                                <img
                                    alt="Sophisticated digital workspace"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbt7wNZJEAq9dFueIc4ZyL9-0Ubf9G820ErMDJpsvyrYHEjX8-buN5EWTWkrXhBsa555MaRzYVaSVFUKqgprLJ0-VugDMnzUvBrmjtaaku76D2IMqo4PfzgDXPoGER8uNhh-LNOyQbW11TGcLfg-H55zga69Ya8uzoGx27wy2EZLvfvD7rlBPg_PFLCEkyk3NA-iTsLGcuVjSpBogvlkeiT_Xyo87-s_bTIS9l6H3P8hEeh58atgyksJuenruQrIkDRcxEq7BmxGU"
                                />
                                <div className="lp-image-overlay"></div>
                            </div>
                            <div className="lp-innovation-content">
                                <span className="lp-innovation-subtitle">Technical Superiority</span>
                                <h2>Architected for <br />Absolute Integrity.</h2>
                                <div className="lp-innovation-features">
                                    <div className="lp-inv-feature">
                                        <div className="lp-inv-feature-header">
                                            <div className="lp-inv-line"></div>
                                            <span>The Atomic Pattern</span>
                                        </div>
                                        <p>"Our refactored Single Submission flow eliminates data fragmentation, ensuring every journey is an immutable, complete record from the moment of intake."</p>
                                    </div>
                                    <div className="lp-inv-feature">
                                        <div className="lp-inv-feature-header">
                                            <div className="lp-inv-line"></div>
                                            <span>AI Verification</span>
                                        </div>
                                        <p>"Python-based OCR microservices translate physical complexity into digital precision, allowing your staff to manage by exception rather than entry."</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="lp-contact-section">
                    <div className="lp-contact-bg-accent"></div>
                    <div className="lp-contact-container" style={{ top: '25px' }}>
                        <div className="lp-contact-header">
                            <span className="lp-contact-subtitle">Strategic Engagement</span>
                            <h2>Partner with <br />FleetEdge</h2>
                            <p className="lp-contact-desc">
                                Evolve your operational landscape. Request a private demonstration of the ecosystem with our executive consultation team.
                            </p>
                        </div>
                        <div className="lp-contact-card">
                            <form className="lp-contact-form">
                                <div className="lp-form-group">
                                    <label>Principal Name</label>
                                    <input placeholder="e.g. Sterling Archer" type="text" />
                                    <div className="lp-input-highlight"></div>
                                </div>
                                <div className="lp-form-group">
                                    <label>Enterprise Email</label>
                                    <input placeholder="name@corporation.com" type="email" />
                                    <div className="lp-input-highlight"></div>
                                </div>
                                <div className="lp-form-group lp-full-width">
                                    <label>Strategic Requirements</label>
                                    <textarea placeholder="Describe your operational scale and vision..."></textarea>
                                    <div className="lp-input-highlight"></div>
                                </div>
                                <div className="lp-form-submit lp-full-width">
                                    <button type="button" className="lp-submit-btn" onClick={(e) => e.preventDefault()}>
                                        SUBMIT
                                    </button>
                                    <div className="lp-sec-compliant">
                                        <span className="material-symbols-outlined lp-lock-icon">lock</span>
                                        <p>SEC Compliant & Confidential</p>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="lp-main-footer">
                <div className="lp-container">
                    <div className="lp-footer-top">
                        <div className="lp-footer-info">
                            <div className="lp-footer-logo">
                                <img src={ukoLogo} alt="Logo" className="lp-logo-img" />
                                <span className="lp-logo-text">FleetEdge</span>
                            </div>
                            <p className="lp-footer-desc">
                                The premier architectural standard for global logistics telemetry. We deliver the precision that leadership demands and the scalability that modern enterprise requires.
                            </p>
                            <div className="lp-footer-contacts">
                                <div className="lp-contact-item">
                                    <p className="lp-contact-label">Innovation Hub</p>
                                    <p className="lp-contact-val">Silicon Valley, CA</p>
                                </div>
                                <div className="lp-contact-item">
                                    <p className="lp-contact-label">Global Support</p>
                                    <p className="lp-contact-val">1-800-FLEET-AI</p>
                                </div>
                            </div>
                        </div>
                        <div className="lp-footer-card">
                            <div className="lp-card-bg-icon">
                                <span className="material-symbols-outlined">shield</span>
                            </div>
                            <p className="lp-card-title">Partner Access</p>
                            <div className="lp-card-links">
                                <button type="button" onClick={handleLoginClick} className="lp-card-link-btn">Executive Dashboard</button>
                                <button type="button" className="lp-card-link-btn">Integration Portal</button>
                            </div>
                            <div className="lp-card-icons">
                                <span className="material-symbols-outlined">token</span>
                                <span className="material-symbols-outlined">database</span>
                                <span className="material-symbols-outlined">security</span>
                            </div>
                        </div>
                    </div>
                    <div className="lp-footer-bottom">
                        <p>© 2024 FleetEdge Intelligence Systems. All Rights Reserved.</p>
                        <div className="lp-footer-legal">
                            <a href="#">Privacy Protocol</a>
                            <a href="#">Governance</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;