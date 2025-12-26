import React, { useState, useEffect } from 'react';
import { validateTokenBeforeRequest, handleAuthError } from '../../utils/authUtils';
import './ProfilePage.css';

// Import assets
import DefaultAvatar from '../../assets/default-avatar.png';
import UserIcon from '../../assets/user-icon.svg';

// Import the services
import { ProfileService } from './ProfileService.jsx';
import { getThemeCSS } from '../../utils/colorTheme';

const ProfilePage = () => {
    const [profileData, setProfileData] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [profileError, setProfileError] = useState(null);
    const [themeColors, setThemeColors] = useState(getThemeCSS());

    // Update theme colors when component mounts
    useEffect(() => {
        setThemeColors(getThemeCSS());
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            // Validate token before making request
            if (!validateTokenBeforeRequest()) {
                setIsLoadingProfile(false);
                setProfileError('Authentication token not found or expired. Please log in again.');
                return;
            }

            setIsLoadingProfile(true);
            setProfileError(null);
            try {
                const token = localStorage.getItem('authToken');
                // Fetch both profile and user info in parallel
                const [profileResponse, userInfoResponse] = await Promise.all([
                    ProfileService.getProfile(token),
                    ProfileService.getUserInfo()
                ]);
                setProfileData(profileResponse);
                setUserInfo(userInfoResponse);
                // Store individual profile fields in localStorage
                if (profileResponse._id) localStorage.setItem('profile_id', profileResponse._id);
                if (profileResponse.ownerEmail) localStorage.setItem('profile_owner_email', profileResponse.ownerEmail);
                if (profileResponse.companyName) localStorage.setItem('profile_company_name', profileResponse.companyName);
                if (profileResponse.gstin) localStorage.setItem('profile_gstin', profileResponse.gstin);
                if (profileResponse.primaryThemeColor) localStorage.setItem('primaryThemeColor', profileResponse.primaryThemeColor);
                console.log("Profile data fetched:", profileResponse);
                console.log("User info fetched:", userInfoResponse);
            } catch (apiError) {
                console.error('Failed to fetch profile:', apiError);
                setProfileError(apiError?.detail || 'Failed to load profile information.');
                
                // Handle 401 errors with auto-logout
                if (handleAuthError(apiError)) {
                    // Auth error handled, user will be redirected
                    return;
                }
            } finally {
                setIsLoadingProfile(false);
            }
        };
        fetchProfile();
    }, []);

    const renderContent = () => {
        // Profile loading is now handled by DashboardLayout
        if (profileError) return <div className="profile-card error-message">{profileError}</div>;
        if (!profileData) return <div className="profile-card">Could not load profile data.</div>;
        return <UserInfo profile={profileData} userInfo={userInfo} />;
    };

    return (
        <div className="profile-container" style={themeColors}>
            <div className="profile-sidebar">
                <h3>User Profile</h3>
            </div>
            <div className="profile-content">{renderContent()}</div>
        </div>
    );
};

// UserInfo component - Display only, no editing
const UserInfo = ({ profile, userInfo }) => {
    // Split username into first and last name
    const nameParts = userInfo?.username?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return (
        <div className="profile-card">
            <h4>Your account information</h4>
            <div className="avatar-section">
                 <div className="avatar-container">
                     <img src={DefaultAvatar} alt="User Avatar" className="avatar-img" />
                 </div>
                 <div className="avatar-details">
                     <h5>{profile?.company_name || 'Company Name'}</h5>
                     <p>Business Ref: {profile?.business_ref_id || 'N/A'}</p>
                      <p>Role: {profile?.is_superadmin ? 'Super Admin' : 'Admin'}</p>
                 </div>
            </div>
            <div className="info-form">
                <div className="form-row">
                     <div className="form-group">
                         <label>First Name</label>
                         <input 
                             type="text" 
                             value={firstName} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Last Name</label>
                         <input 
                             type="text" 
                             value={lastName} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                </div>
                 <div className="form-row">
                     <div className="form-group">
                         <label>Location</label>
                         <input 
                             type="text" 
                             value={userInfo?.location || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Mobile Number</label>
                         <input 
                             type="tel" 
                             value={userInfo?.mobile_number || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                </div>
                 <div className="form-row">
                     <div className="form-group">
                         <label>GSTIN</label>
                         <input 
                             type="text" 
                             value={userInfo?.gstin || 'N/A'} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                     <div className="form-group">
                         <label>Email</label>
                         <input 
                             type="email" 
                             value={userInfo?.email || ''} 
                             disabled 
                             className="profile-input-disabled"
                         />
                     </div>
                </div>
                <div className="form-actions">
                    <div className="profile-edit-notice">
                        <p>If you need to edit your information, please contact the administrator.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;