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

import { ProfileService } from '../Profile/ProfileService.jsx';

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);


    const handleLogin = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const credentials = {
            email: email,
            password: password
        };

        try {
            // Step 1: Attempt Login
            const loginData = await LoginPageService.loginUser(credentials);
            console.log('Login successful:', loginData);
            toast.success("Login successful! Loading your profile...");

            const token = loginData.access_token;
            // Store the token immediately
            localStorage.setItem('authToken', token);
            localStorage.setItem('tokenType', loginData.token_type);

            // Step 2: Fetch Profile to check onboarding status
            try {
                const profileData = await ProfileService.getProfile(token);
                console.log('Profile fetched:', profileData);

                // Store individual profile fields in localStorage
                localStorage.setItem('profile_id', profileData.id);
                localStorage.setItem('profile_user_id', profileData.user_id);
                localStorage.setItem('profile_company_name', profileData.company_name);
                localStorage.setItem('profile_business_ref_id', profileData.business_ref_id);
                localStorage.setItem('profile_color', profileData.profile_color);
                localStorage.setItem('profile_is_onboarded', profileData.is_onboarded.toString());
                localStorage.setItem('profile_is_superadmin', profileData.is_superadmin.toString());

                // Step 3: Redirect based on onboarding status
                if (profileData.is_onboarded) {
                    toast.success("Welcome back! Redirecting to dashboard...");
                    setTimeout(() => {
                        navigate('/overview'); // User is onboarded, go to dashboard
                    }, 1500);
                } else {
                    toast.info("Please complete your onboarding process.");
                    setTimeout(() => {
                        navigate('/onboarding');
                    }, 1500);
                }
            } catch (profileError) {
                // Check if the profile fetch failed specifically because it wasn't found (404)
                // Note: Axios errors often have error.response.status
                 if (profileError?.detail === "Profile not found for this user. Please complete onboarding.") {
                     console.log('Profile not found, redirecting to onboarding.');
                     toast.info("Please complete your onboarding process.");
                     setTimeout(() => {
                         navigate('/onboarding'); // User exists but has no profile, needs onboarding
                     }, 1500);
                 } else {
                     // Handle other errors during profile fetch (e.g., server error)
                     console.error('Failed to fetch profile:', profileError);
                     const errorMessage = profileError?.detail || 'Logged in, but failed to retrieve profile status.';
                     toast.error(errorMessage);
                 }
            }

        } catch (loginApiError) {
            console.error('Login failed:', loginApiError);
            const errorMessage = loginApiError?.detail || 'Login failed. Please check your credentials.';
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
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                className="form-input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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