import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import UkoLogo from '../../assets/uko-logo.png';
import GoogleLogo from '../../assets/google.svg';
import MobileIcon from '../../assets/mobile.png';
import LoginArtPattern from '../../assets/login-art-pattern.png';
import LottieLoader from '../../components/LottieLoader.jsx';
import './LoginPage.css';
import { LoginPageService } from './LoginPageService.jsx';

const LoginPage = () => {
    const navigate = useNavigate();
    const [emailOrMobile, setEmailOrMobile] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);


    const handleLogin = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const credentials = {
            emailOrMobile: emailOrMobile,
            password: password
        };

        try {
            // Step 1: Attempt Login
            const loginData = await LoginPageService.loginUser(credentials);
            console.log('Login successful:', loginData);

            // Handle new API response structure
            const token = loginData.token || loginData.access_token;
            const user = loginData.user;

            // Store the token immediately
            localStorage.setItem('authToken', token);
            localStorage.setItem('tokenType', 'Bearer');

            // Store user data if available (new API structure)
            if (user) {
                console.log('Storing user data:', {
                    id: user._id || user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    mobileNumber: user.mobileNumber,
                    role: user.role,
                    orgId: user.orgId
                });
                
                localStorage.setItem('user_id', user._id || user.id || '');
                localStorage.setItem('user_email', user.email || '');
                localStorage.setItem('user_role', user.role || '');
                localStorage.setItem('user_firstName', user.firstName || '');
                localStorage.setItem('user_lastName', user.lastName || '');
                localStorage.setItem('user_status', user.status || '');
                localStorage.setItem('user_mobileNumber', user.mobileNumber || '');
                
                // Store orgId if available
                if (user.orgId) {
                    localStorage.setItem('user_orgId', user.orgId);
                }
                
                console.log('LocalStorage after save:', {
                    mobileNumber: localStorage.getItem('user_mobileNumber'),
                    firstName: localStorage.getItem('user_firstName'),
                    email: localStorage.getItem('user_email')
                });

                // Step 2: Role-based routing
                if (user.role === 'SUPER_ADMIN') {
                    toast.success("Welcome Super Admin! Redirecting...");
                    setTimeout(() => {
                        navigate('/superadmin');
                    }, 1500);
                    return;
                }

                // For OWNER and other roles, check if onboarding is completed
                const onboardingCompleted = localStorage.getItem('onboardingCompleted');
                
                if (onboardingCompleted === 'true') {
                    // User has completed onboarding, go to overview
                    toast.success("Welcome back! Redirecting to dashboard...");
                    setTimeout(() => {
                        navigate('/overview');
                    }, 1500);
                } else {
                    // User hasn't completed onboarding yet
                    toast.success("Login successful! Redirecting to onboarding...");
                    setTimeout(() => {
                        navigate('/onboarding');
                    }, 1500);
                }
            }

        } catch (loginApiError) {
            console.error('Login failed:', loginApiError);
            const errorMessage = loginApiError?.detail || loginApiError?.message || 'Login failed. Please check your credentials.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* API Loading Loader */}
            <LottieLoader 
                isLoading={isLoading} 
                size="medium" 
                message="Signing you in..." 
            />

            <div className="login-container">
            <div className="login-form-wrapper">
                <div className="login-form-card">
                    <div className="login-header">
                        <img src={UkoLogo} alt="Uko Logo" className="logo"/>
                        <h1>Sign In</h1>
                    </div>

                    <div className="social-login-tabs">
                        <a href="#" className="social-tab active">Sign in with</a>
                    </div>

                    {/* <div className="social-login-options">
                        <button className="social-btn">
                            <img src={GoogleLogo} alt="Google" />
                            <span>Sign in with Google</span>
                        </button>
                        <button className="social-btn">
                            <img src={MobileIcon} alt="Mobile" />
                            <span>Sign in with Mobile</span>
                        </button>
                    </div> */}
{/* 
                    <div className="divider">
                        <span>Or</span>
                    </div> */}

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="emailOrMobile">Email or Mobile Number</label>
                            <input
                                type="text"
                                id="emailOrMobile"
                                className="form-input"
                                placeholder="Enter email or mobile number"
                                value={emailOrMobile}
                                onChange={(e) => setEmailOrMobile(e.target.value)}
                                required
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
            <div className="login-art-panel">
                 <img src={LoginArtPattern} alt="Decorative Art" />
            </div>
        </div>
        </>
    );
};

export default LoginPage;