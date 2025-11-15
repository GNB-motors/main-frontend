import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../utils/axiosConfig';

const StepProfile = ({ onNext, onDataChange, formData }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [profileData, setProfileData] = useState(null);

    useEffect(() => {
        // Fetch profile data from API (read-only)
        const loadProfileData = async () => {
            setIsLoading(true);
            
            try {
                const response = await apiClient.get('/api/v1/profile/me');
                const profile = response.data;
                
                setProfileData(profile);
                setUsername(profile.username || '');
                setEmail(profile.email || '');
                setPhone(profile.mobile_number || '');
                
                // Store in sessionStorage for later steps
                sessionStorage.setItem('onboardingProfile', JSON.stringify({
                    username: profile.username,
                    email: profile.email,
                    phone: profile.mobile_number
                }));
            } catch (error) {
                console.error('Could not fetch profile:', error);
                toast.error('Failed to load profile. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadProfileData();
    }, []);

    // Update parent component when data changes
    useEffect(() => {
        onDataChange({
            username,
            email,
            phone
        });
    }, [username, email, phone, onDataChange]);

    const handleSave = () => {
        // Profile is read-only from backend, just proceed to next step
        if (!username || !email) {
            toast.error('Profile data is incomplete. Please contact support.');
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
