import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { clearAuthData } from '../../../utils/authUtils';

const StepProfile = ({ onNext, onBack, onDataChange, formData }) => {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [userId, setUserId] = useState('');
    const [orgId, setOrgId] = useState('');
    const [gstin, setGstin] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if token exists, if not logout
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found. Redirecting to login.');
            toast.error('Session expired. Please login again.');
            clearAuthData();
            navigate('/login');
            return;
        }

        // Load user data from localStorage (stored during login)
        const loadUserData = () => {
            setIsLoading(true);

            try {
                const userFirstName = localStorage.getItem('user_firstName') || '';
                const userLastName = localStorage.getItem('user_lastName') || '';
                const userEmail = localStorage.getItem('user_email') || '';
                const userMobile = localStorage.getItem('user_mobileNumber') || '';
                const userIdValue = localStorage.getItem('user_id') || '';
                const userOrgId = localStorage.getItem('user_orgId') || '';

                console.log('Loading user data from localStorage:', {
                    firstName: userFirstName,
                    lastName: userLastName,
                    email: userEmail,
                    mobileNumber: userMobile,
                    userId: userIdValue,
                    orgId: userOrgId
                });

                setFirstName(userFirstName);
                setLastName(userLastName);
                setEmail(userEmail);
                setPhone(userMobile);
                setUserId(userIdValue);
                setOrgId(userOrgId);

                // Load saved GSTIN from sessionStorage if available
                const savedProfile = sessionStorage.getItem('onboardingProfile');
                if (savedProfile) {
                    const parsed = JSON.parse(savedProfile);
                    setGstin(parsed.gstin || '');
                }

                // Store in sessionStorage for later steps
                sessionStorage.setItem('onboardingUser', JSON.stringify({
                    id: userIdValue,
                    orgId: userOrgId,
                    firstName: userFirstName,
                    lastName: userLastName,
                    email: userEmail,
                    mobileNumber: userMobile,
                }));

                if (userFirstName && userEmail) {
                    toast.success('Profile loaded successfully');
                } else {
                    toast.warning('Some profile data may be missing');
                }
            } catch (error) {
                console.error('Could not load user data from localStorage:', error);
                toast.error('Failed to load user information. Please log in again.');
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [navigate]);

    // Update parent component when data changes - REMOVE onDataChange from dependencies to prevent infinite loop
    useEffect(() => {
        if (!isLoading && firstName && email) {
            onDataChange({
                firstName,
                lastName,
                email,
                phone,
                id: userId,
                orgId: orgId,
                gstin,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [firstName, lastName, email, phone, userId, orgId, gstin, isLoading]);

    const handleSave = () => {
        // User data is read-only from localStorage, just proceed to next step
        if (!firstName || !email) {
            toast.error('User data is incomplete. Please contact support.');
            return;
        }

        // Optional GSTIN validation
        if (gstin && gstin.trim()) {
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstinRegex.test(gstin.trim())) {
                toast.warning('GSTIN format may be invalid. Please verify (format: 27ABCDE1234F1Z5)');
                // Don't block, just warn
            }
        }

        // Save profile data including GSTIN to sessionStorage
        const profileData = {
            firstName,
            lastName,
            email,
            phone,
            gstin,
            id: userId,
            orgId: orgId,
        };
        sessionStorage.setItem('onboardingProfile', JSON.stringify(profileData));

        toast.success('Profile confirmed', { autoClose: 1500 });
        onNext();
    };

    if (isLoading) {
        return (
            <div className="ob-step-body ob-step-loading">
                <div className="ob-spinner" />
                <p>Loading your profile…</p>
            </div>
        );
    }

    return (
        <div className="ob-step-body">
            <div className="ob-step-header">
                <h2>Review Your Profile</h2>
                <p>Let's confirm your basic information before we continue.</p>
            </div>

            <div className="form-section">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="firstName">FIRST NAME</label>
                        <input
                            type="text"
                            id="firstName"
                            className="form-input ob-input--readonly"
                            value={firstName}
                            readOnly
                            disabled
                        />
                        <small className="form-hint">Loaded from your account</small>
                    </div>
                    <div className="form-group">
                        <label htmlFor="lastName">LAST NAME</label>
                        <input
                            type="text"
                            id="lastName"
                            className="form-input ob-input--readonly"
                            value={lastName}
                            readOnly
                            disabled
                        />
                        <small className="form-hint">Loaded from your account</small>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="email">EMAIL</label>
                    <input
                        type="email"
                        id="email"
                        className="form-input ob-input--readonly"
                        value={email}
                        readOnly
                        disabled
                    />
                    <small className="form-hint">Loaded from your account</small>
                </div>

                <div className="form-group">
                    <label htmlFor="phone">MOBILE NUMBER</label>
                    <input
                        type="tel"
                        id="phone"
                        className="form-input ob-input--readonly"
                        value={phone || 'Not provided'}
                        readOnly
                        disabled
                    />
                    <small className="form-hint">Loaded from your account</small>
                </div>
            </div>

            <div className="ob-notice ob-notice--blue">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm1 12H7V7h2v5zm0-6H7V4h2v2z" fill="#3B82F6" />
                </svg>
                <span>Profile information is loaded from your account and cannot be edited here.</span>
            </div>

            <div className="ob-step-footer">
                <button type="button" className="ob-btn ob-btn--ghost ob-btn--back" onClick={onBack}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back
                </button>
                <button
                    type="button"
                    className="ob-btn ob-btn--dark"
                    onClick={handleSave}
                >
                    Continue
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default StepProfile;