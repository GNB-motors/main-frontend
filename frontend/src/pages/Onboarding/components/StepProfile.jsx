import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../utils/axiosConfig';

const StepProfile = ({ onNext, onDataChange, formData }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [location, setLocation] = useState('');
    const [gstin, setGstin] = useState('');
    const [userId, setUserId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Fetch user data from users table (profile doesn't exist yet during onboarding)
        const loadUserData = async () => {
            setIsLoading(true);
            
            try {
                // Try multiple possible endpoints; backends often prefix auth differently
                const candidates = [
                    '/api/v1/auth/me',
                    '/api/v1/login/me',
                    '/api/v1/users/me',
                    '/auth/me',
                    '/login/me',
                    '/users/me',
                ];

                let user = null;
                for (const ep of candidates) {
                    try {
                        const r = await apiClient.get(ep);
                        user = r.data;
                        break;
                    } catch (e) {
                        // keep trying next endpoint
                    }
                }

                if (!user) {
                    throw new Error('No user endpoint responded');
                }
                
                setUserData(user);
                setUsername(user.username || '');
                setEmail(user.email || '');
                setPhone(user.mobile_number || '');
                setLocation(user.location || '');
                setGstin(user.gstin || '');
                setUserId(user.id || '');
                
                // Store in sessionStorage for later steps
                sessionStorage.setItem('onboardingUser', JSON.stringify({
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    mobile_number: user.mobile_number,
                    location: user.location,
                    gstin: user.gstin,
                }));
            } catch (error) {
                console.error('Could not fetch user data:', error);
                
                // Fallback: decode token to get basic user info
                try {
                    const token = localStorage.getItem('authToken');
                    if (token) {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        setEmail(payload.sub || '');
                        setUsername(payload.sub?.split('@')[0] || 'User');
                        toast.warning('Loaded basic user info from session');
                        
                        sessionStorage.setItem('onboardingUser', JSON.stringify({
                            username: payload.sub?.split('@')[0] || 'User',
                            email: payload.sub || '',
                            mobile_number: '',
                            location: '',
                            gstin: ''
                        }));
                    }
                } catch (fallbackError) {
                    toast.error('Failed to load user information. Please log in again.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, []);

    // Update parent component when data changes
    useEffect(() => {
        onDataChange({
            username,
            email,
            phone,
            location,
            gstin,
            id: userId,
        });
    }, [username, email, phone, location, gstin, userId, onDataChange]);

    const handleSave = () => {
        // User data is read-only from backend, just proceed to next step
        if (!username || !email) {
            toast.error('User data is incomplete. Please contact support.');
            return;
        }

        toast.success('Profile confirmed', { autoClose: 1500 });
        onNext();
    };

    if (isLoading) {
        return (
            <div className="step-loading">
                <div className="spinner"></div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="step-container">
            <div className="step-header">
                <h2>Review Your Profile</h2>
                <p className="step-description">
                    Let's start by confirming your basic information
                </p>
            </div>

            <div className="form-section">
                <div className="form-group">
                    <label htmlFor="username">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        className="form-input"
                        value={username}
                        readOnly
                        disabled
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                    <small className="form-hint">Loaded from your account</small>
                </div>

                <div className="form-group">
                    <label htmlFor="email">
                        Email
                    </label>
                    <input
                        type="email"
                        id="email"
                        className="form-input"
                        value={email}
                        readOnly
                        disabled
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                    <small className="form-hint">Loaded from your account</small>
                </div>

                <div className="form-group">
                    <label htmlFor="phone">
                        Phone Number
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        className="form-input"
                        value={phone || 'Not provided'}
                        readOnly
                        disabled
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                    <small className="form-hint">Loaded from your account</small>
                </div>

                <div className="form-group">
                    <label htmlFor="location">
                        Location
                    </label>
                    <input
                        type="text"
                        id="location"
                        className="form-input"
                        value={location || 'Not provided'}
                        readOnly
                        disabled
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                    <small className="form-hint">Loaded from your account</small>
                </div>

                <div className="form-group">
                    <label htmlFor="gstin">
                        GSTIN
                    </label>
                    <input
                        type="text"
                        id="gstin"
                        className="form-input"
                        value={gstin || 'Not provided'}
                        readOnly
                        disabled
                        style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    />
                    <small className="form-hint">Loaded from your account</small>
                </div>

                
            </div>

            <div className="step-notice" style={{ backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z" fill="#3B82F6"/>
                </svg>
                <span>Profile information is loaded from your account and cannot be edited here.</span>
            </div>

            <div className="step-actions">
                <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSave}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default StepProfile;
