import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { ProfileService } from '../../../pages/Profile/ProfileService.jsx';
import apiClient from '../../../utils/axiosConfig';

const StepProfile = ({ onNext, onDataChange, formData }) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load from localStorage or fetch from API
        const loadProfileData = async () => {
            setIsLoading(true);
            
            // First check localStorage for saved onboarding data
            const savedData = localStorage.getItem('onboardingProfile');
            if (savedData) {
                const parsed = JSON.parse(savedData);
                setFirstName(parsed.firstName || '');
                setLastName(parsed.lastName || '');
                setPhone(parsed.phone || '');
                setIsLoading(false);
                return;
            }

            // Try to fetch existing user info from backend
            try {
                const userInfo = await ProfileService.getUserInfo();
                
                // Split username into first and last name
                const nameParts = userInfo.username?.split(' ') || ['', ''];
                const fName = nameParts[0] || '';
                const lName = nameParts.slice(1).join(' ') || '';
                
                setFirstName(fName);
                setLastName(lName);
                setPhone(userInfo.mobile_number || '');
            } catch (error) {
                console.error('Could not fetch user info:', error);
                // Continue with empty fields
            } finally {
                setIsLoading(false);
            }
        };

        loadProfileData();
    }, []);

    // Update parent component when data changes
    useEffect(() => {
        onDataChange({
            firstName,
            lastName,
            phone
        });
    }, [firstName, lastName, phone, onDataChange]);

    const handleSave = async () => {
        // Validation
        if (!firstName.trim()) {
            toast.error('Please enter your first name');
            return;
        }
        if (!lastName.trim()) {
            toast.error('Please enter your last name');
            return;
        }
        if (!phone.trim()) {
            toast.error('Please enter your phone number');
            return;
        }

        // Phone validation (basic)
        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(phone.replace(/[\s-()]/g, ''))) {
            toast.error('Please enter a valid phone number');
            return;
        }

        // Save to localStorage
        const profileData = { firstName, lastName, phone };
        localStorage.setItem('onboardingProfile', JSON.stringify(profileData));

        // SYMBOLIC SAVE: backend editing disabled
        // Try to call the API but treat as symbolic
        try {
            const fullName = `${firstName} ${lastName}`.trim();
            await apiClient.put('/api/v1/profile/me', {
                username: fullName,
                mobile_number: phone
            });
            
            toast.info('✓ Profile saved locally (backend updates disabled)', {
                autoClose: 2000
            });
        } catch (error) {
            console.log('Profile update symbolic save:', error);
            toast.info('✓ Profile saved locally (backend updates disabled)', {
                autoClose: 2000
            });
        }

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
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="firstName">
                            First Name <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="firstName"
                            className="form-input"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Enter your first name"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastName">
                            Last Name <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="lastName"
                            className="form-input"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Enter your last name"
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="phone">
                        Phone Number <span className="required">*</span>
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        className="form-input"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        required
                    />
                    <small className="form-hint">Enter 10-15 digit phone number</small>
                </div>
            </div>

            <div className="step-notice">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z" fill="#F59E0B"/>
                </svg>
                <span>Changes are saved locally. Backend editing is currently disabled.</span>
            </div>

            <div className="step-actions">
                <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleSave}
                >
                    Save & Continue
                </button>
            </div>
        </div>
    );
};

export default StepProfile;
