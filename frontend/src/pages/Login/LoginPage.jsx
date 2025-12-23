import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// --- Assets ---
import UkoLogo from '../../assets/uko-logo.png';
import LottieLoader from '../../components/LottieLoader.jsx';

// --- Local Fallback Images (Make sure these files exist in your assets folder) ---
import FleetLocal from '../../assets/carousel/carosel_image_1.avif';
import AnalyticsLocal from '../../assets/carousel/carousel_image_2.avif';
import LogisticsLocal from '../../assets/carousel/carousel_image_3.avif';
import SafetyLocal from '../../assets/carousel/carousel_image_4.avif';

// --- Styles & Services ---
import './LoginPage.css';
import { LoginPageService } from './LoginPageService.jsx';
import { ProfileService } from '../Profile/ProfileService.jsx';

// --- Carousel Data ---
const slideData = [
    {
        image: FleetLocal,
        title: "Fleet Tracking",
        desc: "Real-time monitoring for your entire fleet. Know where your assets are at all times.",
    },
    {
        image: AnalyticsLocal,
        title: "Smart Analytics",
        desc: "Data-driven insights to optimize routes, reduce fuel consumption, and increase efficiency.",
    },
    {
        image: LogisticsLocal,
        title: "Global Logistics",
        desc: "Seamless cross-border management ensuring your cargo reaches its destination on time.",
    },
    {
        image: SafetyLocal,
        title: "Driver Safety",
        desc: "Advanced telematics to monitor driver behavior and ensure safety compliance on the road.",
    },
];

const LoginPage = () => {
    const navigate = useNavigate();

    // --- Form State ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // --- Carousel State ---
    const [currentSlide, setCurrentSlide] = useState(0);

    // --- Carousel Logic: Auto Rotate ---
    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slideData.length);
        }, 5000);
        return () => clearInterval(slideInterval);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slideData.length);
    };

    const goToSlide = (index, e) => {
        if (e) e.stopPropagation();
        setCurrentSlide(index);
    };

    // --- Image Fallback Logic ---
    const handleImageError = (e) => {
        // Log error if local image fails to load (shouldn't happen in normal conditions)
        console.error('Image failed to load:', e.target.src);
    };

    // --- Core Login Logic ---
    const handleLogin = async (event) => {
        event.preventDefault();
        setIsLoading(true);

        const credentials = { email, password };

        try {
            const loginData = await LoginPageService.loginUser(credentials);
            toast.success("Login successful! Loading your profile...");

            const token = loginData.access_token;
            localStorage.setItem('authToken', token);
            localStorage.setItem('tokenType', loginData.token_type);

            try {
                const profileData = await ProfileService.getProfile(token);

                // Store profile fields
                localStorage.setItem('profile_id', profileData.id);
                localStorage.setItem('profile_user_id', profileData.user_id);
                localStorage.setItem('profile_company_name', profileData.company_name);
                localStorage.setItem('profile_business_ref_id', profileData.business_ref_id);
                localStorage.setItem('profile_color', profileData.profile_color);
                localStorage.setItem('profile_is_onboarded', profileData.is_onboarded.toString());
                localStorage.setItem('profile_is_superadmin', profileData.is_superadmin.toString());

                if (profileData.is_onboarded) {
                    setTimeout(() => navigate('/overview'), 1500);
                } else {
                    toast.info("Please complete your onboarding process.");
                    setTimeout(() => navigate('/onboarding'), 1500);
                }
            } catch (profileError) {
                if (profileError?.detail === "Profile not found for this user. Please complete onboarding.") {
                    toast.info("Please complete your onboarding process.");
                    setTimeout(() => navigate('/onboarding'), 1500);
                } else {
                    const errorMessage = profileError?.detail || 'Logged in, but failed to retrieve profile status.';
                    toast.error(errorMessage);
                }
            }

        } catch (loginApiError) {
            const errorMessage = loginApiError?.detail || 'Login failed. Please check your credentials.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <LottieLoader isLoading={isLoading} size="medium" message="Signing you in..." />

            <div className="login-container">
                
                {/* --- LEFT SIDE: FORM --- */}
                <div className="login-form-wrapper">
                    <div className="login-form-card">
                        <div className="login-header">
                            <img src={UkoLogo} alt="Uko Logo" className="logo" />
                            <h1>Sign In</h1>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                />
                            </div>

                            <div className="form-options">
                                <div className="remember-me">
                                    <label className="toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                        />
                                        <span className="slider-switch"></span>
                                    </label>
                                    <span>Remember Me</span>
                                </div>
                                <Link to="#" className="forgot-password">Forgot Password?</Link>
                            </div>

                            <button type="submit" className="signin-button" disabled={isLoading}>
                                {isLoading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="signup-link">
                            <span>Don't have an account? </span><Link to="/contact">Contact Us</Link>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT SIDE: FLOATING CAROUSEL --- */}
                <div className="right-panel-container">
                    {/* Background Images */}
                    {slideData.map((slide, index) => (
                        <img
                            key={index}
                            src={slide.image}
                            onError={handleImageError}
                            className={`slide-bg ${index === currentSlide ? "active" : ""}`}
                            alt={`${slide.title}`}
                        />
                    ))}

                    {/* Blue Blur Vectors */}
                    <div className="vector-1"></div>
                    <div className="vector-2"></div>
                    <div className="vector-3"></div>
                    <div className="vector-4"></div>

                    {/* Glass Card */}
                    <div className="glass-card" onClick={nextSlide}>
                        <div className="card-title">{slideData[currentSlide].title}</div>
                        <div className="card-desc">{slideData[currentSlide].desc}</div>

                        <div className="card-dots">
                            {slideData.map((_, index) => (
                                <div
                                    key={index}
                                    className={`card-dot ${index === currentSlide ? "active" : "inactive"}`}
                                    onClick={(e) => goToSlide(index, e)}
                                ></div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Navigation Pill */}
                    <div className="bottom-pill">
                        {slideData.map((_, index) => (
                            <div
                                key={index}
                                className={`nav-dot ${index === currentSlide ? "active" : "inactive"}`}
                                onClick={(e) => goToSlide(index, e)}
                            ></div>
                        ))}
                    </div>
                </div>

            </div>
        </>
    );
};

export default LoginPage;