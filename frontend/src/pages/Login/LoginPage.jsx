import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// --- Assets ---
import UkoLogo from '../../assets/uko-logo.png';
import LottieLoader from '../../components/LottieLoader.jsx';

// --- Carousel Images ---
import SliderImage1 from '../../carousel/Sidebar Image_1.png';
import SliderImage2 from '../../carousel/Sidebar_image_2.png';
import SliderImage3 from '../../carousel/Sidebar_image_3.png';
import SliderImage4 from '../../carousel/Sidebar_image_4.png';

// --- Styles & Services ---
import './LoginPage.css';
import { LoginPageService } from './LoginPageService.jsx';
import { ProfileService } from '../Profile/ProfileService.jsx';

const LoginPage = () => {
    const navigate = useNavigate();
    
    // --- Form State ---
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // eslint-disable-next-line no-unused-vars
    const [error, setError] = useState(null);

    // --- Carousel Data & State ---
    const [currentSlide, setCurrentSlide] = useState(0);
    
    const slides = [
        {
            image: SliderImage1,
            title: "Fleet Tracking",
            text: "Real-time monitoring for your entire fleet. Know where your assets are at all times."
        },
        {
            image: SliderImage2,
            title: "Smart Analytics",
            text: "Advanced data to optimize every mile driven and reduce operational overhead."
        },
        {
            image: SliderImage3,
            title: "Cost Efficiency",
            text: "Reduce fuel consumption and maintenance costs with AI-driven route planning."
        },
        {
            image: SliderImage4,
            title: "Global Logistics",
            text: "Seamless management across borders. Scale your business operations effortlessly."
        }
    ];

    // --- Carousel Effect ---
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); 
        return () => clearInterval(interval);
    }, [slides.length]);

    // --- Core Login Logic ---
    const handleLogin = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

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
                            <img src={UkoLogo} alt="Uko Logo" className="logo"/>
                            <h1>Sign In</h1>
                        </div>

                        <div className="social-login-tabs">
                            <span className="social-tab active">Sign in with</span>
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
                                        <span className="slider"></span>
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

                {/* --- RIGHT SIDE: CAROUSEL --- */}
                <div className="carousel-panel">
                    
                    {/* Background Images */}
                    {slides.map((slide, index) => (
                        <div 
                            key={index} 
                            className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                        >
                            <img src={slide.image} alt={slide.title} />
                        </div>
                    ))}

                    {/* Floating Overlay Card */}
                    <div className="carousel-card">
                        <h2>{slides[currentSlide].title}</h2>
                        <p>{slides[currentSlide].text}</p>

                        <div className="carousel-indicators">
                            {slides.map((_, index) => (
                                <span 
                                    key={index}
                                    className={`indicator ${index === currentSlide ? 'active' : ''}`}
                                    onClick={() => setCurrentSlide(index)}
                                ></span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default LoginPage;